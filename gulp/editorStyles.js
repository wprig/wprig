/* eslint-env es6 */
'use strict';

// External dependencies
import {src, dest} from 'gulp';
import postcssPresetEnv from 'postcss-preset-env';
import AtImport from 'postcss-import';
import pump from 'pump';
import cssnano from 'cssnano';

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

/**
* CSS via PostCSS + CSSNext (includes Autoprefixer by default).
*/
export default function editorStyles(done) {
	const config = getThemeConfig();

	const postcssPlugins = [
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
			// Preserve must always be false for the editor
			preserve: false,
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
	];

	// Only minify if we aren't building for
	// production and debug is not enabled
	if( ! config.dev.debug.styles && ! isProd ) {
		postcssPlugins.push(cssnano())
	}

	const beforeReplacement = [
		src( paths.styles.editorSrc, {sourcemaps: !isProd} ),
		logError('Editor CSS'),
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
	];

	const afterReplacement = [
		gulpPlugins.postcss(postcssPlugins),
		gulpPlugins.rename({
			suffix: '.min'
		}),
		server.stream({match: "**/*.css"}),
		dest(paths.styles.editorDest, {sourcemaps: !isProd}),
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
