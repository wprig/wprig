import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
	buildThemeJson,
	buildCustomMediaAliases,
	buildCustomMediaCss,
} from '../tasks/tokens.js';

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

describe( 'buildCustomMediaAliases — §4 viewport-driven breakpoints', () => {
	test( 'derives the exact §4 alias mapping from the 480/782 viewport defaults', () => {
		const aliases = buildCustomMediaAliases( {
			mobile: '480px',
			tablet: '782px',
		} );

		expect( aliases ).toEqual( [
			[ '--narrow-menu-query', 'screen and (max-width: 480px)' ],
			[ '--wide-menu-query', 'screen and (min-width: 481px)' ],
			[ '--medium-query', 'screen and (min-width: 481px)' ],
			[ '--content-query', 'screen and (min-width: 783px)' ],
			[ '--sidebar-query', 'screen and (min-width: 783px)' ],
			[ '--tablet-menu-query', 'screen and (max-width: 782px)' ],
			[ '--desktop-menu-query', 'screen and (min-width: 783px)' ],
		] );
	} );

	test( 'falls back to 480/782 when breakpoints are missing', () => {
		const aliases = buildCustomMediaAliases( undefined );

		expect( aliases[ 0 ] ).toEqual( [
			'--narrow-menu-query',
			'screen and (max-width: 480px)',
		] );
		expect( aliases[ 5 ] ).toEqual( [
			'--tablet-menu-query',
			'screen and (max-width: 782px)',
		] );
	} );

	test( 'derives min-widths from custom breakpoint values', () => {
		const aliases = buildCustomMediaAliases( {
			mobile: '400px',
			tablet: '768px',
		} );

		expect( aliases[ 1 ] ).toEqual( [
			'--wide-menu-query',
			'screen and (min-width: 401px)',
		] );
		expect( aliases[ 3 ] ).toEqual( [
			'--content-query',
			'screen and (min-width: 769px)',
		] );
	} );

	test( 'buildCustomMediaCss emits the full regenerated file', () => {
		const css = buildCustomMediaCss( {
			mobile: '480px',
			tablet: '782px',
		} );

		expect( css ).toContain( 'Mobile = 480px, tablet = 782px.' );
		expect( css ).toContain(
			'@custom-media --narrow-menu-query screen and (max-width: 480px);'
		);
		expect( css ).toContain(
			'@custom-media --desktop-menu-query screen and (min-width: 783px);'
		);
	} );
} );
