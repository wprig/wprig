import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
	parseDeclaredCustomProperties,
	buildTokenInventory,
	loadTokenInventory,
} from '../lib/token-inventory.js';
import { loadTokens } from '../tasks/tokens.js';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );
const themeRoot = path.resolve( __dirname, '../..' );

const tokens = loadTokens(
	JSON.parse(
		fs.readFileSync(
			path.join( themeRoot, 'config', 'tokens.json' ),
			'utf8'
		)
	)
);

describe( 'parseDeclaredCustomProperties', () => {
	test( 'extracts declared names, ignoring reads', () => {
		const names = parseDeclaredCustomProperties(
			':root { --color-x: #000; }\n.a { color: var(--color-y); }'
		);

		expect( names.has( '--color-x' ) ).toBe( true );
		expect( names.has( '--color-y' ) ).toBe( false );
	} );

	test( 'handles multiple declarations', () => {
		const names = parseDeclaredCustomProperties(
			'--a: 1; --b: 2; --c-d: 3;'
		);

		expect( [ ...names ].sort() ).toEqual( [ '--a', '--b', '--c-d' ] );
	} );
} );

describe( 'buildTokenInventory', () => {
	test( 'includes canonical, structural, semantic and alias names', () => {
		const inventory = buildTokenInventory( tokens );

		expect( inventory.count ).toBeGreaterThan( 40 );
		expect( inventory.names ).toContain( '--color-surface' );
		expect( inventory.names ).toContain( '--color-state-danger' );
		expect( inventory.names ).toContain( '--layout-content' );
		expect( inventory.names ).toContain( '--breakpoint-tablet' );
		// Legacy alias emitted during migration.
		expect( inventory.names ).toContain( '--global-font-color' );
	} );

	test( 'maps names to values and is sorted', () => {
		const inventory = buildTokenInventory( tokens );

		expect( inventory.values[ '--color-surface' ] ).toBe( '#fff' );
		expect( [ ...inventory.names ] ).toEqual(
			[ ...inventory.names ].sort()
		);
	} );

	test( 'omits aliases when legacyAliases is false', () => {
		const inventory = buildTokenInventory( tokens, {
			legacyAliases: false,
		} );

		expect( inventory.names ).not.toContain( '--global-font-color' );
		expect( inventory.names ).toContain( '--color-surface' );
	} );
} );

describe( 'loadTokenInventory — includes hand-authored names', () => {
	test( 'adds names declared in _tokens.custom.css', () => {
		const inventory = loadTokenInventory( themeRoot );

		expect( inventory.names ).toContain( '--dropdown-symbol-width' );
		expect( inventory.names ).toContain( '--color-surface' );
	} );
} );
