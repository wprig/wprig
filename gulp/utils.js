/* eslint-env es6 */
'use strict';

// External dependencies
import importFresh from 'import-fresh';
import log from 'fancy-log';
import colors from 'ansi-colors';
import rimraf from 'rimraf';
import mkdirp from 'mkdirp';
import fs from 'fs';

// Internal dependencies
import {
	gulpPlugins,
	nameFieldDefaults,
	prodThemePath,
	paths
} from './constants';

/**
 * Get theme configuration.
 *
 * @param {bool} uncached Whether to get an uncached version of the configuration. Defaults to false.
 * @return {object} Theme configuration data.
 */
export function getThemeConfig( uncached=false ) {
	let config;

	if ( uncached ) {
		config = importFresh(paths.config.themeConfig);
	} else {
		config = require(paths.config.themeConfig);
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
			.map( part => part[0].toUpperCase() + part.substring( 1 ) )
			.join( '' );
	}

	if ( ! config.theme.camelCaseVar ) {
		config.theme.camelCaseVar = config.theme.camelCase[0].toLowerCase() + config.theme.camelCase.substring( 1 );
	}

	return config;
}

/**
 * Get string replacement streams to push into a pump process.
 *
 * @return {array} List of tasks.
 */
export function getStringReplacementTasks() {
	// Get a fresh copy of the config
	const config = getThemeConfig(true);

	return Object.keys( nameFieldDefaults ).map( nameField => {
		return gulpPlugins.stringReplace(
			// Backslashes must be double escaped for regex
			nameFieldDefaults[ nameField ].replace(/\\/g,'\\\\'),
			config.theme[ nameField ],
			{
				logs: {
					enabled: false
				},
				searchValue: 'regex'
			}
		);
	});
}

export function logError(errorTitle='gulp') {
	return gulpPlugins.plumber({
		errorHandler: gulpPlugins.notify.onError({
			title: errorTitle,
			message: '<%= error.message %>'
		})
	});
}

export function createProdDir() {
	log(colors.green(`Creating the production theme directory ${prodThemePath}`));
    // Check if the prod theme directory exists
    if ( fs.existsSync(prodThemePath) ) {
        // and remove it
        rimraf.sync(prodThemePath);
    }

    // Create the prod theme directory
	mkdirp(prodThemePath);
}

export function gulpRelativeDest( file ) {
	const relativeProdFilePath = file.base.replace(file.cwd, prodThemePath);
	return relativeProdFilePath;
}