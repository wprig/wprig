/* eslint-env es6 */
'use strict';

// External dependencies
import {watch as gulpWatch, series, parallel} from 'gulp';
import log from 'fancy-log';
import colors from 'ansi-colors';

// Internal dependencies
import {paths} from './constants';
import {reload} from './browserSync';
import images from './images';
import jsLibs from './jsLibs';
import jsMin from './jsMin';
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
	gulpWatch(paths.php.src, series(php, reload));
	gulpWatch(paths.config.themeConfig, series(
		themeConfigChangeAlert, php, parallel(scripts, jsMin, jsLibs), sassStyles, styles, images, reload)
	);
	gulpWatch(paths.config.cssVars, series(styles, reload));
	gulpWatch(paths.styles.sass, series(sassStyles, reload));
	gulpWatch(paths.styles.src, series(styles, reload));
	gulpWatch(paths.scripts.src, series(scripts, reload));
	gulpWatch(paths.scripts.min, series(jsMin, reload));
	gulpWatch(paths.scripts.libs, series(jsLibs, reload));
	gulpWatch(paths.images.src, series(images, reload));
}