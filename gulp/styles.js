/* eslint-env es6 */
'use strict';

// External dependencies
import {src, dest} from 'gulp';
import postcssPresetEnv from 'postcss-preset-env';
import AtImport from 'postcss-import';
import pump from 'pump';
import { pipeline } from 'mississippi';

// Internal dependencies
import {rootPath, paths, gulpPlugins, isProd} from './constants';
import {
	getThemeConfig,
	getStringReplacementTasks,
	logError,
	configValueDefined,
	appendBaseToFilePathArray
} from './utils';
import {server} from './browserSync';

export function beforeReplacementStream() {
	// Changed to not get a fresh copy of config so modifications can be tested
	const config = getThemeConfig();

	return pipeline.obj([
		logError('CSS'),
		gulpPlugins.newer({
			dest: paths.styles.dest,
			extra: [paths.config.themeConfig]
		}),
		gulpPlugins.phpcs({
			bin: `${rootPath}/vendor/bin/phpcs`,
			standard: 'WordPress',
			warningSeverity: 0
		}),
		// Log all problems that were found.
		gulpPlugins.phpcs.reporter('log'),
		gulpPlugins.postcss([
			AtImport({
				path: [paths.styles.srcDir]
			}),
			postcssPresetEnv({
				importFrom: (
					configValueDefined('config.dev.styles.importFrom') ?
					appendBaseToFilePathArray(config.dev.styles.importFrom, paths.styles.srcDir) :
					[]
				),
				stage: (
					configValueDefined('config.dev.styles.stage') ?
					config.dev.styles.stage :
					3
				),
				preserve: true,
				features: (
					configValueDefined('config.dev.styles.features') ?
					config.dev.styles.features :
					{
						'custom-media-queries': true,
						'custom-properties': true,
						'nesting-rules': true
					}
				)
			})
		])
	]);
}

export function afterReplacementStream() {
	// Changed to not get a fresh copy of config so modifications can be tested
	const config = getThemeConfig();

	return pipeline.obj([
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
	]);
}

/**
* CSS via PostCSS + CSSNext (includes Autoprefixer by default).
*/
export default function styles(done) {
	pump([
		src( paths.styles.src, {sourcemaps: !isProd} ),
		beforeReplacementStream(),
		// Only do string replacements when building for production
		gulpPlugins.if(
			isProd,
			getStringReplacementTasks(),
			// The array was removed because it isn't a valid stream but we can rely on gulp-if's noopStream
		),
		afterReplacementStream(),
		dest(paths.styles.dest, {sourcemaps: !isProd}),
	], done);
}
