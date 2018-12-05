/* eslint-env es6 */
'use strict';

// External dependencies
export const gulpPlugins = require('gulp-load-plugins')();
import path from 'path';
import requireUncached from 'require-uncached';

// gulp string replace options
export const gulpReplaceOptions = {
	logs: {
		enabled: false
	},
	searchValue: 'regex',
};

// Root path is where npm run commands happen
export const rootPath = process.env.INIT_CWD;

// Dev or production
export const isProd = ( process.env.NODE_ENV === 'production' );

// get a fresh copy of the config
export const config = requireUncached(`${rootPath}/config/themeConfig.js`);

// directory for the production theme
export const prodThemePath = path.normalize(`${rootPath}/../${config.theme.slug}`);

// directory for assets (CSS, JS, images)
export const assetsDir = `${rootPath}/assets`;

// directory for assets (CSS, JS, images) in production
export const prodAssetsDir = `${prodThemePath}/assets`;

// Theme config name fields and their defaults
export const nameFieldDefaults = {
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
		cssVars: `${rootPath}/config/cssVariables.json`,
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
		sass: `${assetsDir}/css/src/**/*.scss`,
		dest: `${assetsDir}/css/`
	},
	scripts: {
		src: `${assetsDir}/js/src/**/*.js`,
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
		src: [
			`${rootPath}/style.css`,
			`${rootPath}/readme.txt`,
			`${rootPath}/screenshot.png`,
			`${rootPath}/LICENSE`,
		],
		dest: `${prodThemePath}/`
	}
};

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
