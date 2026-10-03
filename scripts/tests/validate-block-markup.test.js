/* eslint-env es6 */
/* global describe, test, expect */

import path from 'path';
import { fileURLToPath } from 'url';
import {
	validateBlockMarkup,
	neutralizeRuntimePhp,
} from '../../scripts/lib/validate-block-markup.js';

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

describe( 'baked runtime-URL tolerance (SPEC-015 §5.3)', () => {
	const coreBlocksPath = path.join( __dirname, 'fixtures', 'core-blocks' );

	const themeExpr = '<?php echo esc_url( get_stylesheet_directory_uri() ); ?>';
	const uploadsExprUnescaped =
		'<?php echo esc_url( wp_get_upload_dir()["baseurl"] ); ?>';
	const uploadsExprEscaped =
		'<?php echo esc_url( wp_get_upload_dir()[\\"baseurl\\"] ); ?>';
	const homeExpr = '<?php echo esc_url( home_url() ); ?>';

	test( 'accepts each of the three runtime-URL expressions in attributes', () => {
		const cases = [
			themeExpr,
			uploadsExprUnescaped,
			uploadsExprEscaped,
			homeExpr,
		];

		for ( const expression of cases ) {
			const result = validateBlockMarkup(
				`<!-- wp:paragraph {"url":"${ expression }"} -->`,
				'patterns/welcome-banner.php',
				{ coreBlocksPath }
			);
			expect( result.errors ).toEqual( [] );
		}
	} );

	test( 'still rejects rogue PHP expressions in attributes', () => {
		const result = validateBlockMarkup(
			'<!-- wp:paragraph {"url":"<?php echo get_post_meta( 1 ); ?>"} -->',
			'patterns/bad.php',
			{ coreBlocksPath }
		);

		expect( result.errors ).toHaveLength( 1 );
		expect( result.errors[ 0 ].message ).toMatch(
			/Un-approved PHP expression/
		);
	} );

	test( 'still rejects malformed JSON around an approved expression', () => {
		const result = validateBlockMarkup(
			`<!-- wp:paragraph {"url":"${ uploadsExprUnescaped }","broken":} -->`,
			'patterns/broken.php',
			{ coreBlocksPath }
		);

		expect( result.errors ).toHaveLength( 1 );
		expect( result.errors[ 0 ].message ).toMatch( /Invalid JSON syntax/ );
	} );

	test( 'neutralizeRuntimePhp unit contract', () => {
		const clean = neutralizeRuntimePhp(
			`{"url":"${ uploadsExprEscaped }"}`
		);
		expect( clean.neutralized ).toBe(
			'{"url":"__WPRIG_RUNTIME_URL__"}'
		);
		expect( clean.phpDetected ).toBe( false );

		const rogue = neutralizeRuntimePhp(
			'{"url":"<?php echo wp_head(); ?>"}'
		);
		expect( rogue.phpDetected ).toBe( true );
	} );
} );
