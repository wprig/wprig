/* eslint-env es6 */
/* global test, expect */

/**
 * Internal dependencies
 */
import { parseName, decodeHtmlEntities } from '../lib/block-utils.js';

test( 'parseName parses full block name', () => {
	const result = parseName( 'my-ns/my-block' );
	expect( result.namespace ).toBe( 'my-ns' );
	expect( result.slug ).toBe( 'my-block' );
	expect( result.full ).toBe( 'my-ns/my-block' );
} );

test( 'parseName parses slug only name with default namespace', () => {
	const result = parseName( 'hero-block' );
	expect( result.namespace ).toBeDefined();
	expect( result.slug ).toBe( 'hero-block' );
} );

test( 'parseName normalizes namespace and slug', () => {
	const result = parseName( 'My_Namespace/My-Block!' );
	expect( result.namespace ).toBe( 'my-namespace' );
	expect( result.slug ).toBe( 'my-block' );
} );

test( 'parseName throws on invalid input', () => {
	expect( () => parseName( '' ) ).toThrow();
	expect( () => parseName( 'a/b/c' ) ).toThrow();
} );

test( 'decodeHtmlEntities decodes common entities', () => {
	expect( decodeHtmlEntities( '&quot;test&quot;' ) ).toBe( '"test"' );
	expect( decodeHtmlEntities( '&lt;div&gt;' ) ).toBe( '<div>' );
	expect( decodeHtmlEntities( 'A &amp; B' ) ).toBe( 'A & B' );
	expect( decodeHtmlEntities( 'It&#39;s me' ) ).toBe( "It's me" );
} );

test( 'decodeHtmlEntities handles non-string input', () => {
	expect( decodeHtmlEntities( null ) ).toBeNull();
	expect( decodeHtmlEntities( undefined ) ).toBeUndefined();
	expect( decodeHtmlEntities( 123 ) ).toBe( 123 );
} );
