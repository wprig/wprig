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
 * Get string replacement streams to push into a pump process.
 *
 * @return {Array} List of tasks.
 */
export function getStringReplacementTasks() {
	// const config = getThemeConfig( isProd );
	// Are we getting the correct config? We have to make sure it's all dynamic enough
	// We also need to replace this stringReplace from gulpPlugins. Ughhhh
	const stringReplacementTasks = Object.keys( nameFieldDefaults ).map( ( nameField ) => {
		return gulpPlugins.stringReplace(
			// Backslashes must be double escaped for regex
			nameFieldDefaults[ nameField ].replace( /\\/g, '\\\\' ),
			config.theme[ nameField ],
			{
				logs: {
					enabled: false,
				},
				searchValue: 'regex',
			}
		);
	} );

	return pipeline.obj( stringReplacementTasks );
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
