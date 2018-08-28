/* eslint-env es6 */
'use strict';

// External dependencies
import requireUncached from 'require-uncached';

// Internal dependencies
import {rootPath} from './constants';

/**
 * Get theme configuration.
 *
 * @param {bool} uncached Whether to get an uncached version of the configuration. Defaults to false.
 * @return {object} Theme configuration data.
 */
export function getThemeConfig( uncached=false ) {
    let config;

	if ( uncached ) {
		config = requireUncached(`${rootPath}/dev/config/themeConfig.js`);
	} else {
		config = require(`${rootPath}/dev/config/themeConfig.js`);
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
