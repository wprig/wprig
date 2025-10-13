#!/usr/bin/env node
/*
 Minimal Node-based CLI to replace gulp build and bundle commands in WP Rig.
 This reuses existing task modules under ./gulp and mirrors the task order
 used in gulpfile.js, but without using gulp itself.
*/

import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import inquirer from 'inquirer';
import { Command } from 'commander';

// Reuse existing task modules from the project
import { cleanCSS, cleanJS } from './tasks/clean.js';
import { images, convertToWebP } from './tasks/images.js';
import phpTask from './tasks/php.js';
import fonts from './tasks/fonts.js';
import prodPrep from './tasks/prodPrep.js';
import prodStringReplace from './tasks/prodStringReplace.js';
import prodCompress from './tasks/prodCompress.js';
import { serve, server } from './tasks/browserSync.js';
import { paths } from './lib/constants.js';
import generateCert from './tasks/generateCert.js';

const exec = promisify( execCb );
const program = new Command();

// Utility to run possibly callback-style tasks as promises
function runTask( fn, name = fn?.name || 'task' ) {
	return new Promise( ( resolve, reject ) => {
		try {
			// If function expects a callback, provide it
			if ( typeof fn === 'function' ) {
				if ( fn.length >= 1 ) {
					fn( ( err ) => {
						if ( err ) {
							reject(
								new Error(
									`${ name } failed: ${ err?.message || err }`
								)
							);
						} else {
							resolve();
						}
					} );
					return;
				}
				const result = fn();
				if ( result && typeof result.then === 'function' ) {
					result
						.then( resolve )
						.catch( ( e ) =>
							reject(
								new Error(
									`${ name } failed: ${ e?.message || e }`
								)
							)
						);
				} else {
					resolve();
				}
				return;
			}
			resolve();
		} catch ( e ) {
			reject( new Error( `${ name } threw: ${ e?.message || e }` ) );
		}
	} );
}

async function lintCSS() {
	await exec( 'node lint-css.js', { stdio: 'inherit' } );
}

async function lintJS() {
	// Use flat config if configured in package.json like existing script
	await exec(
		'cross-env ESLINT_USE_FLAT_CONFIG=true eslint "assets/js/src/**/*.{js,jsx,ts,tsx}"',
		{ stdio: 'inherit' }
	);
}

async function buildJS( { dev = false } = {} ) {
	const cmd = dev ? 'npm run dev:js' : 'npm run build:js';
	const { stderr } = await exec( cmd );
	if ( stderr ) {
		// esbuild sometimes prints to stderr for warnings; don't treat as fatal
		console.error( stderr );
	}
}

async function buildCSS( { dev = false } = {} ) {
	const cmd = dev ? 'npm run dev:css' : 'npm run build:css';
	const { stderr } = await exec( cmd );
	if ( stderr ) {
		console.error( stderr );
	}
}

async function runBuild( { phpcs = false, lint = false, dev = false } = {} ) {
	// Clean
	await Promise.all( [
		runTask( cleanCSS, 'cleanCSS' ),
		runTask( cleanJS, 'cleanJS' ),
	] );

	// Lint optionally
	if ( lint ) {
		await Promise.all( [ lintCSS(), lintJS() ] );
	}

	// Build assets in parallel
	await Promise.all( [ buildCSS( { dev } ), buildJS( { dev } ) ] );

	// Images and PHP in parallel
	const postBuildTasks = [
		runTask( images, 'images' ).then( () =>
			runTask( convertToWebP, 'convertToWebP' )
		),
		new Promise( ( resolve, reject ) => {
			try {
				// Always run phpTask; pass through the phpcs flag to control linting only
				phpTask( !! phpcs, ( err ) =>
					err ? reject( err ) : resolve()
				);
			} catch ( e ) {
				reject( e );
			}
		} ),
	];
	await Promise.all( postBuildTasks );
}

