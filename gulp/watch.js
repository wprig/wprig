/* eslint-env es6 */
'use strict';

/**
 * External dependencies
 */
import { watch as gulpWatch, series, src } from 'gulp';
import pump from 'pump';

/**
 * Internal dependencies
 */
import { paths } from './constants.js';
import { getThemeConfig, backslashToForwardSlash } from './utils.js';
import { reload } from './browserSync.js';
import { images } from "./images.js";

/**
 * Watch everything
 */
export default function watch() {
	/**
	 * gulp watch uses chokidar, which doesn't play well with backslashes
	 * in file paths, so they are replaced with forward slashes, which are
	 * valid for Windows paths in a Node.js context.
	 */
	const PHPwatcher = gulpWatch( backslashToForwardSlash( paths.php.src ), reload );
	const config = getThemeConfig();

	if ( config.dev.debug.phpcs ) {
		PHPwatcher.on( 'change', function( path ) {
			return pump( [
				src( path ),
				// Run code sniffing
				//gulpPlugins.phpcs( PHPCSOptions ),
				// Log all problems that were found.
				//gulpPlugins.phpcs.reporter( 'log' ),
			] );
		} );
	}

	gulpWatch( backslashToForwardSlash( paths.images.src ), series( images, reload ) );
}
