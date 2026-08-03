import { cleanCSS, cleanJS } from './clean.js';
import { images, convertToWebP } from './images.js';
import phpTask from './php.js';
import fonts from './fonts.js';
import prodPrep from './prodPrep.js';
import prodStringReplace from './prodStringReplace.js';
import prodCopyWporgSrc from './prodCopyWporgSrc.js';
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
 * @param {boolean} options.wporg Run wporg copy logic
 */
export default async function runBundle( {
	phpcs = false,
	lint = false,
	wporg = false,
} = {} ) {
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
		buildBlocks(),
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

	if ( wporg ) {
		await runTask( prodCopyWporgSrc, 'prodCopyWporgSrc' );
	}

	await runTask( prodCompress, 'prodCompress' );
}
