/**
 * Tests for the user-styles overlay merge in buildThemeJson (SPEC-016 §3/§5).
 *
 * The overlay is baked by rig:bake into config/user-styles.json and merged
 * LAST by the tokens generator — tokens stay canonical, user decisions win,
 * and regeneration is deterministic.
 */

import {
	buildThemeJson,
	deepMergePreservingArrays,
	stripOverlaySsotKeys,
	validateUserStylesOverlay,
	collapseOverlayFonts,
} from '../tasks/tokens.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );
const themeRoot = path.resolve( __dirname, '../..' );

const tokens = JSON.parse(
	fs.readFileSync( path.join( themeRoot, 'config', 'tokens.json' ), 'utf8' )
);

const overlay = {
	$comment: 'Baked by rig:bake.',
	capturedAt: '2026-09-08T12:00:00Z',
	globalStylesPostId: 1234,
	settings: {
		color: {
			palette: [
				{ slug: 'user-red', color: '#ff0000', name: 'User Red' },
			],
			custom: false,
			duotone: [ { slug: 'user-duotone', colors: [ '#000', '#fff' ] } ],
		},
		// SSOT collision attempts — must never merge.
		viewport: { mobile: '999px', tablet: '999px' },
		blockVisibility: { allowEditing: false },
	},
	styles: {
		color: { text: '#123456' },
		blocks: {
			'core/paragraph': {
				color: { text: '#abcdef' },
				typography: { fontSize: '2rem' },
			},
		},
	},
	fonts: {
		themeFamilies: [
			{
				slug: 'baked-serif',
				name: 'Baked Serif',
				fontFamily: 'Baked Serif, serif',
				fontFace: [
					{
						src: [ 'file:./assets/fonts/baked-serif/baked.woff2' ],
						fontWeight: '400',
					},
				],
			},
		],
		customFamilies: [
			{
				slug: 'inter',
				name: 'Inter',
				fontFamily: 'Inter, sans-serif',
				fontFace: [
					{
						src: [
							'file:./assets/fonts/inter/inter-300-normal.woff2',
						],
						fontWeight: '300',
					},
				],
			},
		],
	},
};

