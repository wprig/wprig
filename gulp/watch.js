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
import { paths, gulpPlugins, PHPCSOptions } from './constants';
import { getThemeConfig, backslashToForwardSlash } from './utils';
import { reload } from './browserSync';
import images from './images';
import scripts from './scripts';
import styles from './styles';
import editorStyles from './editorStyles';

/**
 * Watch everything
 */
export default function watch() {
	/**
	 * gulp watch uses chokidar, which doesn't play well with backslashes
	 * in file paths, so they are replaced with forward slashes, which are
	 * valid for Windows paths in a NodeJS context.
	 */
	const PHPwatcher = gulpWatch( backslashToForwardSlash( paths.php.src ), reload );
	const config = getThemeConfig();

	// Only code sniff PHP files if the debug setting is true
	if ( config.dev.debug.phpcs ) {
		PHPwatcher.on( 'change', function( path ) {
			return pump( [
				src( path ),
				// Run code sniffing
				gulpPlugins.phpcs( PHPCSOptions ),
				// Log all problems that were found.
				gulpPlugins.phpcs.reporter( 'log' ),
			] );
		} );
	}

	gulpWatch( backslashToForwardSlash( paths.styles.src[ 0 ] ), series( styles, editorStyles ) );

	gulpWatch( backslashToForwardSlash( paths.scripts.src[ 0 ] ), series( scripts, reload ) );

	gulpWatch( backslashToForwardSlash( paths.images.src ), series( images, reload ) );
}
