/* eslint-env es6 */
'use strict';

import path from 'node:path';
import { exec } from 'node:child_process';
import fse from 'fs-extra';

import { globFiles, destPathFor, writeFileEnsured } from '../lib/filepipe.js';
import { paths, isProd, rootPath } from '../lib/constants.js';
import { getReplacements, getThemeConfig } from '../lib/utils.js';
import { getActiveThemeType, loadParadigms } from '../lib/paradigm.js';
import { bakeProdPhp, extractParadigmTag } from '../lib/bakeParadigm.js';
import removeWpCliBlock from './removeWpCliBlock.js';
import removeDevOnlyBlocks from './removeDevOnlyBlocks.js';

const COMPONENT_PATH_REGEX = /^inc\/([^/]+)\//;

/**
 * Builds a map of component directory -> paradigm tag for all components
 * present in the prod file list. Reads each Component.php from disk.
 *
 * @param {string[]} files Globbed prod file paths.
 * @return {Promise<Map<string, string>>} Component dir name -> paradigm tag.
 */
async function resolveComponentTags( files ) {
	const componentDirs = new Set();
	for ( const file of files ) {
		const rel = path.relative( rootPath, file ).replace( /\\/g, '/' );
		const match = rel.match( COMPONENT_PATH_REGEX );
		if ( match ) {
			componentDirs.add( match[ 1 ] );
		}
	}

	const tags = new Map();
	await Promise.all(
		[ ...componentDirs ].map( async ( dir ) => {
			const componentPath = path.join(
				rootPath,
				'inc',
				dir,
				'Component.php'
			);
			try {
				const source = await fse.readFile( componentPath, 'utf8' );
				tags.set( dir, extractParadigmTag( source ) );
			} catch {
				// No Component.php (or unreadable) — treated as 'all', ships everywhere.
				tags.set( dir, 'all' );
			}
		} )
	);
	return tags;
}

function applyReplacements( content, replacements ) {
	let out = content;
	replacements.forEach( ( { searchValue, replaceValue } ) => {
		out = out.replace( searchValue, replaceValue );
	} );
	return out;
}

/**
 * Gulp-free PHP task.
 * @param {boolean}  runPhpcs
 * @param {Function} done
 */
export default function php( runPhpcs, done ) {
	if ( runPhpcs ) {
		console.log( 'Running PHPCS via Composer script...' );
		const phpcsProcess = exec(
			'vendor/bin/phpcs --standard=phpcs.xml.dist -p -s'
		);
		let stdoutData = '';
		let stderrData = '';
		phpcsProcess.stdout.on( 'data', ( data ) => {
			stdoutData += data;
		} );
		phpcsProcess.stderr.on( 'data', ( data ) => {
			stderrData += data;
		} );
		phpcsProcess.on( 'close', ( code ) => {
			if ( stdoutData ) {
				console.log( `STDOUT: ${ stdoutData }` );
			}
			if ( stderrData ) {
				console.error( `STDERR: ${ stderrData }` );
			}
			console.log( `PHPCS process exited with code ${ code }` );
			if ( code !== 0 ) {
				console.error( `PHPCS found issues. Exit code: ${ code }` );
			}
			done();
		} );
		phpcsProcess.on( 'error', ( err ) => {
			console.error( 'Failed to start PHPCS:', err );
			done( err );
		} );
		return;
	}

	( async () => {
		if ( ! isProd ) {
			// In development, just no-op (parity with previous gulp task behavior)
			done();
			return;
		}

		const replacements = getReplacements();
		const config = getThemeConfig();
		const includeWpCli = config.export && config.export.includeWpCli;
		const patterns = paths.php.src; // includes negative patterns
		let files = await globFiles( patterns );

		// Bake paradigm gating (SPEC-014): resolve the active theme type once,
		// strip gated-out component directories entirely, and replace
		// inc/Paradigm.php with a stub whose values are inlined. The bundled
		// theme performs no config/paradigms.json reads at runtime.
		const activeThemeType = getActiveThemeType();
		const definitions = loadParadigms();
		const componentTags = await resolveComponentTags( files );
		const bakeCtx = {
			activeThemeType,
			definitions,
			isComponentPath: ( rel ) => COMPONENT_PATH_REGEX.test( rel ),
			componentTag: ( rel ) =>
				componentTags.get( rel.match( COMPONENT_PATH_REGEX )[ 1 ] ) ??
				'all',
		};

		files = files.filter( ( srcFile ) => {
			const rel = path
				.relative( rootPath, srcFile )
				.replace( /\\/g, '/' );
			const result = bakeProdPhp( rel, '', bakeCtx );
			return ! result.skip;
		} );

		await Promise.all(
			files.map( async ( srcFile ) => {
				try {
					let content = await fse.readFile( srcFile, 'utf8' );

					const relToRoot = path
						.relative( rootPath, srcFile )
						.replace( /\\/g, '/' );
					const baked = bakeProdPhp( relToRoot, content, bakeCtx );
					if ( baked.content !== undefined ) {
						content = baked.content;
					}

					content = applyReplacements( content, replacements );

					// Handle WP-CLI block for root functions.php
					if ( relToRoot === 'functions.php' ) {
						if ( ! includeWpCli ) {
							content = removeWpCliBlock( content );
						} else {
							// Just remove markers if block is kept
							content = content.replace(
								/\/\/\s*@wp-cli:(start|end)\s*/g,
								''
							);
						}
					}

					// Remove any dev-only blocks from all PHP files
					content = removeDevOnlyBlocks( content );

					let outPath = destPathFor(
						srcFile,
						rootPath,
						paths.php.dest
					);

					// Rename file if it's in wp-cli and contains 'wp-rig'
					if (
						relToRoot.startsWith( 'wp-cli' ) &&
						relToRoot.includes( 'wp-rig' )
					) {
						// Look for the slug replacement
						const slugRepl = replacements.find(
							( r ) =>
								r.searchValue &&
								r.searchValue.source === 'wp-rig'
						);
						if ( slugRepl ) {
							outPath = outPath.replace(
								'wp-rig',
								slugRepl.replaceValue
							);
						}
					}
					await writeFileEnsured( outPath, content, 'utf8' );
				} catch ( err ) {
					console.error(
						`Failed processing PHP file: ${ srcFile }`,
						err
					);
				}
			} )
		);

		done();
	} )().catch( ( e ) => done( e ) );
}