describe( 'buildThemeJson — user-styles overlay merge (SPEC-016 §3)', () => {
	test( '1. overlay absent → output byte-identical to current behavior (regression)', () => {
		const withoutOverlay = buildThemeJson( tokens, undefined );
		const withNullOverlay = buildThemeJson( tokens, undefined, null );

		expect( withNullOverlay ).toEqual( withoutOverlay );
	} );

	test( '2. overlay palette REPLACES the token palette (arrays replace, not union)', () => {
		const themeJson = buildThemeJson( tokens, undefined, overlay );

		expect( themeJson.settings.color.palette ).toEqual( [
			{ slug: 'user-red', color: '#ff0000', name: 'User Red' },
		] );

		// Non-array sibling keys merge recursively instead of replacing.
		expect( themeJson.settings.color.custom ).toBe( false );

		// Tokens-owned keys untouched by the overlay survive.
		expect( themeJson.settings.appearanceTools ).toBe( true );
	} );

	test( '3. overlay styles merge over generated styles, nested blocks included', () => {
		const themeJson = buildThemeJson( tokens, undefined, overlay );

		expect( themeJson.styles.color.text ).toBe( '#123456' );
		expect( themeJson.styles.blocks[ 'core/paragraph' ] ).toEqual( {
			color: { text: '#abcdef' },
			typography: { fontSize: '2rem' },
		} );

		// Generated link states survive (object siblings merge).
		expect( themeJson.styles.elements.link[ ':hover' ] ).toEqual( {
			color: { text: 'var(--color-link-active)' },
		} );
	} );

	test( '4. SSOT keys survive overlay collision attempts', () => {
		const themeJson = buildThemeJson( tokens, undefined, overlay );

		expect( themeJson.settings.viewport ).toEqual( {
			mobile: '480px',
			tablet: '782px',
		} );
		expect( themeJson.settings.blockVisibility ).toEqual( {
			allowEditing: true,
		} );
		expect( themeJson.version ).toBe( 3 );
		expect( themeJson.$schema ).toBe(
			'https://schemas.wp.org/wp/7.1/theme.json'
		);
	} );

	test( '4b. guard key isGlobalStylesUserThemeJSON never merges', () => {
		const themeJson = buildThemeJson( tokens, undefined, {
			...overlay,
			isGlobalStylesUserThemeJSON: true,
		} );

		expect( themeJson.isGlobalStylesUserThemeJSON ).toBeUndefined();
	} );

	test( '5. fonts collapse replaces the token-derived fontFamilies list', () => {
		const themeJson = buildThemeJson( tokens, undefined, overlay );

		const slugs = themeJson.settings.typography.fontFamilies.map(
			( family ) => family.slug
		);

		// Token families replaced by [ themeFamilies..., customFamilies... ].
		expect( slugs ).toEqual( [ 'baked-serif', 'inter' ] );
		expect(
			themeJson.settings.typography.fontFamilies[ 1 ].fontFace[ 0 ]
				.src[ 0 ]
		).toBe( 'file:./assets/fonts/inter/inter-300-normal.woff2' );
	} );

	test( '5b. duplicate slugs resolve to the custom definition', () => {
		const merged = collapseOverlayFonts( {
			themeFamilies: [ { slug: 'inter', fontFamily: 'Theme Inter' } ],
			customFamilies: [ { slug: 'inter', fontFamily: 'Custom Inter' } ],
		} );

		expect( merged ).toEqual( [
			{ slug: 'inter', fontFamily: 'Custom Inter' },
		] );
	} );

	test( '5c. an overlay without a fonts block keeps the token families', () => {
		const { fonts, ...noFonts } = overlay;
		const themeJson = buildThemeJson( tokens, undefined, noFonts );

		expect( themeJson.settings.typography.fontFamilies ).toHaveLength(
			Object.keys( tokens.typography.fontFamilies ).length
		);
	} );

	test( '6. determinism: two runs with the same inputs are deep-equal', () => {
		const first = buildThemeJson( tokens, undefined, overlay );
		const second = buildThemeJson( tokens, undefined, overlay );

		expect( JSON.parse( JSON.stringify( first ) ) ).toEqual(
			JSON.parse( JSON.stringify( second ) )
		);
	} );

	test( '7. malformed overlays fail fast naming config/user-styles.json', () => {
		expect( () => validateUserStylesOverlay( null ) ).toThrow(
			/config\/user-styles\.json/
		);
		expect( () => validateUserStylesOverlay( [] ) ).toThrow(
			/config\/user-styles\.json/
		);
		expect( () => validateUserStylesOverlay( { settings: {} } ) ).toThrow(
			/config\/user-styles\.json/
		);
		expect( () =>
			validateUserStylesOverlay( { settings: [], styles: {} } )
		).toThrow( /expected "settings" and "styles" objects/ );
		expect( () =>
			validateUserStylesOverlay( {
				settings: {},
				styles: {},
				fonts: [],
			} )
		).toThrow( /"fonts" must be an object/ );
	} );
} );

describe( 'overlay merge primitives', () => {
	test( 'deepMergePreservingArrays: objects recurse, arrays replace wholesale', () => {
		const target = {
			color: { palette: [ 'a' ], custom: true },
			spacing: { sizes: [ 1, 2 ] },
		};
		const source = {
			color: { palette: [ 'b', 'c' ], background: 'red' },
			spacing: { sizes: [ 3 ] },
		};

		expect( deepMergePreservingArrays( target, source ) ).toEqual( {
			color: { palette: [ 'b', 'c' ], custom: true, background: 'red' },
			spacing: { sizes: [ 3 ] },
		} );
	} );

	test( 'stripOverlaySsotKeys removes top-level and nested SSOT keys', () => {
		const cleaned = stripOverlaySsotKeys( {
			$schema: 'https://example.com/schema.json',
			version: 3,
			isGlobalStylesUserThemeJSON: true,
			settings: {
				viewport: { mobile: '999px' },
				blockVisibility: { allowEditing: false },
				color: { custom: false },
			},
			styles: {},
		} );

		expect( cleaned.$schema ).toBeUndefined();
		expect( cleaned.version ).toBeUndefined();
		expect( cleaned.isGlobalStylesUserThemeJSON ).toBeUndefined();
		expect( cleaned.settings ).toEqual( { color: { custom: false } } );
	} );
} );
