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
	 * gulp watch uses chokidar, which does not handle backslashes
	 * in file paths well, so they are replaced with forward slashes,
	 * which are valid in Windows paths in a Node.js context.
	 */
	const PHPwatcher = gulpWatch(backslashToForwardSlash(paths.php.src), reload);
	const config = getThemeConfig();

	if (config.dev.debug.phpcs) {
		PHPwatcher.on('change', function(path) {
			// Prepare the stream array
			const streams = [
				src(path),
				// Run code sniffing (uncomment when configured)
				// gulpPlugins.phpcs(PHPCSOptions),
				// Log all problems found
				// gulpPlugins.phpcs.reporter('log'),
			].filter(Boolean); // Remove undefined values

			// Only run pump if at least two streams are defined
			if (streams.length >= 2) {
				return pump(streams);
			}
		});
	}

	// Watch for changes in image files and run the image task, then reload
	gulpWatch(backslashToForwardSlash(paths.images.src), series(images, reload));
}
