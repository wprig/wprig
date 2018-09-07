/* eslint-env es6 */
'use strict';

// External dependencies
import {src, dest} from 'gulp';
import pump from 'pump';

// Internal dependencies
import {paths, gulpPlugins} from './constants';
import {getThemeConfig, getStringReplacementTasks} from './utils';

/**
 * JavaScript via Babel, ESlint, and uglify.
 */
export default function scripts(done) {
	// Get a fresh copy of the config
	const config = getThemeConfig(true);

	const beforeReplacement = [
		src(paths.scripts.src, {sourcemaps: true}),
		gulpPlugins.newer(paths.scripts.dest),
		gulpPlugins.eslint(),
		gulpPlugins.eslint.format(),
		gulpPlugins.babel(),
		dest(paths.verbose),
		gulpPlugins.if(
			!config.dev.debug.scripts,
			gulpPlugins.uglify()
		),
	];

	const afterReplacement = [
		dest(paths.scripts.dest, {sourcemaps: true}),
	];

	pump(
		[].concat(
			beforeReplacement,
			getStringReplacementTasks(),
			afterReplacement
		),
		done
	);
}
