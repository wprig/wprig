import fs from 'fs';
import path from 'path';
import fse from 'fs-extra';
import log from 'fancy-log';
import colors from 'ansi-colors';

import {
	isProd,
	prodThemePath,
	rootPath,
} from '../lib/constants.js';

/**
 * Copies the raw source files and essential configuration into the
 * production theme directory, satisfying WP.org TRT requirements.
 * Also strips out plugin territory (e.g. Blocks) for WP.org compliance.
 *
 * @param {Function} done callback when finished
 */
export default function prodCopyWporgSrc( done ) {
	if ( ! isProd ) {
		log(
			colors.red(
				`${ colors.bold(
					'Error:'
				) } The prodCopyWporgSrc task may only be called when NODE_ENV is set to 'production'.`
			)
		);
		return done( new Error( 'prodCopyWporgSrc requires NODE_ENV=production' ) );
	}

	if ( ! prodThemePath ) {
		return done( new Error( 'Production theme path missing' ) );
	}

	log( colors.cyan( 'prodCopyWporgSrc: Injecting un-minified source files for WP.org TRT review...' ) );

	// NOTE: We omit 'assets/blocks' here because custom blocks are plugin territory
	const itemsToCopy = [
		'assets/css/src',
		'assets/js/src',
		'package.json',
		'bun.lock',
		'package-lock.json',
	];

	let copyErrors = 0;

	itemsToCopy.forEach( ( item ) => {
		const srcPath = path.join( rootPath, item );
		const destPath = path.join( prodThemePath, item );

		if ( fs.existsSync( srcPath ) ) {
			try {
				fse.copySync( srcPath, destPath, { 
					overwrite: true,
					errorOnExist: false,
					filter: ( src ) => !src.includes( 'node_modules' ) && !src.includes( '.DS_Store' )
				} );
				log( colors.gray( `  - Copied: ${ item }` ) );
			} catch ( err ) {
				log( colors.red( `  - Error copying ${ item }: ${ err.message }` ) );
				copyErrors++;
			}
		} else {
			if ( ! [ 'package-lock.json', 'bun.lock' ].includes( item ) ) {
				log( colors.yellow( `  - Warning: Source item not found: ${ item }` ) );
			}
		}
	} );

	// Clean up plugin territory from the destination build directory
	log( colors.cyan( 'prodCopyWporgSrc: Cleaning up plugin territory (Blocks) from destination...' ) );
	
	try {
		const destBlocksInc = path.join( prodThemePath, 'inc', 'Blocks' );
		if ( fs.existsSync( destBlocksInc ) ) {
			fse.removeSync( destBlocksInc );
			log( colors.gray( `  - Removed plugin territory: inc/Blocks` ) );
		}
		
		const destAssetsBlocks = path.join( prodThemePath, 'assets', 'blocks' );
		if ( fs.existsSync( destAssetsBlocks ) ) {
			fse.removeSync( destAssetsBlocks );
			log( colors.gray( `  - Removed plugin territory: assets/blocks` ) );
		}

		// Remove Blocks\\Component from Theme.php
		const destThemePhp = path.join( prodThemePath, 'inc', 'Theme.php' );
		if ( fs.existsSync( destThemePhp ) ) {
			let themeContent = fs.readFileSync( destThemePhp, 'utf8' );
			if ( themeContent.includes( 'new Blocks\\Component()' ) ) {
				themeContent = themeContent.replace( /new Blocks\\Component\(\),?\s*/g, '' );
				fs.writeFileSync( destThemePhp, themeContent );
				log( colors.gray( `  - Deregistered Blocks\\Component from inc/Theme.php` ) );
			}
		}
	} catch ( err ) {
		log( colors.red( `  - Error cleaning up plugin territory: ${ err.message }` ) );
		copyErrors++;
	}

	if ( copyErrors > 0 ) {
		done( new Error( `${ copyErrors } item(s) failed during prodCopyWporgSrc.` ) );
	} else {
		log( colors.green( 'prodCopyWporgSrc: Successfully prepared sources for WP.org.' ) );
		done();
	}
}
