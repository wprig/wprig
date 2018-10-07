/* eslint-env es6 */
'use strict';

// External dependencies
import requireUncached from 'require-uncached';

// Internal dependencies
import {rootPath, gulpPlugins, gulpReplaceOptions, nameFieldDefaults} from './constants';

/**
 * Get theme configuration.
 *
 * @param {bool} uncached Whether to get an uncached version of the configuration. Defaults to false.
 * @return {object} Theme configuration data.
 */
export function getThemeConfig( uncached=false ) {
    let config;

	if ( uncached ) {
		config = requireUncached(`${rootPath}/config/themeConfig.js`);
	} else {
		config = require(`${rootPath}/config/themeConfig.js`);
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
		return gulpPlugins.stringReplace( nameFieldDefaults[ nameField ], config.theme[ nameField ], gulpReplaceOptions );
	});
}
