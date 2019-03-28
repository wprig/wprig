/* eslint-env es6 */
'use strict';

// External dependencies
export const gulpPlugins = require('gulp-load-plugins')();
import path from 'path';
import importFresh from 'import-fresh';

// Internal dependencies
import {appendIgnoredSourceFiles, configValueDefined} from './utils';

// Root path is where npm run commands happen
export const rootPath = process.env.INIT_CWD;

// Dev or production
export const isProd = ( process.env.NODE_ENV === 'production' );

// Define the config path
export const configPath = `${rootPath}/config/themeConfig.js`;

// get a fresh copy of the config
export const config = importFresh(configPath);

// directory for the production theme
export const prodThemePath = path.normalize(`${rootPath}/../${config.theme.slug}`);

// directory for assets (CSS, JS, images)
export const assetsDir = `${rootPath}/assets`;

// directory for assets (CSS, JS, images) in production
export const prodAssetsDir = `${prodThemePath}/assets`;

// PHPCS options
export const PHPCSOptions = {
	bin: `${rootPath}/vendor/bin/phpcs`,
	standard: `${rootPath}/phpcs.xml.dist`,
	warningSeverity: 0
};

// Theme config name fields and their defaults
export const nameFieldDefaults = {
	PHPNamespace  : 'WP_Rig\\WP_Rig',
	slug          : 'wp-rig',
	name          : 'WP Rig',
	underscoreCase: 'wp_rig',
	constant      : 'WP_RIG',
	camelCase     : 'WpRig',
	camelCaseVar  : 'wpRig',
	author        : 'The WP Rig Contributors',
};

// Project paths
let paths = {
	assetsDir: assetsDir,
	browserSync: {
		dir: `${rootPath}/BrowserSync`,
		cert: `${rootPath}/BrowserSync/wp-rig-browser-sync-cert.crt`,
		caCert: `${rootPath}/BrowserSync/wp-rig-browser-sync-root-cert.crt`,
		key: `${rootPath}/BrowserSync/wp-rig-browser-sync-key.key`
	},
	config: {
		themeConfig: `${rootPath}/config/themeConfig.js`
	},
	php: {
		src: [
			`${rootPath}/**/*.php`,
			`!${rootPath}/optional/**/*.*`,
			`!${rootPath}/tests/**/*.*`,
			`!${rootPath}/vendor/**/*.*`,
		],
		dest: `${rootPath}/`
	},
	styles: {
		src: `${assetsDir}/css/src/**/*.css`,
		srcDir: `${assetsDir}/css/src`,
		srcWithIgnored: appendIgnoredSourceFiles(
			// Start with all CSS source
			`${assetsDir}/css/src/**/*.css`,
			// Negate ignored files from config, if defined
			configValueDefined('config.dev.styles.ignoredSourceFiles') ?
				config.dev.styles.ignoredSourceFiles :
				[],
			// With the CSS source base path
			`${assetsDir}/css/src`
		),
		sass: `${assetsDir}/css/src/**/*.scss`,
		dest: `${assetsDir}/css/`
	},
	scripts: {
		src: `${assetsDir}/js/src/**/*.js`,
		srcWithIgnored: appendIgnoredSourceFiles(
			// Start with all JS source
			`${assetsDir}/js/src/**/*.js`,
			// Negate ignored files from config, if defined
			configValueDefined('config.dev.scripts.ignoredSourceFiles') ?
				config.dev.scripts.ignoredSourceFiles :
				[],
			// With the JS source base path
			`${assetsDir}/js/src`
		),
		dest: `${assetsDir}/js/`
	},
	images: {
		src: `${assetsDir}/images/src/**/*.{jpg,JPG,png,svg,gif,GIF}`,
		dest: `${assetsDir}/images/`
	},
	languages: {
		src: [
			`${rootPath}/**/*.php`,
			`!${rootPath}/optional/**/*.*`,
			`!${rootPath}/tests/**/*.*`,
			`!${rootPath}/vendor/**/*.*`,
		],
		dest: `${rootPath}/languages/${nameFieldDefaults.slug}.pot`
	},
	export: {
		src: [],
		dest: `${prodThemePath}/`
	}
};

// Add rootPath to filesToCopy and additionalFilesToCopy
for ( let filePath of config.export.filesToCopy.concat( config.export.additionalFilesToCopy ) ) {
	paths.export.src.push(`${rootPath}/${filePath}`);
}

// Override paths for production
if( isProd ){
	paths.php.dest = `${prodThemePath}/`;
	paths.styles.dest = `${prodAssetsDir}/css/`;
	paths.scripts.dest = `${prodAssetsDir}/js/`;
	paths.images.dest = `${prodAssetsDir}/images/`;
	paths.languages = {
		src: `${prodThemePath}/**/*.php`,
		dest: `${prodThemePath}/languages/${config.theme.slug}.pot`
	};
}

export {paths};
