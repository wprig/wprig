/* eslint-disable no-unused-vars, @wordpress/no-unused-vars-before-return, jsdoc/require-param-type */
import fs from 'fs';
import path from 'path';
import { REQUIRED, INFO, WARNING } from '../lib/severity.js';
import {
	findCorePresetCollisions,
	describeCorePresetCollision,
} from '../../lib/core-preset-slugs.js';

const HANDBOOK_URL =
	'https://make.wordpress.org/themes/handbook/review/required/#theme-json';

export function run( themePath, themeSlug ) {
	const findings = [];
	const themeJsonPath = path.join( themePath, 'theme.json' );

	if ( ! fs.existsSync( themeJsonPath ) ) {
		// INFO level: theme.json is not strictly required for classic themes
		return [
			{
				id: 'theme-json.missing',
				severity: INFO,
				check: 'theme-json',
				message: 'No theme.json found. Skipping JSON checks.',
				file: 'theme.json',
				line: null,
				handbook: HANDBOOK_URL,
			},
		];
	}

	const content = fs.readFileSync( themeJsonPath, 'utf8' );

	try {
		const data = JSON.parse( content );

		// Basic Structure Checks
		if ( data.version !== 2 && data.version !== 3 ) {
			findings.push( {
				id: 'theme-json.version',
				severity: WARNING,
				check: 'theme-json',
				message: `theme.json version should ideally be 2 or 3 (Found: ${ data.version }).`,
				file: 'theme.json',
				line: null,
				handbook: HANDBOOK_URL,
				fixHint: `Update the theme.json "version" property.`,
			} );
		}

		// In the future, we could download the JSON schema and use Ajv,
		// but a basic JSON parse is a great start for fatal errors.

		// Preset slug collisions with WP core defaults (silent override risk).
		for ( const collision of findCorePresetCollisions( data ) ) {
			findings.push( {
				id: `theme-json.core-preset-collision.${ collision.type }.${ collision.slug }`,
				severity: WARNING,
				check: 'theme-json',
				message: describeCorePresetCollision( collision ),
				file: 'theme.json',
				line: null,
				handbook: HANDBOOK_URL,
				fixHint: `Rename the "${ collision.slug }" slug or disable core defaults (defaultPalette/defaultFontSizes/defaultGradients/defaultDuotone: false).`,
			} );
		}
	} catch ( err ) {
		// Syntax error in JSON
		findings.push( {
			id: 'theme-json.syntax-error',
			severity: REQUIRED,
			check: 'theme-json',
			message: `Syntax error in theme.json: ${ err.message }`,
			file: 'theme.json',
			line: null,
			handbook: HANDBOOK_URL,
			fixHint: `Fix JSON formatting (ensure strict double quotes, no trailing commas).`,
		} );
	}

	return findings;
}
