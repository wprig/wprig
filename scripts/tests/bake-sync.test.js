/**
 * Tests for the rig:bake task (SPEC-015 §5.1 + SPEC-016 §2.2).
 *
 * Paradigm gate tests mock ../lib/paradigm.js so the themeType resolution is
 * controlled per test instead of depending on the repo's config chain.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
// @jest/globals ships with the jest toolchain (devDependency `jest`).
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';

jest.unstable_mockModule( '../lib/paradigm.js', () => ( {
	isFeatureEnabled: jest.fn( () => true ),
	getActiveThemeType: jest.fn( () => 'block-based' ),
	loadParadigms: jest.fn(),
	validateThemeType: jest.fn(),
} ) );

const { bakeSync, runPostBakeLayer } = await import( '../tasks/bakeSync.js' );
const { isFeatureEnabled } = await import( '../lib/paradigm.js' );

function tempDir() {
	return fs.mkdtempSync( path.join( os.tmpdir(), 'rig-bake-' ) );
}

function writeManifest( root, runName, rows ) {
	const runDir = path.join( root, '.wp-theme-control', 'runs', runName );
	fs.mkdirSync( runDir, { recursive: true } );
	const tsv = [
		'kind\trecord_id\tslug\ttarget\tsha256',
		...rows.map( ( row ) => row.join( '\t' ) ),
	].join( '\n' );
	fs.writeFileSync( path.join( runDir, 'manifest.tsv' ), tsv );
}

const PATTERN_TEMPLATE = ( title, slug, categories, body ) =>
	`<?php\n/**\n * Title: ${ title }\n * Slug: ${ slug }\n * Categories: ${ categories }\n * Inserter: yes\n */\n?>\n${ body }`;

describe( 'bakeSync — paradigm gate', () => {
	beforeEach( () => {
		isFeatureEnabled.mockReset();
		isFeatureEnabled.mockReturnValue( true );
	} );

	test( 'refuses with guidance (exit 1) when the gate fails and never spawns', async () => {
		isFeatureEnabled.mockReturnValue( false );
		const spawnFn = jest.fn();

		const code = await bakeSync( 'all', {
			spawnFn,
			root: tempDir(),
		} );

		expect( code ).toBe( 1 );
		expect( spawnFn ).not.toHaveBeenCalled();
	} );

	test( 'proceeds to spawn when the gate passes', async () => {
		const root = tempDir();
		fs.mkdirSync( path.join( root, 'bin', 'wp-theme-control' ), {
			recursive: true,
		} );
		fs.writeFileSync(
			path.join( root, 'bin', 'wp-theme-control', 'index.js' ),
			'#!/usr/bin/env node\n'
		);
		const spawnFn = jest.fn( () => {
			const child = {
				on: ( event, cb ) => {
					if ( event === 'exit' ) {
						setImmediate( () => cb( 0 ) );
					}
				},
			};
			return child;
		} );

		const code = await bakeSync( 'all', {
			spawnFn,
			root,
		} );

		expect( code ).toBe( 0 );
		expect( spawnFn ).toHaveBeenCalledWith(
			process.execPath,
			expect.arrayContaining( [
				path.join( root, 'bin', 'wp-theme-control', 'index.js' ),
				'all',
			] ),
			expect.objectContaining( { cwd: root } )
		);
	} );
} );

describe( 'resolveBakeScope — scope validation', () => {
	test.each( [
		'all',
		'plan',
		'patterns',
		'templates',
		'fonts',
		'styles',
		'clean',
	] )( 'accepts %s', async ( scope ) => {
		const { resolveBakeScope } = await import( '../tasks/bakeSync.js' );
		expect( resolveBakeScope( scope ) ).toBe( scope );
	} );

	test( 'rejects an unknown scope', async () => {
		const { resolveBakeScope } = await import( '../tasks/bakeSync.js' );
		expect( () => resolveBakeScope( 'bogus' ) ).toThrow(
			/Unknown bake scope/
		);
	} );
} );

describe( 'findWpRoot — walk-up detection', () => {
	test( 'finds the nearest ancestor containing wp-settings.php', async () => {
		const { findWpRoot } = await import( '../tasks/bakeSync.js' );
		const root = tempDir();
		const wpRoot = path.join( root, 'wordpress' );
		const deep = path.join( wpRoot, 'wp-content', 'themes', 'my-theme' );
		fs.mkdirSync( deep, { recursive: true } );
		fs.writeFileSync( path.join( wpRoot, 'wp-settings.php' ), '<?php' );

		expect( findWpRoot( deep ) ).toBe( wpRoot );
	} );

	test( 'returns null when no WordPress root exists above', async () => {
		const { findWpRoot } = await import( '../tasks/bakeSync.js' );
		const root = tempDir();
		fs.mkdirSync( path.join( root, 'not-wp', 'deeper' ), {
			recursive: true,
		} );

		expect(
			findWpRoot( path.join( root, 'not-wp', 'deeper' ) )
		).toBeNull();
	} );
} );

describe( 'extractExplicitPath — passthrough --path= wins', () => {
	test( 'extracts an explicit path', async () => {
		const { extractExplicitPath } = await import( '../tasks/bakeSync.js' );
		expect( extractExplicitPath( [ '--dry-run', '--path=/srv/wp' ] ) ).toBe(
			'/srv/wp'
		);
	} );

	test( 'returns null without an explicit path', async () => {
		const { extractExplicitPath } = await import( '../tasks/bakeSync.js' );
		expect( extractExplicitPath( [ '--dry-run' ] ) ).toBeNull();
	} );

	test( 'a bare --path= yields null (falls back to detection)', async () => {
		const { extractExplicitPath } = await import( '../tasks/bakeSync.js' );
		expect( extractExplicitPath( [ '--path=' ] ) ).toBeNull();
	} );
} );

describe( 'parseManifestTargets + injectBakedHeader — post-bake layer', () => {
	test( 'selects only wp_block and runtime_pattern rows', async () => {
		const { parseManifestTargets } = await import( '../tasks/bakeSync.js' );
		const tsv = [
			'kind\trecord_id\tslug\ttarget\tsha256',
			'wp_block\t201\thello\t/themes/t/patterns/hello.php\tabc',
			'runtime_pattern\t101\thidden-template-home\t/themes/t/patterns/hidden-template-home.php\tdef',
			'wp_template\t101\thome\t/themes/t/templates/home.html\tghi',
			'font_asset\t301\tassets/fonts/x\t/themes/t/assets/fonts/x.woff2\tjkl',
		].join( '\n' );

		expect( parseManifestTargets( tsv ) ).toEqual( [
			'/themes/t/patterns/hello.php',
			'/themes/t/patterns/hidden-template-home.php',
		] );
	} );

	test( 'injects the Baked header once into the pattern docblock', async () => {
		const { injectBakedHeader } = await import( '../tasks/bakeSync.js' );
		const content = PATTERN_TEMPLATE(
			'Welcome',
			'theme/welcome',
			'featured',
			'<!-- wp:paragraph --><p>Hi</p><!-- /wp:paragraph -->'
		);

		const once = injectBakedHeader( content );
		expect( once ).toContain( ' * Baked: yes' );
		expect( once.indexOf( 'Baked: yes' ) ).toBeLessThan(
			once.indexOf( 'Title:' )
		);
		expect( once ).toContain( ' * Title: Welcome' );

		// Idempotent.
		expect( injectBakedHeader( once ) ).toBe( once );
	} );

	test( 'leaves files without a PHP docblock unchanged', async () => {
		const { injectBakedHeader } = await import( '../tasks/bakeSync.js' );
		const content = '<!-- wp:paragraph --><p>Hi</p><!-- /wp:paragraph -->';
		expect( injectBakedHeader( content ) ).toBe( content );
	} );

	test( 'runPostBakeLayer marks every manifest pattern target and is idempotent', async () => {
		const root = tempDir();
		fs.mkdirSync( path.join( root, 'patterns' ), { recursive: true } );
		const body = '<!-- wp:paragraph --><p>Hi</p><!-- /wp:paragraph -->';
		const fileA = path.join( root, 'patterns', 'hello.php' );
		const fileB = path.join( root, 'patterns', 'hidden-template-home.php' );
		fs.writeFileSync(
			fileA,
			PATTERN_TEMPLATE( 'Hello', 'theme/hello', 'featured', body )
		);
		fs.writeFileSync(
			fileB,
			PATTERN_TEMPLATE( 'Home', 'theme/hidden-template-home', '', body )
		);

		writeManifest( root, '20260909T000000Z-templates-1', [
			[ 'runtime_pattern', '101', 'hidden-template-home', fileB, 'hash' ],
		] );
		writeManifest( root, '20260909T000100Z-patterns-1', [
			[ 'wp_block', '201', 'hello', fileA, 'hash' ],
			[
				'wp_template',
				'101',
				'home',
				path.join( root, 'templates', 'home.html' ),
				'hash',
			],
		] );

		const injected = runPostBakeLayer( root, [ 'all' ] );

		expect( injected.sort() ).toEqual( [ fileA, fileB ].sort() );
		expect( fs.readFileSync( fileA, 'utf8' ) ).toContain( 'Baked: yes' );
		expect( fs.readFileSync( fileB, 'utf8' ) ).toContain( 'Baked: yes' );

		// Second run: nothing left to inject.
		expect( runPostBakeLayer( root, [ 'all' ] ) ).toEqual( [] );
	} );

	test( 'runPostBakeLayer ignores missing manifest targets', async () => {
		const root = tempDir();
		writeManifest( root, '20260909T000000Z-patterns-1', [
			[
				'wp_block',
				'201',
				'gone',
				path.join( root, 'patterns', 'gone.php' ),
				'hash',
			],
		] );

		expect( runPostBakeLayer( root, [ 'patterns' ] ) ).toEqual( [] );
	} );
} );

describe( 'empty-state overlay rule (SPEC-016 §2.2)', () => {
	test( 'deletes the overlay when the bake captured nothing', async () => {
		const root = tempDir();
		const overlayPath = path.join( root, 'config', 'user-styles.json' );
		fs.mkdirSync( path.dirname( overlayPath ), { recursive: true } );
		fs.writeFileSync(
			overlayPath,
			JSON.stringify( {
				settings: {},
				styles: {},
				fonts: { themeFamilies: [], customFamilies: [] },
			} )
		);

		runPostBakeLayer( root, [ 'styles' ] );

		expect( fs.existsSync( overlayPath ) ).toBe( false );
	} );

	test( 'keeps the overlay with any captured content', async () => {
		const root = tempDir();
		const overlayPath = path.join( root, 'config', 'user-styles.json' );
		fs.mkdirSync( path.dirname( overlayPath ), { recursive: true } );
		fs.writeFileSync(
			overlayPath,
			JSON.stringify( {
				settings: { color: { custom: false } },
				styles: {},
				fonts: { themeFamilies: [], customFamilies: [] },
			} )
		);

		runPostBakeLayer( root, [ 'all' ] );

		expect( fs.existsSync( overlayPath ) ).toBe( true );
	} );

	test( 'keeps a fonts-only overlay', async () => {
		const root = tempDir();
		const overlayPath = path.join( root, 'config', 'user-styles.json' );
		fs.mkdirSync( path.dirname( overlayPath ), { recursive: true } );
		fs.writeFileSync(
			overlayPath,
			JSON.stringify( {
				settings: {},
				styles: {},
				fonts: {
					themeFamilies: [],
					customFamilies: [ { slug: 'inter' } ],
				},
			} )
		);

		runPostBakeLayer( root, [ 'fonts' ] );

		expect( fs.existsSync( overlayPath ) ).toBe( true );
	} );
} );
