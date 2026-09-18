import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
	loadTokens,
	toLegacyFlat,
	resolveReferences,
	validateTokens,
	flattenSemantic,
	normalizeTokens,
	shortenHex,
	contrastRatio,
	validateContrast,
	buildThemeJson,
	buildCustomMediaAliases,
	buildCustomMediaCss,
	buildCssCustomProperties,
	resolveColorBinding,
	assertClassicBinding,
	buildSemanticPalette,
	buildTailwindTokens,
	buildTailwindConfig,
} from '../tasks/tokens.js';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );
const themeRoot = path.resolve( __dirname, '../..' );

const rawTokens = JSON.parse(
	fs.readFileSync( path.join( themeRoot, 'config', 'tokens.json' ), 'utf8' )
);

// v2 tokens (validated) + the v1-flat view the theme.json target consumes.
const tokens = loadTokens( rawTokens );
const flat = toLegacyFlat( tokens );

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

describe( 'validateTokens — schema v2 (SPEC-017 §4.2)', () => {
	test( 'accepts the shipped v2 tokens', () => {
		expect( validateTokens( rawTokens ) ).toBe( rawTokens );
	} );

	test( 'rejects the v1 flat shape and points at rig:tokens:setup', () => {
		const v1 = {
			colors: { primary: '#000' },
			typography: {},
			spacing: {},
			breakpoints: {},
		};

		expect( () => validateTokens( v1 ) ).toThrow( /rig:tokens:setup/ );
	} );

	test( 'rejects unknown top-level keys', () => {
		const bad = { ...rawTokens, colurs: {} };

		expect( () => validateTokens( bad ) ).toThrow( /Unknown top-level/ );
	} );

	test( 'requires a dark value when darkMode is not "none"', () => {
		const bad = JSON.parse( JSON.stringify( rawTokens ) );
		delete bad.semantic.text.dark;

		expect( () => validateTokens( bad ) ).toThrow( /semantic.text/ );
	} );

	test( 'rejects semantic -> semantic references (tier direction)', () => {
		const bad = JSON.parse( JSON.stringify( rawTokens ) );
		bad.semantic.border.light = '{semantic.text.light}';

		expect( () => validateTokens( bad ) ).toThrow( /tier direction/ );
	} );

	test( 'rejects references inside primitive color leaves', () => {
		const bad = JSON.parse( JSON.stringify( rawTokens ) );
		bad.primitives.color.brand[ '500' ] = '{semantic.text.light}';

		expect( () => validateTokens( bad ) ).toThrow(
			/primitives.color.brand.500/
		);
	} );
} );

describe( 'resolveReferences — {dotted.path} (SPEC-017 §4.3)', () => {
	test( 'resolves primitive references to literals', () => {
		const resolved = resolveReferences( tokens );

		expect( resolved.semantic.text.light ).toBe( '#333' );
		expect( resolved.semantic.surface.light ).toBe( '#fff' );
		expect( resolved.semantic.state.danger.light ).toBe( '#c0392b' );
	} );

	test( 'throws on an unresolved reference', () => {
		const bad = JSON.parse( JSON.stringify( tokens ) );
		bad.semantic.text.light = '{primitives.color.nope.999}';

		expect( () => resolveReferences( bad ) ).toThrow(
			/Unresolved token reference/
		);
	} );

	test( 'throws on a circular reference', () => {
		const bad = JSON.parse( JSON.stringify( tokens ) );
		bad.primitives.color.brand.cycle = '{primitives.color.brand.500}';
		bad.primitives.color.brand[ '500' ] = '{primitives.color.brand.cycle}';

		expect( () => resolveReferences( bad ) ).toThrow( /Circular/ );
	} );
} );

