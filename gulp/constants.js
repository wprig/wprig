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

// Project paths
export const paths = {
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
		src: `${rootPath}/css/src/**/*.css`,
		sass: `${rootPath}/css/src/**/*.scss`,
		dest: `${rootPath}/css/`
	},
	scripts: {
		src: `${rootPath}/js/src/**/*.js`,
		dest: `${rootPath}/js/`
	},
	images: {
		src: `${rootPath}/images/**/*.{jpg,JPG,png,svg,gif,GIF}`,
		dest: `${rootPath}/images/`
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
