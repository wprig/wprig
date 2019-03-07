/* eslint-env es6 */
'use strict';

// External dependencies
import {src, dest} from 'gulp';
import postcssPresetEnv from 'postcss-preset-env';
import AtImport from 'postcss-import';
import postcssCustomProperties from 'postcss-custom-properties';
import postcssCustomMedia from 'postcss-custom-media';
import pump from 'pump';
import postcss from 'postcss';
import fs from 'fs';
import {readCustomFromRoot, transformStringWithCustomProperties, transformStringWithCustomMedia} from 'postcss-custom-utils';

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

function getCustomPropertiesFromFiles(customPropertyFiles) {

	let customPropertiesArray = [];

	for ( let customPropertyFile of customPropertyFiles ) {
		const css = fs.readFileSync(customPropertyFile, 'utf8');
		const rootObj = postcss.parse(css, { from: customPropertyFile });
		const postcssCustomObj = readCustomFromRoot(rootObj, true);
		customPropertiesArray.push(postcssCustomObj.customProperties);
	}

	return customPropertiesArray;

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

function getCustomMediaFromFiles(customMediaFiles) {

	let customMediaArray = [];

	for ( let customMediaFile of customMediaFiles ) {
		const css = fs.readFileSync(customMediaFile, 'utf8');
		const rootObj = postcss.parse(css, { from: customMediaFile });
		const postcssCustomObj = readCustomFromRoot(rootObj, true);
		customMediaArray.push(postcssCustomObj.customMedia);
	}

	return customMediaArray;

}

/**
* CSS via PostCSS + CSSNext (includes Autoprefixer by default).
*/
export default function styles(done) {
	// get a fresh copy of the config
	const config = getThemeConfig(true);

	let isEditorFile = false;
	const postcssCustomPropertiesOptions = getPostcssCustomPropertiesOptions();
	const postcssCustomMediaOptions = getPostcssCustomMediaOptions();

	const beforeReplacement = [
		src( paths.styles.srcWithIgnored, {sourcemaps: !isProd} ),
		logError('CSS'),
		gulpPlugins.newer({
			dest: paths.styles.dest,
			extra: [paths.config.themeConfig]
		}),
		gulpPlugins.tap(function(file) {
			const relativeFilePath = file.path.replace(`${paths.styles.srcDir}/`, '');
			isEditorFile = relativeFilePath.startsWith('editor/');

			if ( isEditorFile ) {

				if( postcssCustomPropertiesOptions.hasOwnProperty('importFrom') ) {
					const customPropertiesArray = getCustomPropertiesFromFiles(postcssCustomPropertiesOptions.importFrom);
					for ( let customProperty of customPropertiesArray ) {
						file.contents = Buffer.from(transformStringWithCustomProperties(file.contents.toString(), customProperty));
					}
				}

				if( postcssCustomMediaOptions.hasOwnProperty('importFrom') ) {
					const customMediaArray = getCustomMediaFromFiles(postcssCustomMediaOptions.importFrom);
					for ( let customMedia of customMediaArray ) {
						file.contents = Buffer.from(transformStringWithCustomMedia(file.contents.toString(), customMedia));
					}
				}

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
