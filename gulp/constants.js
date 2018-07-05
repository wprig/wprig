/* eslint-env es6 */
'use strict';

// gulp plugins
export const gulpPlugins = require('gulp-load-plugins')();

// gulp string replace options
export const gulpReplaceOptions = {
    logs: {
      enabled: false
    },
    searchValue: 'string',
}

// Theme config
let config = require('../dev/config/themeConfig.js');
let themeConfig = config.theme;

export const rootPath = process.env.INIT_CWD;

// Project paths
export const paths = {
	config: {
		cssVars: `${rootPath}/dev/config/cssVariables.json`,
		themeConfig: `${rootPath}/dev/config/themeConfig.js`
	},
	php: {
		src: [
            `${rootPath}/dev/**/*.php`,
            `!${rootPath}/dev/optional/**/*.*`,
        ],
		dest: `${rootPath}/`
	},
	styles: {
		src: [
            `${rootPath}/dev/**/*.css`,
            `!${rootPath}/dev/optional/**/*.*`
        ],
		dest: `${rootPath}/`,
		sass: [`${rootPath}/dev/**/*.scss`]
	},
	scripts: {
		src: [
            `${rootPath}/dev/**/*.js`, 
            `!${rootPath}/dev/**/*.min.js`, 
            `!${rootPath}/dev/js/libs/**/*.js`, 
            `!${rootPath}/dev/optional/**/*.*`, 
            `!${rootPath}/dev/config/**/*`,
        ],
		min: `${rootPath}/dev/**/*.min.js`,
		dest: `${rootPath}/`,
		libs: `${rootPath}/dev/js/libs/**/*.js`,
		libsDest: `${rootPath}/js/libs/`,
		verboseLibsDest: `${rootPath}/verbose/js/libs/`,
	},
	images: {
		src: [
            `${rootPath}/dev/**/*.{jpg,JPG,png,svg}`,
            `!${rootPath}/dev/optional/**/*.*`,
        ],
		dest: `${rootPath}/`
	},
	languages: {
		src: [
            `${rootPath}/**/*.php`,
            `!${rootPath}/dev/**/*.php`,
            `!${rootPath}/verbose/**/*.php`,
        ],
		dest: `${rootPath}/languages/${config.theme.name}.pot`
	},
	verbose: `${rootPath}/verbose/`,
	export: {
		src: [
            `${rootPath}/**/*`,
            `!${rootPath}/${config.theme.name}`,
            `!${rootPath}/${config.theme.name}/**/*`,
            `!${rootPath}/dev/**/*`,
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