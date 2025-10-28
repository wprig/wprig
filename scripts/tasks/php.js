/* eslint-env es6 */
'use strict';

import path from 'node:path';
import { exec } from 'node:child_process';
import fse from 'fs-extra';

import { globFiles, destPathFor, writeFileEnsured } from '../lib/filepipe.js';
import {
	paths,
	isProd,
	rootPath,
	nameFieldDefaults,
} from '../lib/constants.js';
import { getThemeConfig } from '../lib/utils.js';
import removeWpCliBlock from './removeWpCliBlock.js';
import removeDevOnlyBlocks from './removeDevOnlyBlocks.js';

/**
 * Build replacement table equivalent to getStringReplacementTasks() but without streams.
 */
function buildReplacements() {
	const themeConfig = getThemeConfig();
	return Object.keys( nameFieldDefaults ).map( ( nameField ) => ( {
		searchValue: new RegExp(
			String( nameFieldDefaults[ nameField ] ).replace( /\\/g, '\\\\' ),
			'g'
		),
		replaceValue: themeConfig.theme[ nameField ],
	} ) );
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

		const replacements = buildReplacements();
		const patterns = paths.php.src; // includes negative patterns
		const files = await globFiles( patterns );

		await Promise.all(
			files.map( async ( srcFile ) => {
				try {
					let content = await fse.readFile( srcFile, 'utf8' );
					content = applyReplacements( content, replacements );

					// Remove WP-CLI block only for root functions.php
					const relToRoot = path.relative( rootPath, srcFile );
					if ( relToRoot === 'functions.php' ) {
						content = removeWpCliBlock( content );
					}

					// Remove any dev-only blocks from all PHP files
					content = removeDevOnlyBlocks( content );

					const outPath = destPathFor(
						srcFile,
						rootPath,
						paths.php.dest
					);
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