async function runBundle( { phpcs = false, lint = false } = {} ) {
	// Prepare production
	await runTask( prodPrep, 'prodPrep' );

	// Clean
	await Promise.all( [
		runTask( cleanCSS, 'cleanCSS' ),
		runTask( cleanJS, 'cleanJS' ),
	] );

	// Lint optionally
	if ( lint ) {
		await Promise.all( [ lintCSS(), lintJS() ] );
	}

	// Build assets for production
	await Promise.all( [
		buildCSS( { dev: false } ),
		buildJS( { dev: false } ),
	] );

	// Images, PHP, fonts in parallel
	const middle = [
		runTask( images, 'images' ).then( () =>
			runTask( convertToWebP, 'convertToWebP' )
		),
		runTask( fonts, 'fonts' ),
		new Promise( ( resolve, reject ) => {
			try {
				// Always run phpTask; pass through the phpcs flag
				phpTask( !! phpcs, ( err ) =>
					err ? reject( err ) : resolve()
				);
			} catch ( e ) {
				reject( e );
			}
		} ),
	];
	await Promise.all( middle );

	// String replace and compress
	await runTask( prodStringReplace, 'prodStringReplace' );
	await runTask( prodCompress, 'prodCompress' );
}

program
	.name( 'wprig' )
	.description( 'WP Rig Node-based build CLI (no gulp)' )
	.version( '0.1.0' );

program
	.command( 'build' )
	.description( 'Build the theme for development or CI' )
	.option( '--phpcs', 'Run PHP CodeSniffer' )
	.option( '--lint', 'Run JS and CSS linters' )
	.option( '--dev', 'Use development mode for asset builders' )
	.action( async ( opts ) => {
		try {
			await runBuild( {
				phpcs: !! opts.phpcs,
				lint: !! opts.lint,
				dev: !! opts.dev,
			} );
			console.log( 'Build completed.' );
		} catch ( e ) {
			console.error( e?.message || e );
			process.exitCode = 1;
		}
	} );

program
	.command( 'bundle' )
	.description( 'Create a production bundle' )
	.option( '--phpcs', 'Run PHP CodeSniffer' )
	.option( '--lint', 'Run JS and CSS linters' )
	.action( async ( opts ) => {
		try {
			// Ensure production env to match previous scripts
			process.env.NODE_ENV = 'production';
			await runBundle( { phpcs: !! opts.phpcs, lint: !! opts.lint } );
			console.log( 'Bundle completed.' );
		} catch ( e ) {
			console.error( e?.message || e );
			process.exitCode = 1;
		}
	} );

// Development command: start server and watch source files without gulp
program
	.command( 'dev' )
	.description( 'Start development server with live reload (no gulp)' )
	.option( '--lint', 'Run JS and CSS linters before starting' )
	.action( async ( opts ) => {
		try {
			// Clean CSS/JS first
			await Promise.all( [
				runTask( cleanCSS, 'cleanCSS' ),
				runTask( cleanJS, 'cleanJS' ),
			] );

			// Optional linting
			if ( opts.lint ) {
				await Promise.all( [ lintCSS(), lintJS() ] );
			}

			// Initial dev builds
			await Promise.all( [
				buildCSS( { dev: true } ),
				buildJS( { dev: true } ),
			] );

			// Start BrowserSync server (respects theme config)
			await runTask( serve, 'serve' );

			// Helper actions for watchers
			const rebuildJS = async () => {
				try {
					await buildJS( { dev: true } );
					server.reload();
				} catch ( e ) {
					console.error( e?.message || e );
				}
			};
			const rebuildCSS = async () => {
				try {
					await buildCSS( { dev: true } );
					server.reload();
				} catch ( e ) {
					console.error( e?.message || e );
				}
			};
			const processImagesWatcher = async () => {
				try {
					await runTask( images, 'images' );
					await runTask( convertToWebP, 'convertToWebP' );
					server.reload();
				} catch ( e ) {
					console.error( e?.message || e );
				}
			};
			const reloadOnly = () => server.reload();

			// Set up watchers using BrowserSync's built-in chokidar
			const jsWatcher = server.watch(
				'assets/js/src/**/*.{js,ts,tsx,json}',
				{ ignoreInitial: true }
			);
			jsWatcher
				.on( 'change', rebuildJS )
				.on( 'add', rebuildJS )
				.on( 'unlink', rebuildJS );

			const cssWatcher = server.watch( 'assets/css/src/**/*.css', {
				ignoreInitial: true,
			} );
			cssWatcher
				.on( 'change', rebuildCSS )
				.on( 'add', rebuildCSS )
				.on( 'unlink', rebuildCSS );

			const phpWatcher = server.watch( paths.php.src, {
				ignoreInitial: true,
			} );
			phpWatcher
				.on( 'change', reloadOnly )
				.on( 'add', reloadOnly )
				.on( 'unlink', reloadOnly );

			const imageWatcher = server.watch( paths.images.src, {
				ignoreInitial: true,
			} );
			imageWatcher
				.on( 'change', processImagesWatcher )
				.on( 'add', processImagesWatcher )
				.on( 'unlink', processImagesWatcher );

			console.log(
				'Development server running. Watching for changes...'
			);
		} catch ( e ) {
			console.error( e?.message || e );
			process.exitCode = 1;
		}
	} );

