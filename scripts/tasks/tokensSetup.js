import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { LEGACY_ALIASES } from './tokens.js';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const themeRoot = path.resolve( __dirname, '../..' );
const tokensPath = path.join( themeRoot, 'config', 'tokens.json' );
const backupRoot = path.join( themeRoot, '.rig-backup' );

/**
 * Detects the tokens.json schema version.
 *
 * @param {Object} raw Parsed tokens.json (or any value).
 * @return {number} 2 (layered v2), 1 (flat v1), or 0 (absent/invalid).
 */
export function detectSchemaVersion( raw ) {
	if ( ! raw || typeof raw !== 'object' || Array.isArray( raw ) ) {
		return 0;
	}
	if ( raw.meta?.version === 2 || raw.primitives ) {
		return 2;
	}
	if ( raw.colors || raw.typography || raw.spacing || raw.breakpoints ) {
		return 1;
	}
	return 0;
}

/**
 * Drops keys whose value is undefined (so partial v1 configs upgrade cleanly).
 *
 * @param {Object} obj Source object.
 * @return {Object} Object without undefined values.
 */
function compact( obj ) {
	return Object.fromEntries(
		Object.entries( obj ).filter( ( [ , value ] ) => value !== undefined )
	);
}

/**
 * Upgrades a v1 flat token file to the layered v2 shape.
 *
 * v1 carries no dark data, so `meta.darkMode` is set to `"none"` (existing
 * hand-authored dark CSS keeps working) and each semantic pair mirrors light.
 *
 * @param {Object} raw v1 tokens.
 * @return {Object} v2 tokens.
 */
export function upgradeV1ToV2( raw ) {
	const colors = raw.colors || {};
	const typography = raw.typography || {};
	const spacing = raw.spacing || {};
	const breakpoints = raw.breakpoints || {};

	const color = compact( {
		brand: colors.primary ? { 500: colors.primary } : undefined,
		accent: colors.secondary ? { 500: colors.secondary } : undefined,
		neutral: compact( {
			0: colors.background,
			100: colors.white,
			500: colors.grey,
			700: colors.text,
			900: colors.black,
		} ),
		red: colors.red ? { 500: colors.red } : undefined,
		green: colors.green ? { 500: colors.green } : undefined,
		blue: colors.blue ? { 500: colors.blue } : undefined,
		yellow: colors.yellow ? { 500: colors.yellow } : undefined,
	} );

	const pair = ( value ) =>
		value ? { light: value, dark: value } : undefined;
	const semantic = compact( {
		surface: pair( colors.background ),
		text: pair( colors.text ),
	} );

	return {
		$schema: './tokens.schema.json',
		meta: {
			version: 2,
			colorSpace: 'hex',
			darkMode: 'none',
			generator: 'wp-rig',
			...( typography.fluid ? { fluid: typography.fluid } : {} ),
		},
		primitives: {
			color,
			layout: compact( {
				content: spacing[ 'content-width' ],
				wide: spacing[ 'wide-width' ],
			} ),
			space: compact( { base: spacing.base } ),
			font: {
				family: typography.fontFamilies || {},
				size: typography.fontSizes || {},
				leading: compact( { base: typography.lineHeight } ),
			},
			breakpoint: breakpoints,
		},
		semantic,
	};
}

/**
 * Builds the legacy -> canonical rename map for the codemod. Excludes
 * `--mobile-breakpoint` (kept as a literal because JS reads it directly).
 *
 * @return {Object} Map of legacy var name -> canonical var name.
 */
export function buildRenameMap() {
	return {
		...LEGACY_ALIASES,
		// The misnomer is dropped entirely once usages are rewritten; JS reads
		// `--breakpoint-tablet` instead.
		'--mobile-breakpoint': '--breakpoint-tablet',
	};
}

/**
 * Escapes a string for use in a RegExp.
 *
 * @param {string} value Raw string.
 * @return {string} Escaped string.
 */
function escapeRegExp( value ) {
	return value.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
}

/**
 * Rewrites legacy custom-property references to canonical names.
 *
 * Handles `var(--old)`, `var(--old, fallback)`, `--old:` declarations,
 * `@custom-media --old`, and JS string literals (`'--old'` / `"--old"`). The
 * negative lookahead prevents partial matches (e.g. `--color-red` inside
 * `--color-red-500`).
 *
 * @param {string} content   File source.
 * @param {Object} renameMap legacy -> canonical map.
 * @return {Object} { content, replacements } with the count of changed names.
 */
export function rewriteVarReferences( content, renameMap ) {
	let next = content;
	const replacements = {};

	for ( const [ legacy, canonical ] of Object.entries( renameMap ) ) {
		const pattern = new RegExp(
			`${ escapeRegExp( legacy ) }(?![\\w-])`,
			'g'
		);
		const matches = next.match( pattern );
		if ( matches ) {
			replacements[ legacy ] = matches.length;
			next = next.replace( pattern, canonical );
		}
	}

	return { content: next, replacements };
}

