/* eslint-env es6 */
'use strict';

// External dependencies
import {src, dest} from 'gulp';
import pump from 'pump';

// Internal dependencies
import {paths, gulpPlugins, isProd} from './constants';
import {getThemeConfig, getStringReplacementTasks, logError} from './utils';

/**
 * JavaScript via Babel, ESlint, and uglify.
 */
export default function scripts(done) {
	const config = getThemeConfig();

	const beforeReplacement = [
		src(paths.scripts.src, {sourcemaps: !isProd}),
		logError('JavaScript'),
		gulpPlugins.newer({
			dest: paths.scripts.dest,
			extra: [paths.config.themeConfig]
		}),
		gulpPlugins.eslint(),
		gulpPlugins.eslint.format(),
		gulpPlugins.babel({
			presets: [
				'@babel/preset-env'
			]
		}),
		gulpPlugins.if(
			!config.dev.debug.scripts,
			gulpPlugins.uglify()
		),
		gulpPlugins.rename({
			suffix: '.min'
		}),
	];

	const afterReplacement = [
		dest(paths.scripts.dest, {sourcemaps: !isProd}),
	];

	pump(
		[].concat(
			beforeReplacement,
			// Only do string replacements when building for production
			gulpPlugins.if(
				isProd,
				getStringReplacementTasks(),
				[]
			),
			afterReplacement
		),
		done
	);
}
