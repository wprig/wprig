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

/**
 * Internal dependencies
 */
import {
	gulpPlugins,
	nameFieldDefaults,
	prodThemePath,
	isProd,
	rootPath,
} from './constants';

export const getDefaultConfig = () => require( `${ rootPath }/config/config.default.json` );

/**
 * Get theme configuration.
 *
 * @param {boolean} uncached Whether to get an uncached version of the configuration. Defaults to false.
 * @return {Object} Theme configuration data.
 */
export function getThemeConfig( uncached = false ) {
	let config;
	const configPath = `${ process.cwd() }/config/themeConfig.js`;

	if ( uncached ) {
		config = importFresh( configPath );
	} else {
		config = require( configPath );
	}

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
	// Get a copy of the config
	const config = getThemeConfig( isProd );

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

	// Return a single stream containing all the
	// string replacement tasks
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
	// Check if the prod theme directory exists
	if ( fs.existsSync( prodThemePath ) ) {
		// and remove it
		rimraf.sync( prodThemePath );
	}

	// Create the prod theme directory
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
	// We won't find anything if the location to search is empty
	if ( 0 === configValueLocation.length ) {
		return false;
	}

	// Get a copy of the config
	let config = getThemeConfig();

	// Turn the value location given into an array
	const configValueLocationArray = configValueLocation.split( '.' );

	// Remove config from the array if present
	if ( 'config' === configValueLocationArray[ 0 ] ) {
		configValueLocationArray.shift();
	}

	// Loop through the config value paths passed
	for ( const currentValueLocation of configValueLocationArray ) {
		// Check if there is a match in the current object level
		if ( ! Object.prototype.hasOwnProperty.call( config, currentValueLocation ) ) {
			// Return false if no match
			return false;
		}

		// Move the config object to the next level
		config = config[ currentValueLocation ];
	}

	// If we've made it this far there is a match for the given config value path
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

	// Loop through all file paths
	for ( const filePath of filePaths ) {
		// And push them into output with the base added
		output.push( `${ basePath }/${ filePath }` );
	}

	return output;
}