describe( 'toLegacyFlat — v1 view for theme.json/Tailwind parity (§6.2)', () => {
	test( 'maps v2 back to the exact v1 flat shape', () => {
		expect( flat.colors ).toEqual( {
			primary: '#e36d60',
			secondary: '#41848f',
			red: '#c0392b',
			green: '#27ae60',
			blue: '#2980b9',
			yellow: '#f1c40f',
			black: '#1c2833',
			grey: '#95a5a6',
			white: '#ecf0f1',
			text: '#333',
			background: '#fff',
		} );
		expect( flat.spacing ).toEqual( {
			'content-width': '45rem',
			'wide-width': '64rem',
			base: '1rem',
		} );
		expect( flat.breakpoints ).toEqual( {
			mobile: '480px',
			tablet: '782px',
		} );
		expect( flat.typography.lineHeight ).toBe( '1.4' );
		expect( flat.typography.fontSizes.base ).toBe( '1rem' );
	} );
} );

describe( 'buildThemeJson — theme.json v3/7.1 consolidation (propagateTokens core)', () => {
	test( 'upgrades an existing theme.json to v3/7.1 and sources viewport/palette/layout from tokens', () => {
		const themeJson = buildThemeJson( flat, existingV2ThemeJson );

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
			flat.spacing[ 'content-width' ]
		);
		expect( themeJson.settings.layout.wideSize ).toBe(
			flat.spacing[ 'wide-width' ]
		);

		// Palette and typography come from tokens.
		const primary = themeJson.settings.color.palette.find(
			( entry ) => entry.slug === 'primary'
		);
		expect( primary ).toEqual( {
			slug: 'primary',
			color: flat.colors.primary,
			name: 'Primary',
		} );
		expect( themeJson.settings.color.palette ).toHaveLength(
			Object.keys( flat.colors ).length
		);
		expect( themeJson.settings.typography.fontFamilies ).toHaveLength(
			Object.keys( flat.typography.fontFamilies ).length
		);
	} );

	test( 'does not clobber hand-authored theme.json sections', () => {
		const themeJson = buildThemeJson( flat, existingV2ThemeJson );

		expect( themeJson.settings.appearanceTools ).toBe( true );
		expect( themeJson.styles.elements.link ).toEqual(
			existingV2ThemeJson.styles.elements.link
		);
	} );

	test( 'creates a fresh v3 theme.json when none exists', () => {
		const themeJson = buildThemeJson( flat, undefined );

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
			flat.spacing[ 'content-width' ]
		);
	} );

	test( 'fresh theme.json ships the G3 link interactive states in styles.elements', () => {
		const themeJson = buildThemeJson( flat, undefined );

		// Body text references a real palette slug (not the legacy 'foreground').
		expect( themeJson.styles.color.text ).toBe(
			'var(--wp--preset--color--text)'
		);

		// Link interactive states use theme CSS vars (single source of truth).
		expect( themeJson.styles.elements.link ).toEqual( {
			color: { text: 'var(--color-link)' },
			':visited': { color: { text: 'var(--color-link-visited)' } },
			':hover': { color: { text: 'var(--color-link-active)' } },
			':focus': { color: { text: 'var(--color-link-active)' } },
			':active': { color: { text: 'var(--color-link-active)' } },
		} );
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

describe( 'shortenHex — satisfies color-hex-length: short', () => {
	test( 'shortens doubled-nibble hex only', () => {
		expect( shortenHex( '#ffffff' ) ).toBe( '#fff' );
		expect( shortenHex( '#333333' ) ).toBe( '#333' );
		expect( shortenHex( '#cccccc' ) ).toBe( '#ccc' );
		expect( shortenHex( '#000000' ) ).toBe( '#000' );
		expect( shortenHex( '#ff8a80' ) ).toBe( '#ff8a80' );
		expect( shortenHex( '45rem' ) ).toBe( '45rem' );
	} );
} );

describe( 'normalizeTokens — v2 output plan (SPEC-017 §4.5)', () => {
	test( 'emits primitives, structure, semantic light and legacy aliases', () => {
		const plan = normalizeTokens( tokens );

		const names = ( list ) => list.map( ( v ) => v.name );
		expect( names( plan.primitives ) ).toContain( '--color-brand-500' );
		expect( names( plan.structure ) ).toContain( '--layout-content' );
		expect( names( plan.structure ) ).toContain( '--breakpoint-tablet' );
		expect( names( plan.semanticLight ) ).toContain( '--color-surface' );
		expect( names( plan.semanticLight ) ).toContain(
			'--color-state-danger'
		);

		const aliases = Object.fromEntries(
			plan.aliases.map( ( v ) => [ v.name, v.value ] )
		);
		expect( aliases[ '--global-font-color' ] ).toBe( 'var(--color-text)' );
		expect( aliases[ '--content-width' ] ).toBe( 'var(--layout-content)' );
		expect( aliases[ '--mobile-breakpoint' ] ).toBe( '782px' );
	} );

	test( 'omits aliases when legacyAliases is false', () => {
		const plan = normalizeTokens( tokens, { legacyAliases: false } );
		expect( plan.aliases ).toHaveLength( 0 );
	} );

	test( 'dark list carries only values that differ from light', () => {
		const plan = normalizeTokens( tokens );
		const dark = Object.fromEntries(
			plan.semanticDark.map( ( v ) => [ v.name, v.value ] )
		);

		expect( dark[ '--color-surface' ] ).toBe( '#121212' );
		expect( dark[ '--color-text' ] ).toBe( '#fff' );
		// accent is identical in light/dark -> omitted from the dark block.
		expect( dark[ '--color-accent' ] ).toBeUndefined();
	} );
} );

describe( 'buildCssCustomProperties — whole-file generated tokens (§7.1)', () => {
	test( 'emits a self-contained generated file with canonical v2 vars', () => {
		const css = buildCssCustomProperties( tokens );

		expect( css ).toContain( 'GENERATED FILE. DO NOT EDIT.' );
		expect( css ).toContain( '_tokens.custom.css' );
		expect( css ).toContain( '--color-brand-500: #e36d60;' );
		expect( css ).toContain( '--color-surface: #fff;' );
		expect( css ).toContain( '--color-text: #333;' );
		expect( css ).toContain( '--layout-content: 45rem;' );
		expect( css ).toContain( '--breakpoint-tablet: 782px;' );
		expect( css ).toContain( '--font-size-base: clamp(' );
	} );

	test( 'emits legacy aliases during the migration', () => {
		const css = buildCssCustomProperties( tokens );

		expect( css ).toContain( '--global-font-color: var(--color-text);' );
		expect( css ).toContain( '--content-width: var(--layout-content);' );
		expect( css ).toContain( '--mobile-breakpoint: 782px;' );
	} );

	test( 'generates the dark block from semantic dark pairs', () => {
		const css = buildCssCustomProperties( tokens );

		expect( css ).toContain( '@media (prefers-color-scheme: dark)' );
		expect( css ).toContain( 'color-scheme: dark;' );
		expect( css ).toContain( '--color-surface: #121212;' );
		expect( css ).toContain( '--color-text: #fff;' );
	} );

	test( 'omits the dark block when meta.darkMode is "none"', () => {
		const noDark = JSON.parse( JSON.stringify( rawTokens ) );
		noDark.meta.darkMode = 'none';
		const css = buildCssCustomProperties( loadTokens( noDark ) );

		expect( css ).not.toContain( '@media (prefers-color-scheme: dark)' );
	} );

	test( 'does not leak hand-authored tokens or the old markers', () => {
		const css = buildCssCustomProperties( tokens );

		expect( css ).not.toContain( '--dropdown-symbol-width' );
		expect( css ).not.toContain( '--color-custom-sun' );
		expect( css ).not.toContain( 'Generated from tokens.json */' );
		expect( css ).not.toContain( 'End of generated tokens' );
	} );

	test( 'is deterministic (same input → identical output)', () => {
		expect( buildCssCustomProperties( tokens ) ).toBe(
			buildCssCustomProperties( tokens )
		);
	} );

	// NOTE: there is intentionally no "matches the committed file" test.
	// `_tokens.generated.css` is a gitignored, config-dependent artifact (its
	// content changes with theme.designTokens.colorBinding / paradigm), so it
	// cannot be a single committed canonical file (see SPEC-017 §6.1).
} );

describe( 'contrastRatio / validateContrast — WCAG gate (SPEC-017 §7.5)', () => {
	test( 'contrastRatio computes WCAG extremes', () => {
		expect( contrastRatio( '#000', '#fff' ) ).toBeCloseTo( 21, 0 );
		expect( contrastRatio( '#fff', '#fff' ) ).toBeCloseTo( 1, 5 );
		expect( contrastRatio( '45rem', '#fff' ) ).toBeNull();
	} );

	test( 'validateContrast returns diagnostics with messages', () => {
		const diagnostics = validateContrast( tokens );

		expect( Array.isArray( diagnostics ) ).toBe( true );
		expect( diagnostics.length ).toBeGreaterThan( 0 );
		for ( const d of diagnostics ) {
			expect( d.message ).toMatch( /contrast .* is below/ );
			expect( [ 'light', 'dark' ] ).toContain( d.theme );
		}
	} );

	test( 'level "off" disables the gate', () => {
		expect( validateContrast( tokens, { level: 'off' } ) ).toEqual( [] );
	} );
} );

describe( 'flattenSemantic — nested groups', () => {
	test( 'flattens state.* to state-* names', () => {
		const pairs = flattenSemantic( tokens.semantic );
		const names = pairs.map( ( [ name ] ) => name );

		expect( names ).toContain( 'state-danger' );
		expect( names ).toContain( 'text' );
		expect( names ).toContain( 'surface-subtle' );
	} );
} );

describe( 'resolveColorBinding / assertClassicBinding — paradigm binding (§5.2–5.3)', () => {
	test( 'auto resolves to independent for classic and universal', () => {
		expect( resolveColorBinding( 'auto', 'classic' ) ).toBe(
			'independent'
		);
		expect( resolveColorBinding( 'auto', 'universal' ) ).toBe(
			'independent'
		);
	} );

	test( 'auto resolves to wp-preset for block-based', () => {
		expect( resolveColorBinding( 'auto', 'block-based' ) ).toBe(
			'wp-preset'
		);
	} );

	test( 'explicit binding wins over auto', () => {
		expect( resolveColorBinding( 'independent', 'block-based' ) ).toBe(
			'independent'
		);
		expect( resolveColorBinding( 'wp-preset', 'classic' ) ).toBe(
			'wp-preset'
		);
	} );

	test( 'classic + wp-preset is rejected (hard rule)', () => {
		expect( () => assertClassicBinding( 'classic', 'wp-preset' ) ).toThrow(
			/wp-preset/
		);
		expect( () =>
			assertClassicBinding( 'universal', 'wp-preset' )
		).not.toThrow();
		expect( () =>
			assertClassicBinding( 'classic', 'independent' )
		).not.toThrow();
	} );
} );

describe( 'wp-preset binding — semantic vars alias WP presets (§5.1)', () => {
	test( 'normalizeTokens emits preset aliases and no dark block', () => {
		const plan = normalizeTokens( tokens, { binding: 'wp-preset' } );

		const light = Object.fromEntries(
			plan.semanticLight.map( ( v ) => [ v.name, v.value ] )
		);
		expect( light[ '--color-surface' ] ).toBe(
			'var(--wp--preset--color--surface)'
		);
		expect( light[ '--color-state-danger' ] ).toBe(
			'var(--wp--preset--color--state-danger)'
		);
		expect( plan.semanticDark ).toHaveLength( 0 );
	} );

	test( 'buildCssCustomProperties emits preset refs and omits the dark media', () => {
		const css = buildCssCustomProperties( tokens, {
			binding: 'wp-preset',
		} );

		expect( css ).toContain(
			'--color-surface: var(--wp--preset--color--surface);'
		);
		expect( css ).not.toContain( '@media (prefers-color-scheme: dark)' );
	} );

	test( 'independent binding (default) never emits preset refs', () => {
		const css = buildCssCustomProperties( tokens );

		expect( css ).not.toContain( '--wp--preset--' );
		expect( css ).toContain( '--color-surface: #fff;' );
	} );

	test( 'buildSemanticPalette produces slug/color/name entries', () => {
		const palette = buildSemanticPalette( tokens );
		const surface = palette.find( ( e ) => e.slug === 'surface' );
		const danger = palette.find( ( e ) => e.slug === 'state-danger' );

		expect( surface ).toEqual( {
			slug: 'surface',
			color: '#fff',
			name: 'Surface',
		} );
		expect( danger.name ).toBe( 'State Danger' );
	} );

	test( 'buildThemeJson appends extraPalette only when provided', () => {
		const withExtra = buildThemeJson( flat, undefined, null, {
			extraPalette: buildSemanticPalette( tokens ),
		} );
		const without = buildThemeJson( flat, undefined );

		const slugs = withExtra.settings.color.palette.map( ( e ) => e.slug );
		expect( slugs ).toContain( 'surface' );
		expect( slugs ).toContain( 'state-danger' );

		const plainSlugs = without.settings.color.palette.map(
			( e ) => e.slug
		);
		expect( plainSlugs ).not.toContain( 'surface' );
		expect( without.settings.color.palette ).toHaveLength(
			Object.keys( flat.colors ).length
		);
	} );

	test( 'palette slugs stay unique when extraPalette collides', () => {
		// `text` exists in both the legacy palette and the semantic roles.
		const themeJson = buildThemeJson( flat, undefined, null, {
			extraPalette: buildSemanticPalette( tokens ),
		} );
		const slugs = themeJson.settings.color.palette.map( ( e ) => e.slug );

		expect( new Set( slugs ).size ).toBe( slugs.length );
	} );
} );

describe( 'theme.custom overlay + user-styles precedence (§6.2)', () => {
	test( 'theme.custom wins over tokens, user-styles wins over theme.custom', () => {
		const themeCustom = {
			settings: { color: { custom: false } },
			styles: { color: { text: '#010203' } },
		};

		const withCustom = buildThemeJson( flat, undefined, null, {
			themeCustom,
		} );
		expect( withCustom.settings.color.custom ).toBe( false );
		expect( withCustom.styles.color.text ).toBe( '#010203' );

		const overlay = { settings: { color: { custom: true } } };
		const both = buildThemeJson( flat, undefined, overlay, {
			themeCustom,
		} );
		expect( both.settings.color.custom ).toBe( true );
	} );

	test( 'SSOT keys are stripped from the theme.custom overlay', () => {
		const themeCustom = {
			settings: {
				viewport: { mobile: '1px' },
				blockVisibility: { allowEditing: false },
			},
		};

		const themeJson = buildThemeJson( flat, undefined, null, {
			themeCustom,
		} );
		expect( themeJson.settings.viewport.mobile ).toBe( '480px' );
		expect( themeJson.settings.blockVisibility ).toEqual( {
			allowEditing: true,
		} );
	} );

	test( 'absent theme.custom leaves token output unchanged', () => {
		expect( buildThemeJson( flat, undefined ) ).toEqual(
			buildThemeJson( flat, undefined, null, { themeCustom: null } )
		);
	} );

	test( 'theme.custom makes generation independent of the previous theme.json', () => {
		// A stale generated theme.json must not leak into the new output when an
		// explicit theme.custom.json exists (reproducible, pure generation).
		const stale = {
			version: 2,
			settings: {
				color: {
					palette: [
						{ slug: 'stale', color: '#000', name: 'Stale' },
					],
					custom: true,
				},
			},
		};

		const themeJson = buildThemeJson( flat, stale, null, {
			themeCustom: {},
		} );
		const slugs = themeJson.settings.color.palette.map(
			( entry ) => entry.slug
		);

		expect( slugs ).not.toContain( 'stale' );
		expect( themeJson.settings.color.custom ).toBeUndefined();
	} );
} );

describe( 'Tailwind split — generated tokens + stable shell (§6.3)', () => {
	test( 'buildTailwindTokens emits a generated module with the token values', () => {
		const source = buildTailwindTokens( flat );

		expect( source ).toContain( 'GENERATED FILE. DO NOT EDIT.' );
		expect( source ).toContain( 'tailwind.custom.js' );
		expect( source ).toContain( '"primary": "#e36d60"' );
		expect( source ).toContain( 'export default' );
	} );

	test( 'buildTailwindConfig emits a shell importing tokens + custom', () => {
		const source = buildTailwindConfig();

		expect( source ).toContain(
			"import tokens from './config/tailwind.tokens.js';"
		);
		expect( source ).toContain(
			"import custom from './config/tailwind.custom.js';"
		);
		expect( source ).toContain( 'tokens.colors' );
	} );
} );
