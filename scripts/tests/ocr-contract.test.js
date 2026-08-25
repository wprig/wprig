/* eslint-env es6 */
/* global describe, test, expect, beforeEach, afterEach */

import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { normalizeAssetEntries } from '../lib/rig-utils.js';
import testComponent from '../tasks/testComponent.js';

/**
 * Builds a temporary theme root with a gated block-based component fixture.
 *
 * @param {Object}  overrides Overrides for the manifest / Component.php.
 * @param {boolean} valid     Build a fully valid fixture (true) or break it.
 * @return {Promise<{tmp: string, slug: string, manifestPath: string}>}
 */
async function buildFixture( overrides = {}, valid = true ) {
	const tmp = await fs.mkdtemp( path.join( os.tmpdir(), 'wprig-ocr-' ) );
	const slug = 'Probe_Component';
	const dir = path.join( tmp, 'inc', slug );
	await fs.ensureDir( dir );
	await fs.ensureDir( path.join( tmp, 'assets', 'css', 'src' ) );
	await fs.ensureDir( path.join( tmp, 'assets', 'js', 'src' ) );

	await fs.writeFile( path.join( dir, 'Component.php' ), `<?php
namespace WP_Rig\\WP_Rig\\Probe_Component;

use WP_Rig\\WP_Rig\\Component_Interface;
use WP_Rig\\WP_Rig\\Paradigm_Component_Trait;

class Component implements Component_Interface {
	use Paradigm_Component_Trait;

	const PARADIGM = 'block-based';

	public function get_slug(): string {
		return 'probe-component';
	}
}
` );
	await fs.writeFile( path.join( dir, 'SPEC.md' ), '# SPEC\n' );
	await fs.writeFile( path.join( dir, 'SKILL.md' ), '# SKILL\n' );
	await fs.writeFile( path.join( tmp, 'assets', 'css', 'src', 'probe-component.css' ), '/* ok */\n' );
	await fs.writeFile( path.join( tmp, 'assets', 'js', 'src', 'probe-component.ts' ), 'export {};\n' );

	const manifest = {
		slug: 'probe-component',
		version: '1.0.0',
		title: 'Probe Component',
		description: 'Probe.',
		paradigm: 'block-based',
		php_class_mapping: 'Probe_Component',
		asset_mapping: {
			styles: [
				{
					src: 'assets/css/src/probe-component.css',
					target: 'assets/css/src/probe-component.css',
					scoped: true,
				},
			],
			scripts: [
				{
					src: 'assets/js/src/probe-component.ts',
					target: 'assets/js/src/probe-component.ts',
					scoped: true,
				},
			],
		},
	};
	if ( ! valid ) {
		Object.assign( manifest, overrides.manifest || {} );
	}
	if ( valid ) {
		Object.assign( manifest, overrides.manifest || {} );
	}

	await fs.writeFile(
		path.join( dir, 'manifest.json' ),
		JSON.stringify( manifest, null, 2 )
	);

	return { tmp, slug, manifestPath: path.join( dir, 'manifest.json' ) };
}

describe( 'OCR component build contract (SPEC-009)', () => {
	describe( 'normalizeAssetEntries', () => {
		test( 'flattens an array of entries', () => {
			expect(
				normalizeAssetEntries( [
					{ src: 'a.css', scoped: true },
					{ src: 'b.css' },
				] )
			).toHaveLength( 2 );
		} );

		test( 'wraps a single entry object', () => {
			expect( normalizeAssetEntries( { src: 'a.css' } ) ).toEqual( [
				{ src: 'a.css' },
			] );
		} );

		test( 'returns [] for missing/invalid values', () => {
			expect( normalizeAssetEntries( undefined ) ).toEqual( [] );
			expect( normalizeAssetEntries( null ) ).toEqual( [] );
			expect( normalizeAssetEntries( 'nope' ) ).toEqual( [] );
		} );
	} );

	describe( 'testComponent (paradigm validation)', () => {
		test( 'passes a valid gated block-based component', async () => {
			const { tmp, slug } = await buildFixture();
			try {
				const ok = await testComponent( tmp, slug );
				expect( ok ).toBe( true );
			} finally {
				await fs.remove( tmp );
			}
		} );

		test( 'fails when manifest.paradigm is missing', async () => {
			const { tmp, slug } = await buildFixture(
				{ manifest: { paradigm: undefined } },
				true
			);
			// Force the field out entirely.
			const manifestPath = path.join(
				tmp,
				'inc',
				slug,
				'manifest.json'
			);
			const manifest = JSON.parse(
				await fs.readFile( manifestPath, 'utf8' )
			);
			delete manifest.paradigm;
			await fs.writeFile( manifestPath, JSON.stringify( manifest ) );
			try {
				const ok = await testComponent( tmp, slug );
				expect( ok ).toBe( false );
			} finally {
				await fs.remove( tmp );
			}
		} );

		test( 'fails when the PARADIGM const does not match manifest.paradigm', async () => {
			const { tmp, slug } = await buildFixture();
			const phpPath = path.join( tmp, 'inc', slug, 'Component.php' );
			const php = await fs.readFile( phpPath, 'utf8' );
			await fs.writeFile(
				phpPath,
				php.replace(
					"const PARADIGM = 'block-based';",
					"const PARADIGM = 'classic';"
				)
			);
			try {
				const ok = await testComponent( tmp, slug );
				expect( ok ).toBe( false );
			} finally {
				await fs.remove( tmp );
			}
		} );

		test( 'fails when a gated component omits Paradigm_Component_Trait', async () => {
			const { tmp, slug } = await buildFixture();
			const phpPath = path.join( tmp, 'inc', slug, 'Component.php' );
			const php = await fs.readFile( phpPath, 'utf8' );
			await fs.writeFile(
				phpPath,
				php
					.replace( /\n\tuse Paradigm_Component_Trait;/g, '' )
					.replace(
						/use WP_Rig\\WP_Rig\\Paradigm_Component_Trait;\n/,
						''
					)
			);
			try {
				const ok = await testComponent( tmp, slug );
				expect( ok ).toBe( false );
			} finally {
				await fs.remove( tmp );
			}
		} );
	} );
} );
