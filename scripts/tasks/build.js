import { cleanCSS, cleanJS } from './clean.js';
import { images, convertToWebP } from './images.js';
import phpTask from './php.js';
import { propagateTokens } from './tokens.js';
import {
	runTask,
	lintCSS,
	lintJS,
	buildCSS,
	buildJS,
	buildBlocks,
} from '../lib/cli-utils.js';

/**
 * Runs the build pipeline.
 *
 * @param {Object}  options       Build options
 * @param {boolean} options.phpcs Run PHPCS
 * @param {boolean} options.lint  Run linters
 * @param {boolean} options.dev   Development mode
 */
export default async function runBuild( {
	phpcs = false,
	lint = false,
	dev = false,
} = {} ) {
	// Propagate Tokens
	await runTask( propagateTokens, 'propagateTokens' );

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
	await Promise.all( [
		buildCSS( { dev } ),
		buildJS( { dev } ),
		buildBlocks(),
	] );

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
