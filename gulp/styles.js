/* eslint-env es6 */
'use strict';

// External dependencies
import {src, dest} from 'gulp';
import postcssPresetEnv from 'postcss-preset-env';
import AtImport from 'postcss-import';
import postcssCustomProperties from 'postcss-custom-properties';
import postcssCustomMedia from 'postcss-custom-media';
import pump from 'pump';

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

function getPostcssCustomPropertiesOptions() {
	const config = getThemeConfig();

	let postcssCustomPropertiesOptions = {
		'preserve': (
			configValueDefined('config.dev.styles.preserve') ?
			config.dev.styles.preserve :
			true
		)
	};

	if( configValueDefined('config.dev.styles.customProperties') ) {

		postcssCustomPropertiesOptions.importFrom = appendBaseToFilePathArray(
			config.dev.styles.customProperties,
			paths.styles.srcDir
		);

	}

	return postcssCustomPropertiesOptions;
}

function getPostcssCustomMediaOptions() {
	const config = getThemeConfig();

	let postcssCustomMediaOptions = {
		'preserve': (
			configValueDefined('config.dev.styles.preserve') ?
			config.dev.styles.preserve :
			true
		)
	};

	if( configValueDefined('config.dev.styles.customMedia') ) {

		postcssCustomMediaOptions.importFrom = appendBaseToFilePathArray(
			config.dev.styles.customMedia,
			paths.styles.srcDir
		);

	}

	return postcssCustomMediaOptions;
}

/**
* CSS via PostCSS + CSSNext (includes Autoprefixer by default).
*/
export default function styles(done) {
	// get a fresh copy of the config
	const config = getThemeConfig(true);

	const postcssCustomPropertiesOptionsDefaults = getPostcssCustomPropertiesOptions();
	let postcssCustomPropertiesOptions = {};
	const postcssCustomMediaOptionsDefaults = getPostcssCustomMediaOptions();
	let postcssCustomMediaOptions = {};

	let isEditorFile = false;

	const beforeReplacement = [
		src( paths.styles.srcWithIgnored, {sourcemaps: !isProd} ),
		logError('CSS'),
		gulpPlugins.newer({
			dest: paths.styles.dest,
			extra: [paths.config.themeConfig]
		}),
		// Dynamically set postcss preserve to false for editor files
		// See https://core.trac.wordpress.org/ticket/46435#ticket
		gulpPlugins.tap(function(file) {
			postcssCustomPropertiesOptions = postcssCustomPropertiesOptionsDefaults;
			postcssCustomMediaOptions = postcssCustomMediaOptionsDefaults;

			const relativeFilePath = file.path.replace(`${paths.styles.srcDir}/`, '');
			isEditorFile = relativeFilePath.startsWith('editor/');

			if ( isEditorFile ) {

				postcssCustomPropertiesOptions.preserve = false;
				postcssCustomMediaOptions.preserve = false;

			}
		}),
		gulpPlugins.phpcs({
			bin: `${rootPath}/vendor/bin/phpcs`,
			standard: 'WordPress',
			warningSeverity: 0
		}),
		// Log all problems that were found.
		gulpPlugins.phpcs.reporter('log'),
		gulpPlugins.postcss([
			AtImport(),
			postcssCustomProperties(postcssCustomPropertiesOptions),
			postcssCustomMedia(postcssCustomMediaOptions),
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
		dest(paths.styles.dest, {sourcemaps: !isProd}),
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
