/* eslint-env es6 */
'use strict';

// External dependencies
import {watch as gulpWatch, series, src} from 'gulp';
import pump from 'pump';

// Internal dependencies
import {paths, gulpPlugins, PHPCSOptions} from './constants';
import {getThemeConfig} from './utils';
import {reload} from './browserSync';
import images from './images';
import scripts from './scripts';
import styles from './styles';
import editorStyles from './editorStyles';

/**
 * Watch everything
 */
export default function watch() {
	const PHPwatcher = gulpWatch(paths.php.src, reload);
	const config = getThemeConfig();

	// Only code sniff PHP files if the debug setting is true
	if( config.dev.debug.phpcs ) {
		PHPwatcher.on('change', function(path) {
			return pump([
				src(path),
				// Run code sniffing
				gulpPlugins.phpcs(PHPCSOptions),
				// Log all problems that were found.
				gulpPlugins.phpcs.reporter('log'),
			]);
		});
	}

	gulpWatch(paths.styles.src[0], series( styles, editorStyles ) );

	gulpWatch(paths.scripts.src[0], series(scripts, reload));

	gulpWatch(paths.images.src, series(images, reload));
}
