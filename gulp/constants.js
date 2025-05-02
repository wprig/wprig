/* eslint-env es6 */
'use strict';

/**
 * External dependencies
 */
import path from 'path';
import * as process from 'node:process';

/**
 * Internal dependencies
 */
import { configValueDefined } from './utils.js';

import config from '../config/themeConfig.js';

// Root path is where npm run commands happen
export const rootPath = process.cwd();
export const gulpTestPath = `${ rootPath }/gulp/tests`;

// Dev or production
export const isProd = process.env.NODE_ENV === 'production';

// Directory for assets (CSS, JS, images)
export const assetsDir = `${ rootPath }/assets`;

// PHPCS options
export const PHPCSOptions = {
	bin: `${ rootPath }/vendor/bin/phpcs`,
	showSniffCode: true,
	report: 'full',
	reporter: 'log',
};

// Theme config name fields and their defaults
export const nameFieldDefaults = {
	PHPNamespace: 'WP_Rig\\WP_Rig',
	slug: 'wp-rig',
	name: 'WP Rig',
	theme_uri: 'https://github.com/wprig/wprig/',
	author: 'The WP Rig Contributors',
	author_uri: 'https://wprig.io/',
	description: 'A progressive theme development rig for WordPress.',
	version: '3.0.1',
	underscoreCase: 'wp_rig',
	constant: 'WP_RIG',
	camelCase: 'WpRig',
	camelCaseVar: 'wpRig',
};

// Default Theme Paths
export const prodThemePath = isProd
	? path.normalize( `${ rootPath }/../${ config.theme.slug }` )
	: undefined;
export const prodAssetsDir = isProd ? `${ prodThemePath }/assets` : assetsDir;

// Project paths
export const paths = {
	assetsDir,
	browserSync: {
		dir: `${ rootPath }/BrowserSync`,
		cert: `${ rootPath }/BrowserSync/wp-rig-browser-sync-cert.crt`,
		caCert: `${ rootPath }/BrowserSync/wp-rig-browser-sync-root-cert.crt`,
		key: `${ rootPath }/BrowserSync/wp-rig-browser-sync-key.key`,
	},
	config: {
		themeConfig: `${ rootPath }/config/themeConfig.js`,
	},
	php: {
		src: [
			`${ rootPath }/**/*.php`,
			`!${ rootPath }/optional/**/*.*`,
			`!${ rootPath }/tests/**/*.*`,
			`!${ rootPath }/vendor/**/*.*`,
			`!${ rootPath }/wp-cli/**/*.*`,
			`!${ rootPath }/node_modules/**/*.*`,
		],
		dest: `${ rootPath }/`,
	},
	styles: {
		editorSrc: [
			`${ assetsDir }/css/src/editor/**/*.css`,
			// Ignore partial files.
			`!${ assetsDir }/css/src/**/_*.css`,
		],
		editorSrcDir: `${ assetsDir }/css/src/editor`,
		editorDest: `${ assetsDir }/css/editor`,
		src: [
			`${ assetsDir }/css/src/**/*.css`,
			// Ignore partial files.
			`!${ assetsDir }/css/src/**/_*.css`,
			// Ignore editor source css.
			`!${ assetsDir }/css/src/editor/**/*.css`,
		],
		srcDir: `${ assetsDir }/css/src`,
		dest: `${ assetsDir }/css`,
	},
	scripts: {
		src: [ `${ assetsDir }/js/src/**/*.js`, `!${ assetsDir }/js/src/**/_*.js` ],
		srcDir: `${ assetsDir }/js/src`,
		dest: `${ assetsDir }/js`,
	},
	images: {
		src: `${ assetsDir }/images/src/**/*.{jpg,JPG,png,svg,gif,GIF}`,
		dest: `${ assetsDir }/images/`,
	},
	fonts: {
		src: `${ assetsDir }/fonts/**/*.{woff,woff2,eot,ttf,svg}`,
		dest: `${ assetsDir }/fonts/`,
	},
	export: {
		src: [],
		stringReplaceSrc: [
			`${ rootPath }/style.css`,
			`${ rootPath }/languages/*.po`,
		],
	},
	languages: {
		src: [
			`${ rootPath }/**/*.php`,
			`!${ rootPath }/optional/**/*.*`,
			`!${ rootPath }/tests/**/*.*`,
			`!${ rootPath }/vendor/**/*.*`,
		],
		dest: `${ rootPath }/languages/${ nameFieldDefaults.slug }.pot`,
	},
};

// Add rootPath to filesToCopy and additionalFilesToCopy
const additionalFilesToCopy = configValueDefined( 'export.additionalFilesToCopy' )
	? config.export.additionalFilesToCopy
	: [];
const filesToCopy = configValueDefined( 'export.filesToCopy' )
	? config.export.filesToCopy
	: [];
for ( const filePath of filesToCopy.concat( additionalFilesToCopy ) ) {
	// Add the files to export src
	paths.export.src.push( `${ rootPath }/${ filePath }` );
}

// Override paths for production
if ( isProd ) {
	paths.php.dest = `${ prodThemePath }/`;
	paths.styles.dest = `${ prodAssetsDir }/css/`;
	paths.styles.editorDest = `${ prodAssetsDir }/css/editor/`;
	paths.scripts.dest = `${ prodAssetsDir }/js/`;
	paths.images.dest = `${ prodAssetsDir }/images/`;
	paths.fonts.dest = `${ prodAssetsDir }/fonts/`;
	paths.languages = {
		src: `${ prodThemePath }/**/*.php`,
		dest: `${ prodThemePath }/languages/${ config.theme.slug }.pot`,
	};
}
