'use strict';

/**
 * WP Rig Paradigm Helper
 *
 * Resolves the active theme-dev paradigm from the merged theme config and
 * evaluates feature tags against it. This is the JS half of the single source
 * of truth defined in config/paradigms.json.
 *
 * - getActiveThemeType()   -> validated theme.themeType (fails fast on invalid)
 * - isFeatureEnabled(tag)  -> whether a feature tagged 'all' | 'classic' |
 *                             'universal' | 'block-based' ships for the active type
 */

import fs from 'node:fs';
import path from 'node:path';
import themeConfig from '../../config/themeConfig.js';

const PARADIGMS_PATH = path.resolve( process.cwd(), 'config/paradigms.json' );

let cachedDefinitions = null;

/**
 * Loads the paradigm definitions from config/paradigms.json (cached).
 *
 * @return {Object} { themeTypes, tags }
 */
export function loadParadigms() {
	if ( cachedDefinitions ) {
		return cachedDefinitions;
	}

	if ( ! fs.existsSync( PARADIGMS_PATH ) ) {
		throw new Error(
			`Missing paradigm definitions at ${ PARADIGMS_PATH }. ` +
				'config/paradigms.json is the single source of truth for theme paradigms.'
		);
	}

	const definitions = JSON.parse(
		fs.readFileSync( PARADIGMS_PATH, 'utf-8' )
	);
	if ( ! definitions?.themeTypes || ! definitions?.tags ) {
		throw new Error(
			`${ PARADIGMS_PATH } must define both "themeTypes" and "tags".`
		);
	}

	cachedDefinitions = definitions;
	return definitions;
}

/**
 * Validates a theme type against the paradigm definitions.
 *
 * @param {string} themeType Theme type to validate.
 * @return {string} The validated theme type.
 * @throws {Error} When the theme type is unknown.
 */
export function validateThemeType( themeType ) {
	const definitions = loadParadigms();
	const valid = Object.keys( definitions.themeTypes );

	if ( typeof themeType !== 'string' || ! valid.includes( themeType ) ) {
		throw new Error(
			`Invalid theme.themeType "${ String( themeType ) }". ` +
				`Valid values: ${ valid.join( ', ' ) }. ` +
				'Fix config/config.json or the default in config/config.default.json.'
		);
	}

	return themeType;
}

/**
 * Resolves and validates the active theme type from the merged config.
 *
 * @return {string} Active theme type.
 */
export function getActiveThemeType() {
	return validateThemeType( themeConfig?.theme?.themeType );
}

/**
 * Determines whether a feature tagged with the given paradigm is enabled for
 * the active theme type.
 *
 * @param {string} tag Feature paradigm tag ('all', 'classic', 'universal', 'block-based').
 * @return {boolean} True when the feature ships for the active theme type.
 * @throws {Error} When the tag is unknown.
 */
export function isFeatureEnabled( tag ) {
	const definitions = loadParadigms();
	const validTags = Object.keys( definitions.tags );

	if ( ! validTags.includes( tag ) ) {
		throw new Error(
			`Unknown paradigm tag "${ tag }". Valid tags: ${ validTags.join(
				', '
			) }.`
		);
	}

	return definitions.tags[ tag ].includes( getActiveThemeType() );
}
