/* eslint-env es6 */

/**
 * Tests for the paradigm bake-and-strip transform (SPEC-014).
 *
 * The baked PHP stub must stay in lockstep with the JS resolver
 * (scripts/lib/paradigm.js) and config/paradigms.json — the matrix assertions
 * below are deliberately identical to scripts/tests/paradigm.test.js so the
 * two sides can never silently diverge.
 */

/**
 * External dependencies
 */
import { execFileSync } from 'child_process';

/**
 * Internal dependencies
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
	extractParadigmTag,
	shouldIncludeComponent,
	bakeParadigmClass,
	bakeProdPhp,
	toPhpArray,
} from '../lib/bakeParadigm.js';
const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );
const themeRoot = path.resolve( __dirname, '..', '..' );

const DEFINITIONS = JSON.parse(
	fs.readFileSync(
		path.join( themeRoot, 'config', 'paradigms.json' ),
		'utf-8'
	)
);

const THEME_TYPES = Object.keys( DEFINITIONS.themeTypes );
const TAGS = Object.keys( DEFINITIONS.tags );

describe( 'toPhpArray', () => {
	test( 'emits a PHP array literal for the matrix shape', () => {
		const php = toPhpArray( { a: [ 'x', 'y' ] } );
		expect( php ).toBe(
			"array(\n\t\t'a' => array(\n\t\t\t'x',\n\t\t\t'y',\n\t),\n)"
		);
	} );

	test( 'escapes single quotes and backslashes in keys and values', () => {
		expect( toPhpArray( { "it's": "o'clock" } ) ).toBe(
			"array(\n\t\t'it\\'s' => 'o\\'clock',\n)"
		);
	} );

	test( 'handles empty arrays and scalars', () => {
		expect( toPhpArray( [] ) ).toBe( 'array()' );
		expect( toPhpArray( {} ) ).toBe( 'array()' );
		expect( toPhpArray( 'classic' ) ).toBe( "'classic'" );
	} );
} );

describe( 'extractParadigmTag', () => {
	test( 'parses a declared const PARADIGM', () => {
		expect(
			extractParadigmTag( "<?php const PARADIGM = 'classic';" )
		).toBe( 'classic' );
		expect(
			extractParadigmTag( `<?php
class Component {
	use Paradigm_Component_Trait;
	const PARADIGM = "block-based";
}` )
		).toBe( 'block-based' );
	} );

	test( "defaults to 'all' when no tag is declared", () => {
		expect( extractParadigmTag( '<?php class Component {}' ) ).toBe(
			'all'
		);
		expect( extractParadigmTag( '' ) ).toBe( 'all' );
	} );

	test( 'fails fast on an unknown tag value', () => {
		expect( () =>
			extractParadigmTag( "<?php const PARADIGM = 'bogus';" )
		).toThrow( /Unknown paradigm tag "bogus"/ );
	} );
} );

describe( 'shouldIncludeComponent', () => {
	test( 'mirrors the config/paradigms.json matrix for every theme type and tag', () => {
		for ( const themeType of THEME_TYPES ) {
			for ( const tag of TAGS ) {
				expect(
					shouldIncludeComponent( tag, themeType, DEFINITIONS )
				).toBe( DEFINITIONS.tags[ tag ].includes( themeType ) );
			}
		}
	} );

	test( "the 'all' tag ships for every theme type", () => {
		for ( const themeType of THEME_TYPES ) {
			expect(
				shouldIncludeComponent( 'all', themeType, DEFINITIONS )
			).toBe( true );
		}
	} );

	test( 'fails fast on an unknown tag', () => {
		expect( () =>
			shouldIncludeComponent( 'bogus', 'classic', DEFINITIONS )
		).toThrow( /Unknown paradigm tag "bogus"/ );
	} );
} );

describe( 'bakeParadigmClass', () => {
	const phpAvailable = ( () => {
		try {
			execFileSync( 'php', [ '-v' ], { stdio: 'ignore' } );
			return true;
		} catch {
			return false;
		}
	} )();

	const lint = ( phpSource, label ) => {
		if ( ! phpAvailable ) {
			return;
		}
		const tmp = path.join( themeRoot, 'scripts', 'tests', '.bake-tmp.php' );
		fs.writeFileSync( tmp, phpSource );
		try {
			execFileSync( 'php', [ '-l', tmp ], { stdio: 'pipe' } );
		} catch ( err ) {
			throw new Error(
				`Baked PHP failed lint (${ label }):\n${ err.stderr }`
			);
		} finally {
			fs.unlinkSync( tmp );
		}
	};

	for ( const themeType of THEME_TYPES ) {
		test( `bakes valid PHP for themeType "${ themeType }"`, () => {
			const baked = bakeParadigmClass( themeType, DEFINITIONS );

			expect( baked ).toContain( `'${ themeType }'` );
			// No runtime config machinery may survive the bake.
			expect( baked ).not.toContain( 'file_get_contents' );
			expect( baked ).not.toContain( 'paradigms.json' );
			expect( baked ).not.toContain( 'get_config' );
			expect( baked ).not.toContain( 'get_theme_file_path' );
			// Public API preserved for child themes.
			expect( baked ).toContain( 'function get_definitions()' );
			expect( baked ).toContain( 'function get_active_theme_type()' );
			expect( baked ).toContain( 'function is_enabled(' );

			lint( baked, themeType );
		} );
	}

	test( 'baked is_enabled() resolves true/false per the matrix at runtime', () => {
		// Execute the baked stub for each theme type and exercise is_enabled().
		if ( ! phpAvailable ) {
			return;
		}
		for ( const themeType of THEME_TYPES ) {
			const baked = bakeParadigmClass( themeType, DEFINITIONS );
			const script = `${ baked }
foreach ( Paradigm::get_definitions()['tags'] as $tag => $types ) {
	var_dump( Paradigm::is_enabled( $tag ) );
}
var_dump( Paradigm::get_active_theme_type() );`;
			const tmp = path.join(
				themeRoot,
				'scripts',
				'tests',
				'.bake-run.php'
			);
			fs.writeFileSync( tmp, script );
			try {
				const stdout = execFileSync( 'php', [ tmp ] ).toString();
				const bools = [
					...stdout.matchAll( /bool\((true|false)\)/g ),
				].map( ( m ) => m[ 1 ] === 'true' );
				const expected = TAGS.map( ( tag ) =>
					DEFINITIONS.tags[ tag ].includes( themeType )
				);
				expect( bools.slice( 0, TAGS.length ) ).toEqual( expected );
				expect( stdout ).toMatch(
					new RegExp( `string\\(\\d+\\) "${ themeType }"` )
				);
			} finally {
				fs.unlinkSync( tmp );
			}
		}
	} );

	test( 'baked definitions match config/paradigms.json exactly', () => {
		if ( ! phpAvailable ) {
			return;
		}
		const baked = bakeParadigmClass( 'classic', DEFINITIONS );
		const script = `${ baked }
var_dump( Paradigm::get_definitions() === json_decode( file_get_contents( __DIR__ . '/fixtures-paradigms.json' ), true ) );`;
		const tmp = path.join( themeRoot, 'scripts', 'tests', '.bake-run.php' );
		fs.writeFileSync(
			path.join(
				themeRoot,
				'scripts',
				'tests',
				'fixtures-paradigms.json'
			),
			JSON.stringify( DEFINITIONS )
		);
		fs.writeFileSync( tmp, script );
		try {
			const stdout = execFileSync( 'php', [ tmp ] ).toString();
			expect( stdout ).toContain( 'bool(true)' );
		} finally {
			fs.unlinkSync( tmp );
			fs.unlinkSync(
				path.join(
					themeRoot,
					'scripts',
					'tests',
					'fixtures-paradigms.json'
				)
			);
		}
	} );
} );

describe( 'bakeProdPhp dispatcher', () => {
	const activeThemeType = 'classic'; // repo default
	const ctx = {
		activeThemeType,
		definitions: DEFINITIONS,
		isComponentPath: ( rel ) => /^inc\/[^/]+\//.test( rel ),
		componentTag: ( rel ) => {
			const dir = rel.match( /^inc\/([^/]+)\// )[ 1 ];
			return (
				{
					Sidebars: 'classic',
					Block_Patterns: 'block-based',
				}[ dir ] ?? 'all'
			);
		},
	};

	test( 'skips gated-out component files', () => {
		// classic themeType: block-based components do not ship.
		expect(
			bakeProdPhp( 'inc/Block_Patterns/Component.php', '...', ctx ).skip
		).toBe( true );
		expect(
			bakeProdPhp( 'inc/Block_Patterns/patterns/hero.php', '...', ctx )
				.skip
		).toBe( true );
	} );

	test( 'keeps gated-in component files untransformed', () => {
		const result = bakeProdPhp(
			'inc/Sidebars/Component.php',
			'<?php // sidebar component',
			ctx
		);
		expect( result.skip ).toBeUndefined();
		expect( result.content ).toBe( '<?php // sidebar component' );
	} );

	test( 'replaces inc/Paradigm.php with the baked stub', () => {
		const result = bakeProdPhp(
			'inc/Paradigm.php',
			'<?php // original resolver',
			ctx
		);
		expect( result.skip ).toBeUndefined();
		expect( result.content ).toContain( 'BAKED AT BUILD TIME' );
		expect( result.content ).toContain( "'classic'" );
		expect( result.content ).not.toContain( 'file_get_contents' );
	} );

	test( 'returns non-component files untouched', () => {
		const files = [
			'inc/Theme.php',
			'inc/Paradigm_Component_Trait.php',
			'inc/Classic_Component_Trait.php',
			'functions.php',
			'sidebar.php',
			'style.css',
		];
		for ( const rel of files ) {
			const result = bakeProdPhp( rel, 'ORIGINAL', ctx );
			expect( result.skip ).toBeUndefined();
			expect( result.content ).toBe( 'ORIGINAL' );
		}
	} );

	test( 'handles backslash path separators (Windows)', () => {
		expect(
			bakeProdPhp( 'inc\\Block_Patterns\\Component.php', '...', {
				...ctx,
				componentTag: () => 'block-based',
			} ).skip
		).toBe( true );
	} );
} );
