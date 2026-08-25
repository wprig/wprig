/**
 * Tests for the block pattern validator helpers.
 */

import {
	normalizeHeaderKey,
	parsePatternHeaders,
	extractPatternContent,
	checkPatternHeaders,
	checkPatternContent,
} from '../tasks/validatePatterns.js';

const SAMPLE_PATTERN = `<?php
/**
 * Title: Hero Section
 * Slug: test-theme/hero-section
 * Categories: hero, featured
 * Description: A starter hero pattern.
 * Keywords: hero, banner
 * Viewport Width: 1280
 * Text Domain: test-theme
 */
?>
<!-- wp:group {"align":"full"} -->
<div class="wp-block-group alignfull">
	<!-- wp:heading -->
	<h2 class="wp-block-heading">Welcome</h2>
	<!-- /wp:heading -->
</div>
<!-- /wp:group -->`;

describe( 'normalizeHeaderKey', () => {
	test( 'camelCases multi-word headers', () => {
		expect( normalizeHeaderKey( 'Viewport Width' ) ).toBe(
			'viewportWidth'
		);
		expect( normalizeHeaderKey( 'Text Domain' ) ).toBe( 'textDomain' );
	} );

	test( 'keeps single-word keys lowercase', () => {
		expect( normalizeHeaderKey( 'Title' ) ).toBe( 'title' );
		expect( normalizeHeaderKey( 'Slug' ) ).toBe( 'slug' );
	} );
} );

describe( 'parsePatternHeaders', () => {
	test( 'parses all file-header metadata', () => {
		expect( parsePatternHeaders( SAMPLE_PATTERN ) ).toEqual( {
			title: 'Hero Section',
			slug: 'test-theme/hero-section',
			categories: 'hero, featured',
			description: 'A starter hero pattern.',
			keywords: 'hero, banner',
			viewportWidth: '1280',
			textDomain: 'test-theme',
		} );
	} );

	test( 'returns an empty object for a headerless file', () => {
		expect(
			parsePatternHeaders(
				'<!-- wp:paragraph --><p>Hi</p><!-- /wp:paragraph -->'
			)
		).toEqual( {} );
	} );
} );

describe( 'extractPatternContent', () => {
	test( 'returns only the block markup', () => {
		const markup = extractPatternContent( SAMPLE_PATTERN );
		expect( markup.startsWith( '<!-- wp:group' ) ).toBe( true );
		expect( markup.includes( 'Hero Section' ) ).toBe( false );
	} );

	test( 'returns an empty string when no blocks are present', () => {
		expect( extractPatternContent( '<?php echo "hi"; ?>' ) ).toBe( '' );
	} );
} );

describe( 'checkPatternHeaders', () => {
	test( 'accepts a valid, complete pattern', () => {
		const result = checkPatternHeaders(
			{
				title: 'Hero Section',
				slug: 'test-theme/hero-section',
				categories: 'hero, featured',
			},
			{ knownCategories: { hero: 'Hero', featured: 'Featured' } }
		);

		expect( result.errors ).toHaveLength( 0 );
		expect( result.warnings ).toHaveLength( 0 );
	} );

	test( 'flags missing Title and Slug', () => {
		const result = checkPatternHeaders( { categories: 'hero' } );
		const messages = result.errors.map( ( e ) => e.message );

		expect( messages ).toContain(
			'Missing required "Title" header. Block pattern metadata is not translatable without a title.'
		);
		expect( messages ).toContain(
			'Missing required "Slug" header (expected "theme/pattern-name").'
		);
	} );

	test( 'flags the placeholder title', () => {
		const result = checkPatternHeaders( {
			title: 'New Pattern',
			slug: 't/x',
			categories: 'hero',
		} );
		expect( result.errors ).toHaveLength( 1 );
		expect( result.errors[ 0 ].message ).toMatch( /Placeholder title/ );
	} );

	test( 'flags an invalid slug charset', () => {
		const result = checkPatternHeaders( {
			title: 'Good',
			slug: 'bad slug!',
			categories: 'hero',
		} );
		expect( result.errors[ 0 ].message ).toMatch( /Invalid slug/ );
	} );

	test( 'warns about unknown categories', () => {
		const result = checkPatternHeaders(
			{ title: 'Good', slug: 't/good', categories: 'bogus' },
			{ knownCategories: { hero: 'Hero' } }
		);
		expect( result.warnings ).toHaveLength( 1 );
		expect( result.warnings[ 0 ].message ).toMatch(
			/Unknown category "bogus"/
		);
	} );
} );

describe( 'checkPatternContent', () => {
	test( 'passes clean starter content', () => {
		expect(
			checkPatternContent(
				'<!-- wp:paragraph --><p>Start here.</p><!-- /wp:paragraph -->'
			)
		).toHaveLength( 0 );
	} );

	test( 'flags "Hello world!" placeholder content', () => {
		const errors = checkPatternContent(
			'<!-- wp:paragraph --><p>Hello world!</p><!-- /wp:paragraph -->'
		);
		expect( errors ).toHaveLength( 1 );
		expect( errors[ 0 ].message ).toMatch( /Placeholder content/ );
	} );

	test( 'flags un-substituted template placeholders', () => {
		const errors = checkPatternContent(
			'<p>This is the "{{title}}" pattern.</p>'
		);
		expect( errors ).toHaveLength( 1 );
		expect( errors[ 0 ].message ).toMatch(
			/Un-substituted template placeholders/
		);
	} );
} );
