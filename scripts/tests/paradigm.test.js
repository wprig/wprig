/* eslint-env es6 */

/**
 * Internal dependencies
 */
import {
	loadParadigms,
	validateThemeType,
	getActiveThemeType,
	isFeatureEnabled,
} from '../lib/paradigm.js';

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

test( 'getActiveThemeType resolves from the merged config default', () => {
	expect( getActiveThemeType() ).toBe( 'classic' );
} );

test( 'isFeatureEnabled follows the tag matrix for the active theme type', () => {
	// Active theme type is 'classic' (the repo default).
	expect( isFeatureEnabled( 'all' ) ).toBe( true );
	expect( isFeatureEnabled( 'classic' ) ).toBe( true );
	expect( isFeatureEnabled( 'universal' ) ).toBe( false );
	expect( isFeatureEnabled( 'block-based' ) ).toBe( false );
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
