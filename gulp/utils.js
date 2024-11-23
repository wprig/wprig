/* eslint-env es6 */
'use strict';

/**
 * External dependencies
 */
import importFresh from 'import-fresh';
import log from 'fancy-log';
import colors from 'ansi-colors';
import rimraf from 'rimraf';
import mkdirp from 'mkdirp';
import fs from 'fs';
import { pipeline } from 'mississippi';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import path from 'path';
import { fileURLToPath } from 'url';
import through2 from 'through2';
import replaceStream from 'replacestream';

// Determine `__dirname` in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Internal dependencies
 */
import {
	nameFieldDefaults,
	prodThemePath,
	isProd,
	rootPath,
} from './constants.js';

import config from '../config/themeConfig.js';

export const getDefaultConfig = () => require( `${ rootPath }/config/config.default.json` );

/**
 * Get theme configuration.
 *
 * @param {boolean} uncached Whether to get an uncached version of the configuration. Defaults to false.
 * @return {Object} Theme configuration data.
 */
export function getThemeConfig( uncached = false ) {
	if ( ! config.theme.slug ) {
		config.theme.slug = config.theme.name.toLowerCase().replace( /[\s_]+/g, '-' ).replace( /[^a-z0-9-]+/g, '' );
	}

	if ( ! config.theme.underscoreCase ) {
		config.theme.underscoreCase = config.theme.slug.replace( /-/g, '_' );
	}

	if ( ! config.theme.constant ) {
		config.theme.constant = config.theme.underscoreCase.toUpperCase();
	}

	if ( ! config.theme.camelCase ) {
		config.theme.camelCase = config.theme.slug
			.split( '-' )
			.map( ( part ) => part[ 0 ].toUpperCase() + part.substring( 1 ) )
			.join( '' );
	}

	if ( ! config.theme.camelCaseVar ) {
		config.theme.camelCaseVar = config.theme.camelCase[ 0 ].toLowerCase() + config.theme.camelCase.substring( 1 );
	}

	return config;
}

/**
 * Handles string replacements based on config.
 * @param {Buffer|string} content - The content to be processed.
 * @param {Array} replacements - The list of replacements to apply.
 * @param {string} encoding - The encoding of the content.
 * @return {Buffer} - The processed content as a Buffer.
 */
function processBuffer(content, replacements, encoding) {
	let contentStr = content.toString(encoding);
	replacements.forEach(({ searchValue, replaceValue }) => {
		contentStr = contentStr.replace(searchValue, replaceValue);
	});
	return Buffer.from(contentStr, encoding);
}

/**
 * Creates a stream transformation for replacing strings based on the theme config.
 * @param {boolean} isProd - Flag indicating whether it's in production mode.
 * @return {Stream.Transform} - A stream transformation for string replacements.
 */
export function getStringReplacementTasks(isProd) {
	const config = getThemeConfig(isProd); // Assuming `isProd` is passed correctly

	const replacements = Object.keys(nameFieldDefaults).map(nameField => ({
		searchValue: new RegExp(nameFieldDefaults[nameField].replace(/\\/g, '\\\\'), 'g'),
		replaceValue: config.theme[nameField]
	}));

	return through2.obj(function (file, enc, callback) {
		if (file.isBuffer()) {
			file.contents = processBuffer(file.contents, replacements, enc);
			callback(null, file);
		} else if (file.isStream()) {
			let stream = file.contents;
			replacements.forEach(({ searchValue, replaceValue }) =>
				stream = stream.pipe(replaceStream(searchValue, replaceValue))
			);
			file.contents = stream;
			stream.on('finish', () => callback(null, file));
			stream.on('error', callback);
		} else {
			callback(null, file);
		}
	});
}

export function logError( errorTitle = 'gulp' ) {
	return gulpPlugins.plumber( {
		errorHandler: gulpPlugins.notify.onError( {
			title: errorTitle,
			message: '<%= error.message %>',
		} ),
	} );
}

export function createProdDir() {
	log( colors.green( `Creating the production theme directory ${ prodThemePath }` ) );
	if ( fs.existsSync( prodThemePath ) ) {
		rimraf.sync( prodThemePath );
	}
	mkdirp( prodThemePath );
}

export function gulpRelativeDest( file ) {
	const relativeProdFilePath = file.base.replace( file.cwd, prodThemePath );
	return relativeProdFilePath;
}

export function backslashToForwardSlash( path ) {
	const replaceFn = ( ( p ) => p.replace( /\\/g, '/' ) );
	if ( Array.isArray( path ) ) {
		const paths = [];
		path.forEach( ( p ) => paths.push( replaceFn( p ) ) );
		return paths;
	}
	return replaceFn( path );
}

/**
 * Determine if a config value is defined
 * @param {string} configValueLocation a config value path to search for, e.g. 'config.theme.slug'
 * @return {boolean} whethere the config value is defined
 */
export function configValueDefined( configValueLocation ) {
	if ( 0 === configValueLocation.length ) {
		return false;
	}

	let config = getThemeConfig();

	const configValueLocationArray = configValueLocation.split( '.' );

	if ( 'config' === configValueLocationArray[ 0 ] ) {
		configValueLocationArray.shift();
	}

	for ( const currentValueLocation of configValueLocationArray ) {
		if ( ! Object.prototype.hasOwnProperty.call( config, currentValueLocation ) ) {
			return false;
		}
		config = config[ currentValueLocation ];
	}

	return true;
}

/**
 * Append a base file path to a list of files
 * @param {string|Array} filePaths the file or files to append the base path to
 * @param {string} basePath the base path to append
 * @return {string|Array} file paths with base path appended
 */
export function appendBaseToFilePathArray( filePaths, basePath ) {
	if ( ! Array.isArray( filePaths ) ) {
		return `${ basePath }/${ filePaths }`;
	}

	const output = [];

	for ( const filePath of filePaths ) {
		output.push( `${ basePath }/${ filePath }` );
	}

	return output;
}

/**
 * Replaces all occurrences of a specific inline CSS class name in a given string
 * with another class name.
 *
 * @param {string} code - The code containing inline CSS where the replacement
 * is to be performed.
 * @return {string} The modified code with the specified inline CSS class name
 * replaced.
 */
export function replaceInlineCSS (code) {
	const searchValue = nameFieldDefaults.slug;
	const replaceValue = config.theme.slug;
	return code.replace(new RegExp(searchValue, 'g'), replaceValue);
}

/**
 * Converts a hyphenated string to camelCase notation.
 *
 * @param {string} str - The input string containing words separated by hyphens.
 * @return {string} The converted string in camelCase notation.
 */
function toCamelCase(str) {
	return str.toLowerCase().replace(/-([a-z])/g, (match, group1) => group1.toUpperCase());
}

/**
 * Replaces inline JavaScript code by substituting specified placeholders with corresponding values.
 *
 * @param {string} code - The inline JavaScript code that contains placeholders to be replaced.
 * @return {string} - The modified JavaScript code with placeholders replaced by their respective values.
 */
export function replaceInlineJS(code) {
	const replacements = [
		{ searchValue: nameFieldDefaults.slug, replaceValue: config.theme.slug },
		{ searchValue: toCamelCase(nameFieldDefaults.slug), replaceValue: toCamelCase(config.theme.slug ) }
	];

	return code.replace(new RegExp(replacements.map(r => r.searchValue).join('|'), 'g'), match => {
		const replacement = replacements.find(r => new RegExp(r.searchValue).test(match));
		return replacement ? replacement.replaceValue : match;
	});
};
