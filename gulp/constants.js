/* eslint-env es6 */
'use strict';

// gulp plugins
export const gulpPlugins = require('gulp-load-plugins')();

// Theme config
let config = require('../dev/config/themeConfig.js');
let themeConfig = config.theme;

// Project paths
export const paths = {
	config: {
		cssVars: './dev/config/cssVariables.json',
		themeConfig: './dev/config/themeConfig.js'
	},
	php: {
		src: ['dev/**/*.php', '!dev/optional/**/*.*'],
		dest: './'
	},
	styles: {
		src: ['dev/**/*.css', '!dev/optional/**/*.*'],
		dest: './',
		sass: ['dev/**/*.scss']
	},
	scripts: {
		src: ['dev/**/*.js', '!dev/**/*.min.js', '!dev/js/libs/**/*.js', '!dev/optional/**/*.*', '!dev/config/**/*'],
		min: 'dev/**/*.min.js',
		dest: './',
		libs: 'dev/js/libs/**/*.js',
		libsDest: './js/libs/',
		verboseLibsDest: './verbose/js/libs/'
	},
	images: {
		src: ['dev/**/*.{jpg,JPG,png,svg}', '!dev/optional/**/*.*'],
		dest: './'
	},
	languages: {
		src: ['./**/*.php', '!dev/**/*.php', '!verbose/**/*.php'],
		dest: `./languages/${config.theme.name}.pot`
	},
	verbose: './verbose/',
	export: {
		src: ['**/*', `!${config.theme.name}`, `!${config.theme.name}/**/*`, '!dev/**/*', '!node_modules', '!node_modules/**/*', '!vendor', '!vendor/**/*', '!.*', '!composer.*', '!gulpfile.*', '!package*.*', '!phpcs.*', '!*.zip'],
		dest: './'
	}
};