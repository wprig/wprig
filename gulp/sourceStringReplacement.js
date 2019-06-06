/* eslint-env es6 */
'use strict';

// External dependencies
import pump from 'pump';
import {src, dest} from 'gulp';

// Internal dependencies
import {paths, rootPath} from './constants';
import {getStringReplacementTasks} from './utils';

/**
 * Replace WP Rig strings in all source PHP files.
 */
export function sourceStringReplacementPHP(done) {

	return pump([
		src([
			paths.php.src[0],
			`!${rootPath}/vendor/**/*.*`
		]),
		getStringReplacementTasks(),
		dest(paths.php.dest)
	], done);

}

/**
 * Replace WP Rig strings in all source CSS files.
 */
export function sourceStringReplacementCSS(done) {

	return pump([
		src(paths.styles.src[0]),
		getStringReplacementTasks(),
		dest(`${paths.assetsDir}/css/src/`)
	], done);

}

/**
 * Replace WP Rig strings in all source JS files.
 */
export function sourceStringReplacementJS(done) {

	return pump([
		src(paths.scripts.src[0]),
		getStringReplacementTasks(),
		dest(`${paths.assetsDir}/js/src/`)
	],done);

}
