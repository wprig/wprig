/* eslint-env es6 */
'use strict';

// External dependencies
import requireUncached from 'require-uncached';

// Internal dependencies
import {paths} from './constants';

/**
 * Get theme configuration.
 *
 * @param {bool} uncached Whether to get an uncached version of the configuration. Defaults to false.
 * @return {object} Theme configuration data.
 */
export function getThemeConfig( uncached=false ) {
	var config;

	if ( uncached ) {
		config = requireUncached(paths.config.themeConfig);
	} else {
		config = require(paths.config.themeConfig);
	}

	if ( ! config.theme.constant ) {
		config.theme.constant = config.theme.slug.toUpperCase();
	}

	return config;
}