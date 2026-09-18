import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exportDtcg, importDtcg } from '../lib/dtcg.js';
import { loadTokens, resolveReferences } from '../tasks/tokens.js';

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

describe( 'exportDtcg', () => {
	test( 'emits DTCG leaves with $type/$value', () => {
		const dtcg = exportDtcg( tokens );

		expect( dtcg.primitives.color.brand[ '500' ] ).toEqual( {
			$type: 'color',
			$value: '#e36d60',
		} );
		expect( dtcg.primitives.layout.content.$type ).toBe( 'dimension' );
		expect( dtcg.primitives.font.family.base.$type ).toBe( 'fontFamily' );
		expect( dtcg.primitives.hue.accent.$type ).toBe( 'number' );
	} );

	test( 'carries the dark value in $extensions', () => {
		const dtcg = exportDtcg( tokens );

		expect( dtcg.semantic.surface.$value ).toBe( '#fff' );
		expect( dtcg.semantic.surface.$extensions[ 'com.wprig.dark' ] ).toBe(
			'#121212'
		);
	} );

	test( 'nests grouped semantic tokens', () => {
		const dtcg = exportDtcg( tokens );

		expect( dtcg.semantic.state.danger.$type ).toBe( 'color' );
	} );
} );

describe( 'importDtcg — round trip', () => {
	test( 'export -> import reproduces primitives and semantic', () => {
		const resolved = resolveReferences( tokens );
		const { primitives, semantic, unmapped } = importDtcg(
			exportDtcg( tokens )
		);

		expect( unmapped ).toEqual( [] );
		expect( primitives ).toEqual( resolved.primitives );
		expect( semantic ).toEqual( resolved.semantic );
	} );

	test( 'maps a generic color tree into primitives.color', () => {
		const { primitives, unmapped } = importDtcg( {
			brand: { 500: { $type: 'color', $value: '#123456' } },
		} );

		expect( primitives.color.brand[ '500' ] ).toBe( '#123456' );
		expect( unmapped ).toEqual( [] );
	} );

	test( 'reports unmapped tokens', () => {
		const { unmapped } = importDtcg( {
			primitives: {
				border: {
					radius: { $type: 'dimension', $value: '4px' },
				},
			},
		} );

		expect( unmapped ).toContain( 'border.radius' );
	} );

	test( 'defaults dark to light when no extension is present', () => {
		const { semantic } = importDtcg( {
			semantic: { accent: { $type: 'color', $value: '#abcdef' } },
		} );

		expect( semantic.accent ).toEqual( {
			light: '#abcdef',
			dark: '#abcdef',
		} );
	} );
} );
