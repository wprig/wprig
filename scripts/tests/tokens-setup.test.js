import {
	detectSchemaVersion,
	upgradeV1ToV2,
	buildRenameMap,
	rewriteVarReferences,
	planCodemod,
} from '../tasks/tokensSetup.js';
import { loadTokens } from '../tasks/tokens.js';

const v1Fixture = {
	colors: {
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
	},
	typography: {
		fontFamilies: {
			base: 'Arial, sans-serif',
			highlight: 'Georgia, serif',
		},
		fluid: { enabled: true, minViewport: '320px' },
		fontSizes: { base: '1rem', large: '1.8rem' },
		lineHeight: '1.4',
	},
	spacing: { 'content-width': '45rem', 'wide-width': '64rem', base: '1rem' },
	breakpoints: { mobile: '480px', tablet: '782px' },
};

describe( 'detectSchemaVersion', () => {
	test( 'detects v2 (meta.version 2 or primitives)', () => {
		expect( detectSchemaVersion( { meta: { version: 2 } } ) ).toBe( 2 );
		expect( detectSchemaVersion( { primitives: {} } ) ).toBe( 2 );
	} );

	test( 'detects v1 (flat keys)', () => {
		expect( detectSchemaVersion( v1Fixture ) ).toBe( 1 );
		expect( detectSchemaVersion( { colors: {} } ) ).toBe( 1 );
	} );

	test( 'returns 0 for absent/invalid input', () => {
		expect( detectSchemaVersion( null ) ).toBe( 0 );
		expect( detectSchemaVersion( {} ) ).toBe( 0 );
		expect( detectSchemaVersion( [] ) ).toBe( 0 );
	} );
} );

describe( 'upgradeV1ToV2 — schema migration (§8.2)', () => {
	test( 'produces v2 tokens that pass validation', () => {
		const upgraded = upgradeV1ToV2( v1Fixture );

		expect( () => loadTokens( upgraded ) ).not.toThrow();
		expect( upgraded.meta.version ).toBe( 2 );
		expect( upgraded.meta.darkMode ).toBe( 'none' );
	} );

	test( 'maps flat colors into the primitive ramps', () => {
		const upgraded = upgradeV1ToV2( v1Fixture );

		expect( upgraded.primitives.color.brand[ '500' ] ).toBe( '#e36d60' );
		expect( upgraded.primitives.color.accent[ '500' ] ).toBe( '#41848f' );
		expect( upgraded.primitives.color.neutral[ '0' ] ).toBe( '#fff' );
		expect( upgraded.primitives.color.neutral[ '900' ] ).toBe( '#1c2833' );
	} );

	test( 'maps layout/space/font/breakpoints and fluid', () => {
		const upgraded = upgradeV1ToV2( v1Fixture );

		expect( upgraded.primitives.layout ).toEqual( {
			content: '45rem',
			wide: '64rem',
		} );
		expect( upgraded.primitives.space.base ).toBe( '1rem' );
		expect( upgraded.primitives.font.leading.base ).toBe( '1.4' );
		expect( upgraded.primitives.breakpoint.tablet ).toBe( '782px' );
		expect( upgraded.meta.fluid ).toEqual( {
			enabled: true,
			minViewport: '320px',
		} );
	} );

	test( 'builds semantic surface/text pairs mirroring light', () => {
		const upgraded = upgradeV1ToV2( v1Fixture );

		expect( upgraded.semantic.surface ).toEqual( {
			light: '#fff',
			dark: '#fff',
		} );
		expect( upgraded.semantic.text ).toEqual( {
			light: '#333',
			dark: '#333',
		} );
	} );

	test( 'omits undefined colors rather than emitting null leaves', () => {
		const upgraded = upgradeV1ToV2( {
			colors: { primary: '#000', text: '#111', background: '#fff' },
		} );

		expect( upgraded.primitives.color.brand[ '500' ] ).toBe( '#000' );
		expect( upgraded.primitives.color.red ).toBeUndefined();
		expect( () => loadTokens( upgraded ) ).not.toThrow();
	} );
} );

describe( 'buildRenameMap', () => {
	test( 'maps the collapse targets and the breakpoint misnomer', () => {
		const map = buildRenameMap();

		expect( map[ '--content-width' ] ).toBe( '--layout-content' );
		expect( map[ '--spacing-content-width' ] ).toBe( '--layout-content' );
		expect( map[ '--global-font-color' ] ).toBe( '--color-text' );
		expect( map[ '--color-theme-primary' ] ).toBe( '--color-accent' );
		expect( map[ '--mobile-breakpoint' ] ).toBe( '--breakpoint-tablet' );
	} );
} );

describe( 'rewriteVarReferences — collapse-aware codemod (§8.3)', () => {
	const map = buildRenameMap();

	test( 'rewrites var() reads', () => {
		const { content } = rewriteVarReferences(
			'.a { width: var(--content-width); }',
			map
		);
		expect( content ).toBe( '.a { width: var(--layout-content); }' );
	} );

	test( 'rewrites var() reads with fallbacks', () => {
		const { content } = rewriteVarReferences(
			'.a { color: var(--global-font-color, #000); }',
			map
		);
		expect( content ).toBe( '.a { color: var(--color-text, #000); }' );
	} );

	test( 'rewrites declarations, @custom-media and JS string literals', () => {
		const { content } = rewriteVarReferences(
			[
				':root { --mobile-breakpoint: 782px; }',
				'@custom-media --mobile-breakpoint (max-width: 782px);',
				"const x = getComputedStyle( el ).getPropertyValue( '--mobile-breakpoint' );",
			].join( '\n' ),
			map
		);
		expect( content ).not.toContain( '--mobile-breakpoint' );
		expect( content ).toContain( '--breakpoint-tablet: 782px;' );
		expect( content ).toContain(
			'@custom-media --breakpoint-tablet (max-width: 782px);'
		);
		expect( content ).toContain( "'--breakpoint-tablet'" );
	} );

	test( 'collapses N:1 duplicates to a single canonical name', () => {
		const { content } = rewriteVarReferences(
			'--content-width: 45rem; --spacing-content-width: 45rem;',
			map
		);
		expect( content ).toBe(
			'--layout-content: 45rem; --layout-content: 45rem;'
		);
	} );

	test( 'does not partially match longer names', () => {
		const { content } = rewriteVarReferences(
			'--color-red-500: #c0392b; --color-red: #c0392b;',
			map
		);
		expect( content ).toBe(
			'--color-red-500: #c0392b; --color-red-500: #c0392b;'
		);
	} );

	test( 'leaves canonical names untouched', () => {
		const { content, replacements } = rewriteVarReferences(
			'--color-text: #333; var(--color-surface);',
			map
		);
		expect( content ).toBe( '--color-text: #333; var(--color-surface);' );
		expect( replacements ).toEqual( {} );
	} );
} );

describe( 'planCodemod — dry-run planning', () => {
	test( 'reports the plan shape without writing', async () => {
		const plan = await planCodemod();

		expect( Array.isArray( plan.files ) ).toBe( true );
		expect( typeof plan.totalReplacements ).toBe( 'number' );

		for ( const entry of plan.files ) {
			expect( typeof entry.file ).toBe( 'string' );
			expect( entry.count ).toBeGreaterThan( 0 );
		}
	} );

	test( 'is idempotent: the migrated tree has no legacy references left', async () => {
		// The framework source was migrated by `rig:tokens:setup --apply`, so a
		// fresh plan should find nothing to rewrite.
		const plan = await planCodemod();

		expect( plan.totalReplacements ).toBe( 0 );
		expect( plan.files ).toEqual( [] );
	} );
} );
