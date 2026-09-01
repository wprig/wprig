/* eslint-env es6 */

/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Internal dependencies
 */
import {
	loadParadigms,
	validateThemeType,
	getActiveThemeType,
	isFeatureEnabled,
} from '../lib/paradigm.js';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

/**
 * Independently resolves the active theme type from the config chain
 * (config.default.json -> config.json -> config.local.json) so the
 * resolution tests verify the merge contract rather than a hardcoded
 * repo default. Must stay in lockstep with config/themeConfig.js.
 *
 * @return {string|undefined} The theme type the merged config should yield.
 */
function expectedThemeType() {
	const read = ( file ) => {
		const p = path.resolve( __dirname, '../../config', file );
		return fs.existsSync( p )
			? JSON.parse( fs.readFileSync( p, 'utf-8' ) )
			: {};
	};
	const layers = [
		read( 'config.default.json' ),
		read( 'config.json' ),
		read( 'config.local.json' ),
	];
	for ( const layer of [ ...layers ].reverse() ) {
		const type = layer?.theme?.themeType;
		if ( typeof type === 'string' ) {
			return type;
		}
	}
	return undefined;
}

test( 'loadParadigms exposes themeTypes and the tag matrix', () => {
	const paradigms = loadParadigms();

	expect( Object.keys( paradigms.themeTypes ) ).toEqual(
		expect.arrayContaining( [ 'classic', 'universal', 'block-based' ] )
	);
	expect( paradigms.tags.all ).toEqual( [
		'classic',
		'universal',
		'block-based',
	] );
	expect( paradigms.tags.classic ).toEqual( [ 'classic', 'universal' ] );
	expect( paradigms.tags.universal ).toEqual( [ 'universal' ] );
	expect( paradigms.tags[ 'block-based' ] ).toEqual( [
		'universal',
		'block-based',
	] );
} );

test( 'getActiveThemeType resolves from the merged config chain', () => {
	// Derived from the config files, not hardcoded — the theme type is
	// configurable and tests must pass for any valid override.
	expect( getActiveThemeType() ).toBe( expectedThemeType() );
} );

test( 'isFeatureEnabled follows the tag matrix for the active theme type', () => {
	const active = getActiveThemeType();
	const { tags } = loadParadigms();

	for ( const tag of Object.keys( tags ) ) {
		expect( isFeatureEnabled( tag ) ).toBe(
			tags[ tag ].includes( active )
		);
	}
} );

test( 'the config chain resolves to a theme type the matrix defines', () => {
	// Guards the expectation helper itself: if the resolved type were ever
	// undefined or stale relative to paradigms.json, the above tests would
	// pass vacuously. This keeps the suite honest for any config override.
	const type = getActiveThemeType();
	expect( Object.keys( loadParadigms().themeTypes ) ).toContain( type );
	expect( type ).toBe( expectedThemeType() );
} );

test( 'validateThemeType accepts known theme types', () => {
	expect( validateThemeType( 'classic' ) ).toBe( 'classic' );
	expect( validateThemeType( 'universal' ) ).toBe( 'universal' );
	expect( validateThemeType( 'block-based' ) ).toBe( 'block-based' );
} );

test( 'validateThemeType fails fast on an unknown theme type', () => {
	expect( () => validateThemeType( 'bogus' ) ).toThrow(
		/Invalid theme\.themeType "bogus"/
	);
	expect( () => validateThemeType( undefined ) ).toThrow(
		/Invalid theme\.themeType/
	);
} );

test( 'isFeatureEnabled fails fast on an unknown tag', () => {
	expect( () => isFeatureEnabled( 'bogus-tag' ) ).toThrow(
		/Unknown paradigm tag "bogus-tag"/
	);
} );