/**
 * Lists source files the codemod should sweep (CSS + PHP + JS + JSON),
 * excluding generated and vendor files.
 *
 * @return {Array<string>} Absolute file paths.
 */
export async function listCodemodTargets() {
	const glob = ( await import( 'fast-glob' ) ).default;
	const patterns = [
		'assets/css/src/**/*.css',
		'**/*.php',
		'assets/js/src/**/*.{js,ts,jsx,tsx}',
		'config/tailwind.custom.js',
		'config/theme.custom.json',
	];
	const ignore = [
		'**/node_modules/**',
		'**/vendor/**',
		'assets/css/src/_tokens.generated.css',
		'**/*.min.css',
		'**/*.min.js',
	];

	return glob( patterns, { cwd: themeRoot, absolute: true, ignore } );
}

/**
 * Plans (does not apply) the codemod: which files change and how many
 * references per file. Pure-ish (reads files, writes nothing).
 *
 * @param {Object} [renameMap] Override map (defaults to buildRenameMap()).
 * @return {Promise<Object>} { files: [...], totalReplacements }.
 */
export async function planCodemod( renameMap = buildRenameMap() ) {
	const targets = await listCodemodTargets();
	const files = [];
	let totalReplacements = 0;

	for ( const file of targets ) {
		const content = await fs.readFile( file, 'utf8' );
		const { replacements } = rewriteVarReferences( content, renameMap );
		const count = Object.values( replacements ).reduce(
			( sum, n ) => sum + n,
			0
		);

		if ( count > 0 ) {
			files.push( {
				file: path.relative( themeRoot, file ),
				replacements,
				count,
			} );
			totalReplacements += count;
		}
	}

	return { files, totalReplacements };
}

/**
 * Applies the codemod, backing up every touched file first.
 *
 * @param {Object} [renameMap] Override map.
 * @return {Promise<Object>} { changed, backupDir }.
 */
export async function applyCodemod( renameMap = buildRenameMap() ) {
	const plan = await planCodemod( renameMap );
	const stamp = new Date().toISOString().replace( /[:.]/g, '-' );
	const backupDir = path.join( backupRoot, `${ stamp }`, 'tokens-setup' );
	const changed = [];

	for ( const entry of plan.files ) {
		const abs = path.join( themeRoot, entry.file );
		await fs.copy( abs, path.join( backupDir, entry.file ) );
		const content = await fs.readFile( abs, 'utf8' );
		const { content: next } = rewriteVarReferences( content, renameMap );
		await fs.writeFile( abs, next );
		changed.push( entry.file );
	}

	return { changed, backupDir };
}

/**
 * CLI entry: reports the schema version and plans (or applies) the codemod.
 *
 * @param {Object} [argv] Parsed flags { apply, yes, dryRun }.
 * @return {Promise<void>}
 */
export async function runTokensSetup( argv = {} ) {
	const apply = Boolean( argv.apply );
	const raw = ( await fs.pathExists( tokensPath ) )
		? await fs.readJson( tokensPath )
		: null;
	const version = detectSchemaVersion( raw );

	console.log(
		`[tokens:setup] tokens.json schema: ${
			version === 0 ? 'absent/invalid' : `v${ version }`
		}`
	);

	if ( version === 1 ) {
		console.log(
			'[tokens:setup] v1 detected — upgrade available (use --apply to write).'
		);
		if ( apply ) {
			await fs.writeJson( tokensPath, upgradeV1ToV2( raw ), {
				spaces: 2,
			} );
			console.log( '[tokens:setup] tokens.json upgraded to v2.' );
		}
	} else if ( version === 2 ) {
		console.log( '[tokens:setup] already v2 — no schema upgrade needed.' );
	}

	const plan = await planCodemod();
	console.log(
		`[tokens:setup] codemod: ${ plan.totalReplacements } legacy reference(s) across ${ plan.files.length } file(s).`
	);
	for ( const entry of plan.files ) {
		console.log( `  ${ entry.file } (${ entry.count })` );
	}

	if ( apply && plan.totalReplacements > 0 ) {
		const { backupDir } = await applyCodemod();
		console.log( `[tokens:setup] applied. Backup: ${ backupDir }` );
	} else if ( ! apply ) {
		console.log( '[tokens:setup] dry-run only — pass --apply to write.' );
	}
}

const invokedDirectly =
	process.argv[ 1 ] &&
	path.resolve( process.argv[ 1 ] ) ===
		path.resolve( fileURLToPath( import.meta.url ) );

if ( invokedDirectly ) {
	const argv = process.argv.slice( 2 );
	runTokensSetup( { apply: argv.includes( '--apply' ) } ).catch(
		( error ) => {
			console.error( error.message );
			process.exit( 1 );
		}
	);
}
