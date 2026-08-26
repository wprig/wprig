/* eslint-env es6 */
/* global describe, test, expect */

import path from 'path';
import { fileURLToPath } from 'url';
import { validateBlockMarkup } from '../../scripts/lib/validate-block-markup.js';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );

describe( 'Gutenberg Block Markup Validator (shared core)', () => {
	// Self-contained fixture core-block schemas (mirrors WP core paragraph/
	// list-item/group/post-content). Using fixtures keeps the suite runnable on
	// any CI runner — a live WordPress wp-includes/blocks is NOT present there.
	const coreBlocksPath = path.join(
		__dirname,
		'fixtures',
		'core-blocks'
	);

	test( 'validates open and self-closing block comments', () => {
		const markup = `
			<!-- wp:group {"layout":{"type":"constrained"}} -->
			<!-- wp:paragraph {"align":"center"} --><p class="aligncenter">Hi</p><!-- /wp:paragraph -->
			<!-- /wp:group -->
			<!-- wp:post-content /-->
		`;
		const result = validateBlockMarkup( markup, 'template.html', {
			coreBlocksPath,
		} );
		expect( result.errors ).toHaveLength( 0 );
		expect( result.validated ).toBe( 3 );
	} );

	test( 'ignores closing block comments', () => {
		const result = validateBlockMarkup(
			'<!-- /wp:group -->',
			'template.html',
			{ coreBlocksPath }
		);
		expect( result.validated ).toBe( 0 );
	} );

	test( 'flags custom classes on blocks that forbid them (className:false)', () => {
		const result = validateBlockMarkup(
			'<!-- wp:list-item {"className":"my-class"} -->',
			'part.html',
			{ coreBlocksPath }
		);
		expect( result.errors ).toHaveLength( 1 );
		expect( result.errors[ 0 ].message ).toMatch( /EXPLICITLY forbidden/ );
	} );

	test( 'flags invalid JSON in block attributes', () => {
		const result = validateBlockMarkup(
			'<!-- wp:paragraph {"align":} -->',
			'part.html',
			{ coreBlocksPath }
		);
		expect( result.errors ).toHaveLength( 1 );
		expect( result.errors[ 0 ].message ).toMatch( /Invalid JSON syntax/ );
	} );

	test( 'warns (not errors) on unlisted attributes', () => {
		const result = validateBlockMarkup(
			'<!-- wp:paragraph {"nonExistentAttr":1} -->',
			'part.html',
			{ coreBlocksPath }
		);
		expect( result.errors ).toHaveLength( 0 );
		expect( result.warnings ).toHaveLength( 1 );
		expect( result.warnings[ 0 ].message ).toMatch( /unlisted attribute/ );
	} );
} );
