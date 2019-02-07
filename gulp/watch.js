/* eslint-env es6 */
'use strict';

// External dependencies
import {watch as gulpWatch, series, src} from 'gulp';
import log from 'fancy-log';
import colors from 'ansi-colors';
import pump from 'pump';

// Internal dependencies
import {paths, gulpPlugins, PHPCSOptions, config} from './constants';
import {reload} from './browserSync';
import images from './images';
import php from './php';
import sassStyles from './sassStyles';
import scripts from './scripts';
import styles from './styles';

export function themeConfigChangeAlert(done){
	log(colors.yellow(`Theme configuration ${colors.bold(paths.config.themeConfig)} has changed, rebuilding everything...`));
	done();
}

/**
 * Watch everything
 */
export default function watch() {
	const PHPwatcher = gulpWatch(paths.php.src, reload);

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

	gulpWatch(paths.config.themeConfig, series(
		themeConfigChangeAlert, php, scripts, sassStyles, styles, images, reload
	));

	gulpWatch(paths.styles.sass, series(sassStyles, reload));

	gulpWatch([paths.styles.src, paths.styles.cssCustomProperties, paths.styles.cssCustomMedia], series( styles ) );

	gulpWatch(paths.scripts.src, series(scripts, reload));

	gulpWatch(paths.images.src, series(images, reload));
}
