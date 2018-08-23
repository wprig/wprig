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

	if ( ! config.theme.constant ) {
		config.theme.constant = config.theme.slug.toUpperCase();
	}

	return config;
}