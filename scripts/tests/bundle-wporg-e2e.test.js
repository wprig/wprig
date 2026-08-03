/* eslint-env es6 */
/* global test, expect, beforeAll */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import fse from 'fs-extra';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let prodPath = '';
let slug = '';

beforeAll( () => {
	// Execute the wporg bundle command skipping the audit for speed
	execSync( 'npm run bundle:wporg -- --skip-audit', { 
		stdio: 'ignore', 
		cwd: path.join( __dirname, '..', '..' ) 
	} );

	// Determine the current slug based on WP Rig's config fallback logic
	const rootDir = path.join( __dirname, '..', '..' );
	let config = {};
	
	// Read config logic matching getThemeConfig() exactly
	if ( fs.existsSync( path.join( rootDir, 'config', 'config.local.json' ) ) ) {
		config = JSON.parse( fs.readFileSync( path.join( rootDir, 'config', 'config.local.json' ), 'utf-8' ) );
	} else if ( fs.existsSync( path.join( rootDir, 'config', 'config.json' ) ) ) {
		config = JSON.parse( fs.readFileSync( path.join( rootDir, 'config', 'config.json' ), 'utf-8' ) );
	} else {
		try {
			config = JSON.parse( fs.readFileSync( path.join( rootDir, 'config', 'config.default.json' ), 'utf-8' ) );
		} catch ( e ) {}
	}
	
	// Ensure we handle empty string slugs by defaulting to wp-rig just like the actual builder does.
	slug = ( config.theme && config.theme.slug !== '' ) ? config.theme.slug : 'wp-rig';

	// The prod path is ../<slug>
	prodPath = path.join( rootDir, '..', slug );
}, 60000 );

afterAll( () => {
	// CRITICAL SAFETY CHECK: NEVER delete the source directory!
	const rootDir = path.join( __dirname, '..', '..' );
	if ( path.resolve( prodPath ) === path.resolve( rootDir ) ) {
		console.error( `CRITICAL SAFETY ABORT: prodPath (${ prodPath }) resolves to the source directory. Cleanup aborted to prevent data loss.` );
		return;
	}

	// Clean up generated bundle for testing
	if ( prodPath && fs.existsSync( prodPath ) ) {
		fse.removeSync( prodPath );
	}
	const zipPath = `${prodPath}.zip`;
	if ( fs.existsSync( zipPath ) ) {
		fse.removeSync( zipPath );
	}
} );

test( 'bundle:wporg outputs package.json', () => {
	const filePath = path.join( prodPath, 'package.json' );
	expect( fs.existsSync( filePath ) ).toBe( true );
} );

test( 'bundle:wporg outputs assets/css/src', () => {
	const filePath = path.join( prodPath, 'assets', 'css', 'src' );
	// only test if it exists in the main repo
	if ( fs.existsSync( path.join( __dirname, '..', '..', 'assets', 'css', 'src' ) ) ) {
		expect( fs.existsSync( filePath ) ).toBe( true );
	}
} );

test( 'bundle:wporg outputs assets/js/src', () => {
	const filePath = path.join( prodPath, 'assets', 'js', 'src' );
	if ( fs.existsSync( path.join( __dirname, '..', '..', 'assets', 'js', 'src' ) ) ) {
		expect( fs.existsSync( filePath ) ).toBe( true );
	}
} );

test( 'bundle:wporg strips assets/blocks (Plugin Territory)', () => {
	const filePath = path.join( prodPath, 'assets', 'blocks' );
	expect( fs.existsSync( filePath ) ).toBe( false );
} );

test( 'bundle:wporg strips inc/Blocks (Plugin Territory)', () => {
	const filePath = path.join( prodPath, 'inc', 'Blocks' );
	expect( fs.existsSync( filePath ) ).toBe( false );
} );

