/* eslint-env es6 */
/* global describe, test, expect */

import {
	validateBlockMarkup,
	resolveCoreBlocksPath,
} from '../../scripts/lib/validate-block-markup.js';

describe( 'Gutenberg Block Markup Validator (shared core)', () => {
	const coreBlocksPath = resolveCoreBlocksPath( process.cwd() );

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
