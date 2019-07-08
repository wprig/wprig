/* eslint-env es6 */
'use strict';

/**
 * External dependencies
 */
import {src, dest} from 'gulp';
import postcssPresetEnv from 'postcss-preset-env';
import AtImport from 'postcss-import';
import pump from 'pump';
import cssnano from 'cssnano';
import stylelint from 'stylelint';
import reporter from 'postcss-reporter';
import calc from 'postcss-calc';
import { pipeline } from 'mississippi';

/**
 * Internal dependencies
 */
import {rootPath, paths, gulpPlugins, isProd} from './constants';
import {
	getThemeConfig,
	getStringReplacementTasks,
	logError,
	configValueDefined,
	appendBaseToFilePathArray
} from './utils';
import {server} from './browserSync';

export function editorStylesBeforeReplacementStream() {

	// Return a single stream containing all the
	// before replacement functionality
	return pipeline.obj([
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
	]);
}

export function editorStylesAfterReplacementStream() {
	const config = getThemeConfig();

	const postcssPlugins = [
		stylelint(),
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
			autoprefixer: (
				configValueDefined('config.dev.styles.autoprefixer') ?
				config.dev.styles.autoprefixer :
				{}
			),
			preserve: false,
			features: (
				configValueDefined('config.dev.styles.features') ?
				config.dev.styles.features :
				{
					'custom-media-queries': {
						preserve: false
					},
					'custom-properties': {
						// Preserve must always be false for the editor
						preserve: false
					},
					'nesting-rules': true
				}
			)
		}),
		calc({
			preserve: false
		}),
		cssnano(),
	];

	// Skip minifying files if we aren't building for
	// production and debug is enabled
	if( config.dev.debug.styles && ! isProd ) {
		postcssPlugins.pop();
	}

	// Report messages from other postcss plugins
	postcssPlugins.push(
		reporter({ clearReportedMessages: true })
	);

	// Return a single stream containing all the
	// after replacement functionality
	return pipeline.obj([
		gulpPlugins.postcss([
			AtImport({
				path: [paths.styles.srcDir],
				plugins: [
					stylelint(),
				]
			})
		]),
		gulpPlugins.postcss(postcssPlugins),
		gulpPlugins.if(
            config.dev.debug.styles,
            gulpPlugins.tabify(2, true)
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
export default function editorStyles(done) {

	return pump([
		src( paths.styles.editorSrc, {sourcemaps: !isProd} ),
		editorStylesBeforeReplacementStream(),
		// Only do string replacements when building for production
		gulpPlugins.if(
			isProd,
			getStringReplacementTasks()
		),
		editorStylesAfterReplacementStream(),
		dest(paths.styles.editorDest, {sourcemaps: !isProd}),
	], done);
}
