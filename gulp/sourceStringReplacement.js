/* eslint-env es6 */
'use strict';

// External dependencies
import pump from 'pump';
import {src, dest} from 'gulp';

// Internal dependencies
import {paths} from './constants';
import {getStringReplacementTasks} from './utils';

/**
 * Replace WP Rig strings in all source PHP files.
 */
export function sourceStringReplacementPHP(done) {

	return pump(
		[].concat(
			[src(paths.php.src)],
			getStringReplacementTasks(),
			[dest(paths.php.dest)]
		),
		done
	);

}
/**
 * Replace WP Rig strings in all source CSS files.
 */
export function sourceStringReplacementCSS(done) {

	return pump(
		[].concat(
			// CSS and Sass source files
			[src([paths.styles.src, paths.styles.sass])],
			getStringReplacementTasks(),
			[dest(paths.styles.dest)]
		),
		done
	);

}
/**
 * Replace WP Rig strings in all source JS files.
 */
export function sourceStringReplacementJS(done) {

	return pump(
		[].concat(
			[src(paths.scripts.src)],
			getStringReplacementTasks(),
			[dest(paths.scripts.dest)]
		),
		done
	);

}
