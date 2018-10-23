/* eslint-env es6 */
'use strict';

// External dependencies
export const gulpPlugins = require('gulp-load-plugins')();

// Internal dependencies
import {getThemeConfig} from './utils';

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
export const config = getThemeConfig(true);

// directory for assets (CSS, JS, images)
export const assetsDir = `${rootPath}/assets`;

// Project paths
export const paths = {
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
		src: `${rootPath}/**/*.php`,
		dest: `${rootPath}/languages/${config.theme.slug}.pot`
	},
	export: {
		src: [
			`${rootPath}/**/*`,
			`!${rootPath}/${config.theme.slug}`,
			`!${rootPath}/${config.theme.slug}/**/*`,
			`!${rootPath}/**/*`,
			`!${rootPath}/node_modules`,
			`!${rootPath}/node_modules/**/*`,
			`!${rootPath}/vendor`,
			`!${rootPath}/vendor/**/*`,
			`!${rootPath}/.*`,
			`!${rootPath}/composer.*`,
			`!${rootPath}/gulpfile.*`,
			`!${rootPath}/gulp/**/*`,
			`!${rootPath}/package*.*`,
			`!${rootPath}/phpcs.*`,
			`!${rootPath}/*.zip`,
		],
		dest: `${rootPath}/`
	}
};

// Theme config name fields and their defaults
export const nameFieldDefaults = {
	slug          : 'wp-rig',
	name          : 'WP Rig',
	underscoreCase: 'wp_rig',
	constant      : 'WP_RIG',
	camelCase     : 'WpRig',
	camelCaseVar  : 'wpRig',
};
