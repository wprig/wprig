import {
	CORE_PALETTE_SLUGS,
	CORE_FONT_SIZE_SLUGS,
	findCorePresetCollisions,
	describeCorePresetCollision,
} from '../lib/core-preset-slugs.js';

describe( 'core-preset-slugs — theme.json core default collision detection', () => {
	test( 'tracks the core default palette + font-size slugs', () => {
		expect( CORE_PALETTE_SLUGS ).toContain( 'black' );
		expect( CORE_PALETTE_SLUGS ).toContain( 'vivid-red' );
		expect( CORE_FONT_SIZE_SLUGS ).toEqual( [
			'small',
			'medium',
			'large',
			'x-large',
			'extra-large',
		] );
	} );

	test( 'returns no collisions for unique slugs', () => {
		const themeJson = {
			settings: {
				color: { palette: [ { slug: 'primary' }, { slug: 'text' } ] },
				typography: {
					fontSizes: [ { slug: 'base' }, { slug: 'xlarge' } ],
				},
			},
		};
		expect( findCorePresetCollisions( themeJson ) ).toEqual( [] );
	} );

	test( 'detects palette + font-size collisions', () => {
		const themeJson = {
			settings: {
				color: {
					palette: [ { slug: 'brand' }, { slug: 'black' } ],
				},
				typography: {
					fontSizes: [ { slug: 'small' }, { slug: 'large' } ],
				},
			},
		};
		expect( findCorePresetCollisions( themeJson ) ).toEqual( [
			{ type: 'color', slug: 'black' },
			{ type: 'fontSize', slug: 'small' },
			{ type: 'fontSize', slug: 'large' },
		] );
	} );

	test( 'tolerates missing settings sections', () => {
		expect( findCorePresetCollisions( {} ) ).toEqual( [] );
		expect( findCorePresetCollisions( undefined ) ).toEqual( [] );
	} );

	test( 'descriptions name the slug, preset type, and opt-out setting', () => {
		const message = describeCorePresetCollision( {
			type: 'fontSize',
			slug: 'small',
		} );
		expect( message ).toContain( '"small"' );
		expect( message ).toContain( 'fontSize' );
		expect( message ).toContain( 'typography.defaultFontSizes' );
	} );
} );
