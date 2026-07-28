import fs from 'node:fs';
import { paths } from '../lib/constants.js';
import { cleanCSS, cleanJS } from './clean.js';
import { images, convertToWebP } from './images.js';
import phpTask from './php.js';
import fonts from './fonts.js';
import prodPrep from './prodPrep.js';
import prodStringReplace from './prodStringReplace.js';
import prodCompress from './prodCompress.js';
import {
	runTask,
	lintCSS,
	lintJS,
	buildCSS,
	buildJS,
	buildBlocks,
} from '../lib/cli-utils.js';

/**
 * Runs the bundle pipeline for production.
 *
 * @param {Object}  options       Bundle options
 * @param {boolean} options.phpcs Run PHPCS
 * @param {boolean} options.lint  Run linters
 */
export default async function runBundle( {
	phpcs = false,
	lint = false,
} = {} ) {
	// Build blocks first if they exist, so the freshly compiled blocks can be copied
	if ( fs.existsSync( paths.blocks.srcDir ) ) {
		await buildBlocks();
	}

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
