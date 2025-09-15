#!/usr/bin/env node
/*
 Minimal Node-based CLI to replace gulp build and bundle commands in WP Rig.
 This reuses existing task modules under ./gulp and mirrors the task order
 used in gulpfile.js, but without using gulp itself.
*/

import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';
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

program.parse( process.argv );
