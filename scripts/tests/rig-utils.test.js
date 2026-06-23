/* eslint-env es6 */
/* global test, expect */

/**
 * Internal dependencies
 */
import { toPascalCase } from '../lib/rig-utils.js';

test( 'toPascalCase normalizes slugs correctly', () => {
	expect( toPascalCase( 'mega-menu' ) ).toBe( 'Mega_Menu' );
	expect( toPascalCase( 'mega_menu' ) ).toBe( 'Mega_Menu' );
	expect( toPascalCase( 'mega menu' ) ).toBe( 'Mega_Menu' );
	expect( toPascalCase( 'test' ) ).toBe( 'Test' );
} );

test( 'toPascalCase handles digits at the start by prepending an underscore', () => {
	expect( toPascalCase( '123-test' ) ).toBe( '_123_Test' );
	expect( toPascalCase( '404' ) ).toBe( '_404' );
} );

test( 'toPascalCase handles multiple separators', () => {
	expect( toPascalCase( 'very--long--slug' ) ).toBe( 'Very_Long_Slug' );
	expect( toPascalCase( 'multi-word_slug' ) ).toBe( 'Multi_Word_Slug' );
} );
