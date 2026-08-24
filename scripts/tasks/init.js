import fs from 'node:fs';
import path from 'node:path';
import inquirer from 'inquirer';
import { exec } from '../lib/cli-utils.js';

/**
 * Initializes WP Rig theme configuration.
 *
 * @param {Object} opts Initialization options
 */
export default async function runInit( opts = {} ) {
	const root = process.cwd();
	const configDir = path.join( root, 'config' );
	const defaultConfigPath = path.join( configDir, 'config.default.json' );
	const configJsonPath = path.join( configDir, 'config.json' );
	const localConfigPath = path.join( configDir, 'config.local.json' );

	if ( ! fs.existsSync( configDir ) ) {
		fs.mkdirSync( configDir, { recursive: true } );
	}

	let defaults = {};
	try {
		if ( fs.existsSync( defaultConfigPath ) ) {
			defaults = JSON.parse(
				fs.readFileSync( defaultConfigPath, 'utf-8' )
			);
		}
	} catch {}

	let userConfig = {};
	if ( fs.existsSync( configJsonPath ) ) {
		try {
			userConfig = JSON.parse(
				fs.readFileSync( configJsonPath, 'utf-8' )
			);
		} catch {}
	}

	const isInteractive =
		process.stdout.isTTY &&
		process.stdin.isTTY &&
		! process.env.CI &&
		! opts.nonInteractive;

	// Theme type choices come from config/paradigms.json (single source of truth).
	let themeTypeChoices = [];
	try {
		const paradigms = JSON.parse(
			fs.readFileSync( path.join( configDir, 'paradigms.json' ), 'utf-8' )
		);
		themeTypeChoices = Object.entries( paradigms.themeTypes ?? {} ).map(
			( [ value, definition ] ) => ( {
				name: definition?.label || value,
				value,
			} )
		);
	} catch {
		themeTypeChoices = [
			{ name: 'Classic (Standard WP Rig)', value: 'classic' },
			{
				name: 'Universal (Hybrid theme with theme.json)',
				value: 'universal',
			},
			{ name: 'Block-based (Full Site Editing)', value: 'block-based' },
		];
	}

	let answers = null;

	if ( isInteractive ) {
		answers = await inquirer.prompt( [
			{
				type: 'input',
				name: 'proxyURL',
				message:
					'Enter your local development domain (without protocol), e.g. mysite.local:10004',
				default:
					defaults?.dev?.browserSync?.proxyURL || 'wprig.test:8888',
				validate: ( input ) =>
					!! String( input ).trim() ||
					'Please enter a domain (e.g. mysite.local:10004)',
			},
			{
				type: 'confirm',
				name: 'https',
				message: 'Use HTTPS with BrowserSync?',
				default: !! defaults?.dev?.browserSync?.https,
			},
			{
				type: 'input',
				name: 'bypassPort',
				message: 'BrowserSync UI/Bypass port to use',
				default: String(
					defaults?.dev?.browserSync?.bypassPort || '8181'
				),
				validate: ( input ) =>
					/^\d{2,5}$/.test( String( input ).trim() ) ||
					'Enter a valid port number (e.g. 8181)',
			},
			{
				type: 'confirm',
				name: 'live',
				message: 'Enable live reload (BrowserSync live)?',
				default: defaults?.dev?.browserSync?.live !== false,
			},
			{
				type: 'list',
				name: 'themeType',
				message: 'What type of theme are you building?',
				choices: themeTypeChoices,
				default: defaults?.theme?.themeType || 'classic',
			},
		] );
	} else {
		answers = {
			proxyURL: defaults?.dev?.browserSync?.proxyURL || 'wprig.test:8888',
			bypassPort: String(
				defaults?.dev?.browserSync?.bypassPort || '8181'
			),
			live: defaults?.dev?.browserSync?.live !== false,
			https: !! defaults?.dev?.browserSync?.https,
			themeType: defaults?.theme?.themeType || 'classic',
		};
	}

	userConfig.theme = {
		...( userConfig.theme || {} ),
		themeType: answers.themeType,
	};

	// Universal and block-based themes are block-capable: enable block
	// compilation by default unless the developer explicitly chose otherwise.
	const isBlockCapable =
		answers.themeType === 'universal' ||
		answers.themeType === 'block-based';
	if (
		isBlockCapable &&
		typeof userConfig.theme.enableBlocks === 'undefined'
	) {
		userConfig.theme.enableBlocks = true;
	}

	userConfig.dev = userConfig.dev || {};
	userConfig.dev.browserSync = {
		...( userConfig.dev.browserSync || {} ),
		proxyURL: answers.proxyURL,
		bypassPort: answers.bypassPort,
		live: !! answers.live,
		https: !! answers.https,
	};

	fs.writeFileSync(
		configJsonPath,
		JSON.stringify( userConfig, null, 2 ) + '\n',
		'utf-8'
	);

	if ( answers.themeType === 'universal' ) {
		console.log( '\nSetting up Universal theme features...' );
		try {
			await exec( 'node node/editorSupport.js', { stdio: 'inherit' } );
		} catch ( err ) {
			console.error(
				`Failed to run editor-support script: ${ err.message }`
			);
		}
	}

	if ( answers.themeType === 'block-based' ) {
		console.log( '\nSetting up Block-based theme features...' );
		try {
			await exec( 'node node/editorSupport.js', { stdio: 'inherit' } );
			await exec( 'node scripts/convert-to-block-theme.js', {
				stdio: 'inherit',
			} );
		} catch ( err ) {
			console.error(
				`Failed to run block-based setup scripts: ${ err.message }`
			);
		}
	}

	console.log( '\nWP Rig initialization complete.' );
	console.log(
		`- Wrote ${ configJsonPath } (overrides defaults in ${ defaultConfigPath }).`
	);
	if ( ! fs.existsSync( localConfigPath ) ) {
		console.log(
			`- Optional: create ${ localConfigPath } for machine-only settings (gitignored).`
		);
	}
	console.log( '\nNext steps:' );
	console.log(
		'  1) Review config at ./config/config.json and tweak theme settings as needed.'
	);
	console.log(
		'  2) If you enabled HTTPS, generate a local certificate: npm run generateCert'
	);
	console.log(
		'  3) Start development server with live reload: npm run dev'
	);
	console.log( '  4) Build assets once: npm run build' );
	console.log(
		'  5) Learn common WP Rig workflows: https://wprig.io/getting-started'
	);
	console.log( '  6) Create a production bundle: npm run bundle' );
}