program
	.command( 'images' )
	.description( 'Optimize images and generate WebP (no gulp)' )
	.action( async () => {
		try {
			await runTask( images, 'images' );
			await runTask( convertToWebP, 'convertToWebP' );
			console.log( 'Images processed.' );
		} catch ( e ) {
			console.error( e?.message || e );
			process.exitCode = 1;
		}
	} );

program
	.command( 'generateCert' )
	.description( 'Generate Certificate' )
	.action( async () => {
		try {
			await runTask( generateCert, 'generateCert' );
			console.log( 'Cert Generated' );
		} catch ( e ) {
			console.error( e?.message || e );
			process.exitCode = 1;
		}
	} );

program
	.command( 'init' )
	.description(
		'Post-install setup: create config.json and guide next steps'
	)
	.option( '--non-interactive', 'Skip prompts and use defaults/placeholders' )
	.action( async ( opts ) => {
		try {
			const root = process.cwd();
			const configDir = path.join( root, 'config' );
			const defaultConfigPath = path.join(
				configDir,
				'config.default.json'
			);
			const configJsonPath = path.join( configDir, 'config.json' );
			const localConfigPath = path.join( configDir, 'config.local.json' );

			// Ensure config directory exists
			if ( ! fs.existsSync( configDir ) ) {
				fs.mkdirSync( configDir, { recursive: true } );
			}

			// Load default config for sensible defaults
			let defaults = {};
			try {
				if ( fs.existsSync( defaultConfigPath ) ) {
					defaults = JSON.parse(
						fs.readFileSync( defaultConfigPath, 'utf-8' )
					);
				}
			} catch {}

			// Load existing user config if present (to merge)
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
			let answers = null;

			if ( isInteractive ) {
				answers = await inquirer.prompt( [
					{
						type: 'input',
						name: 'proxyURL',
						message:
							'Enter your local development domain (without protocol), e.g. mysite.local:10004',
						default:
							defaults?.dev?.browserSync?.proxyURL ||
							'wprig.test:8888',
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
				] );
			} else {
				answers = {
					proxyURL:
						defaults?.dev?.browserSync?.proxyURL ||
						'wprig.test:8888',
					bypassPort: String(
						defaults?.dev?.browserSync?.bypassPort || '8181'
					),
					live: defaults?.dev?.browserSync?.live !== false,
					https: !! defaults?.dev?.browserSync?.https,
				};
			}

			// Merge into userConfig without clobbering other keys
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

			// Guidance output
			console.log( '' );
			console.log( 'WP Rig initialization complete.' );
			console.log(
				`- Wrote ${ configJsonPath } (overrides defaults in ${ defaultConfigPath }).`
			);
			if ( ! fs.existsSync( localConfigPath ) ) {
				console.log(
					`- Optional: create ${ localConfigPath } for machine-only settings (gitignored).`
				);
			}
			console.log( '' );
			console.log( 'Next steps:' );
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
		} catch ( e ) {
			console.error( e?.message || e );
			process.exitCode = 1;
		}
	} );

program.parse( process.argv );
