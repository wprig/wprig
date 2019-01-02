/* eslint-env es6 */
'use strict';

// External dependencies
import {src, dest} from 'gulp';
import postcssPresetEnv from 'postcss-preset-env';
import postcssCustomProperties from 'postcss-custom-properties';
import postcssCustomMedia from 'postcss-custom-media';
import pump from 'pump';
import requireUncached from 'require-uncached';

// Internal dependencies
import {rootPath, paths, gulpPlugins, isProd} from './constants';
import {getThemeConfig, getStringReplacementTasks, logError} from './utils';
import {server} from './browserSync';

/**
* CSS via PostCSS + CSSNext (includes Autoprefixer by default).
*/
export default function styles(done) {
	// get a fresh copy of the config
	const config = getThemeConfig(true);

	// Reload cssVars every time the task runs
	const cssVars = requireUncached(paths.config.cssVars);

	const beforeReplacement = [
		src(paths.styles.src, {sourcemaps: true}),
		logError('CSS'),
		gulpPlugins.newer({
			dest: paths.styles.dest,
			extra: [paths.config.themeConfig, paths.config.cssVars]
		}),
		gulpPlugins.phpcs({
			bin: `${rootPath}/vendor/bin/phpcs`,
			standard: 'WordPress',
			warningSeverity: 0
		}),
		// Log all problems that were found.
		gulpPlugins.phpcs.reporter('log'),
		gulpPlugins.postcss([
			postcssCustomProperties({
				'preserve': config.dev.styles.preserveCSSVars,
				'importFrom': [
					{
						customProperties: cssVars.variables
					}
				],
			}),
			postcssCustomMedia({
				'preserve': config.dev.styles.preserveCSSVars,
				'importFrom': [
					{
						customMedia: cssVars.queries
					}
				],
			}),
			postcssPresetEnv({
				stage: 3
			})
		]),
	];

	const afterReplacement = [
		gulpPlugins.stylelint({
			failAfterError: false,
			fix: true,
			reporters: [
				{
					formatter: 'string',
					console: true
				}
			]
		}),
		gulpPlugins.if(
			!config.dev.debug.styles,
			gulpPlugins.cssnano()
		),
		gulpPlugins.rename({
			suffix: '.min'
		}),
		server.stream({match: "**/*.css"}),
		dest(paths.styles.dest, {sourcemaps: true}),
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
