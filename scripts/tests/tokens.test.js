import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildThemeJson } from '../tasks/tokens.js';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );
const themeRoot = path.resolve( __dirname, '../..' );

const tokens = JSON.parse(
	fs.readFileSync( path.join( themeRoot, 'config', 'tokens.json' ), 'utf8' )
);

const existingV2ThemeJson = {
	$schema: 'https://schemas.wp.org/wp/6.4/theme.json',
	version: 2,
	settings: {
		appearanceTools: true,
		layout: {
			contentSize: '800px',
			wideSize: '1200px',
		},
		color: {
			palette: [],
		},
		typography: {
			fontFamilies: [],
			fontSizes: [],
		},
	},
	styles: {
		elements: {
			link: {
				color: {
					text: 'var(--wp--preset--color--primary)',
				},
			},
		},
	},
};

describe( 'buildThemeJson — theme.json v3/7.1 consolidation (propagateTokens core)', () => {
	test( 'upgrades an existing theme.json to v3/7.1 and sources viewport/palette/layout from tokens', () => {
		const themeJson = buildThemeJson( tokens, existingV2ThemeJson );

		expect( themeJson.version ).toBe( 3 );
		expect( themeJson.$schema ).toBe(
			'https://schemas.wp.org/wp/7.1/theme.json'
		);
		expect( themeJson.settings.viewport ).toEqual( {
			mobile: '480px',
			tablet: '782px',
		} );
		expect( themeJson.settings.blockVisibility ).toEqual( {
			allowEditing: true,
		} );

		// Layout derives from tokens.spacing (resolves the 800px-vs-45rem drift).
		expect( themeJson.settings.layout.contentSize ).toBe(
			tokens.spacing[ 'content-width' ]
		);
		expect( themeJson.settings.layout.wideSize ).toBe(
			tokens.spacing[ 'wide-width' ]
		);

		// Palette and typography come from tokens.
		const primary = themeJson.settings.color.palette.find(
			( entry ) => entry.slug === 'primary'
		);
		expect( primary ).toEqual( {
			slug: 'primary',
			color: tokens.colors.primary,
			name: 'Primary',
		} );
		expect( themeJson.settings.color.palette ).toHaveLength(
			Object.keys( tokens.colors ).length
		);
		expect( themeJson.settings.typography.fontFamilies ).toHaveLength(
			Object.keys( tokens.typography.fontFamilies ).length
		);
	} );

	test( 'does not clobber hand-authored theme.json sections', () => {
		const themeJson = buildThemeJson( tokens, existingV2ThemeJson );

		expect( themeJson.settings.appearanceTools ).toBe( true );
		expect( themeJson.styles.elements.link ).toEqual(
			existingV2ThemeJson.styles.elements.link
		);
	} );

	test( 'creates a fresh v3 theme.json when none exists', () => {
		const themeJson = buildThemeJson( tokens, undefined );

		expect( themeJson.version ).toBe( 3 );
		expect( themeJson.$schema ).toBe(
			'https://schemas.wp.org/wp/7.1/theme.json'
		);
		expect( themeJson.settings.viewport.mobile ).toBe( '480px' );
		expect( themeJson.settings.viewport.tablet ).toBe( '782px' );
		expect( themeJson.settings.blockVisibility ).toEqual( {
			allowEditing: true,
		} );
		expect( themeJson.settings.layout.contentSize ).toBe(
			tokens.spacing[ 'content-width' ]
		);
	} );
} );
