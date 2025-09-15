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
import { cleanCSS, cleanJS } from '../gulp/clean.js';
import { images, convertToWebP } from '../gulp/images.js';
import phpTask from '../gulp/php.js';
import fonts from '../gulp/fonts.js';
import prodPrep from '../gulp/prodPrep.js';
import prodStringReplace from '../gulp/prodStringReplace.js';
import prodCompress from '../gulp/prodCompress.js';

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
				phpTask( !! phpcs, ( err ) => ( err ? reject( err ) : resolve() ) );
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
				phpTask( !! phpcs, ( err ) => ( err ? reject( err ) : resolve() ) );
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

program.parse( process.argv );
