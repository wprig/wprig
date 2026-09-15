/**
 * Tests for scripts/lib/paradigm-switch.js
 *
 * Covers the classic-paradigm guarantee: choosing classic during rig-init
 * must yield a theme WordPress core does not detect as a block theme, and the
 * interactive init choice must win over stale config.local.json overrides.
 *
 * @package
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
	teardownClassicArtifacts,
	stripLocalParadigmOverrides,
} from '../lib/paradigm-switch.js';

function makeTempRoot() {
	return fs.mkdtempSync( path.join( os.tmpdir(), 'rig-paradigm-' ) );
}

function writeJson( filePath, contents ) {
	fs.mkdirSync( path.dirname( filePath ), { recursive: true } );
	fs.writeFileSync( filePath, JSON.stringify( contents, null, '\t' ) );
}

describe( 'teardownClassicArtifacts', () => {
	let root;
	let backupDir;

	beforeEach( () => {
		root = makeTempRoot();
		backupDir = path.join( root, '.rig-backup-test' );
	} );

	afterEach( () => {
		fs.rmSync( root, { recursive: true, force: true } );
	} );

	test( 'moves templates/ and parts/ out of the theme root into backup', () => {
		writeJson( path.join( root, 'templates', 'index.html' ), {
			content: 'wp:template-part',
		} );
		writeJson( path.join( root, 'parts', 'header.html' ), {
			content: 'wp:pattern',
		} );
		fs.writeFileSync( path.join( root, 'theme.json' ), '{}' );

		const moved = teardownClassicArtifacts( root, { backupDir } );

		expect( moved ).toHaveLength( 2 );
		expect( fs.existsSync( path.join( root, 'templates' ) ) ).toBe( false );
		expect( fs.existsSync( path.join( root, 'parts' ) ) ).toBe( false );
		expect(
			fs.existsSync( path.join( backupDir, 'templates', 'index.html' ) )
		).toBe( true );
		expect(
			fs.existsSync( path.join( backupDir, 'parts', 'header.html' ) )
		).toBe( true );
		// theme.json is hybrid-legitimate and must survive the teardown.
		expect( fs.existsSync( path.join( root, 'theme.json' ) ) ).toBe( true );
	} );

	test( 'is idempotent when no FSE directories exist', () => {
		expect( teardownClassicArtifacts( root, { backupDir } ) ).toEqual( [] );
	} );

	test( 'does not touch unrelated directories', () => {
		writeJson( path.join( root, 'template-parts', 'hero.html' ), {
			content: 'x',
		} );

		expect( teardownClassicArtifacts( root, { backupDir } ) ).toEqual( [] );
		expect(
			fs.existsSync( path.join( root, 'template-parts', 'hero.html' ) )
		).toBe( true );
	} );
} );

describe( 'stripLocalParadigmOverrides', () => {
	let configDir;

	beforeEach( () => {
		configDir = makeTempRoot();
	} );

	afterEach( () => {
		fs.rmSync( configDir, { recursive: true, force: true } );
	} );

	test( 'removes themeType and enableBlocks while preserving other keys', () => {
		writeJson( path.join( configDir, 'config.local.json' ), {
			theme: {
				PHPNamespace: 'Test_Theme\\Test_Theme',
				slug: 'test-theme',
				themeType: 'block-based',
				enableBlocks: true,
			},
		} );

		const result = stripLocalParadigmOverrides( configDir );

		expect( result.modified ).toBe( true );
		expect( result.stripped ).toEqual( [
			'theme.themeType',
			'theme.enableBlocks',
		] );

		const written = JSON.parse(
			fs.readFileSync(
				path.join( configDir, 'config.local.json' ),
				'utf8'
			)
		);
		expect( written.theme ).toEqual( {
			PHPNamespace: 'Test_Theme\\Test_Theme',
			slug: 'test-theme',
		} );
	} );

	test( 'drops an empty theme object after stripping', () => {
		writeJson( path.join( configDir, 'config.local.json' ), {
			theme: { themeType: 'block-based' },
		} );

		stripLocalParadigmOverrides( configDir );

		const written = JSON.parse(
			fs.readFileSync(
				path.join( configDir, 'config.local.json' ),
				'utf8'
			)
		);
		expect( written ).toEqual( {} );
	} );

	test( 'reports unmodified when no paradigm keys are present', () => {
		writeJson( path.join( configDir, 'config.local.json' ), {
			theme: { slug: 'test-theme' },
		} );

		expect( stripLocalParadigmOverrides( configDir ) ).toEqual( {
			modified: false,
			stripped: [],
		} );
	} );

	test( 'handles a missing config.local.json without error', () => {
		expect( stripLocalParadigmOverrides( configDir ) ).toEqual( {
			modified: false,
			stripped: [],
		} );
	} );

	test( 'handles invalid JSON without error', () => {
		fs.writeFileSync(
			path.join( configDir, 'config.local.json' ),
			'{ not valid json'
		);

		expect( stripLocalParadigmOverrides( configDir ) ).toEqual( {
			modified: false,
			stripped: [],
		} );
	} );
} );
