/* eslint-env es6 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import {
	FRAMEWORK_VERSION_FILE,
	isValidVersion,
	readFrameworkVersion,
	writeFrameworkVersion,
	stripFrameworkVersion,
	readThemeVersion,
	stampVersionHeaders,
} from '../lib/versions.js';

describe( 'Version helpers', () => {
	let themeRoot;

	beforeEach( () => {
		themeRoot = fs.mkdtempSync(
			path.join( os.tmpdir(), 'wprig-versions-' )
		);
	} );

	afterEach( () => {
		fs.rmSync( themeRoot, { recursive: true, force: true } );
	} );

	test( 'isValidVersion accepts semver and rejects junk', () => {
		expect( isValidVersion( '3.5.0' ) ).toBe( true );
		expect( isValidVersion( '1.0.0-beta.1' ) ).toBe( true );
		expect( isValidVersion( '1.0' ) ).toBe( false );
		expect( isValidVersion( '' ) ).toBe( false );
		expect( isValidVersion( undefined ) ).toBe( false );
	} );

	test( 'readFrameworkVersion returns null when the file is absent', () => {
		expect( readFrameworkVersion( themeRoot ) ).toBe( null );
	} );

	test( 'writeFrameworkVersion creates the file and preserves other keys', () => {
		const filePath = writeFrameworkVersion( themeRoot, '3.5.0' );
		expect( fs.existsSync( filePath ) ).toBe( true );

		const data = JSON.parse( fs.readFileSync( filePath, 'utf8' ) );
		expect( data.version ).toBe( '3.5.0' );
		expect( data.name ).toBe( 'wp-rig' );

		writeFrameworkVersion( themeRoot, '3.6.0' );
		const updated = JSON.parse( fs.readFileSync( filePath, 'utf8' ) );
		expect( updated.version ).toBe( '3.6.0' );
		expect( readFrameworkVersion( themeRoot ) ).toBe( '3.6.0' );
	} );

	test( 'readFrameworkVersion returns null for malformed JSON', () => {
		fs.mkdirSync( path.join( themeRoot, 'config' ), { recursive: true } );
		fs.writeFileSync(
			path.join( themeRoot, FRAMEWORK_VERSION_FILE ),
			'{ not json',
			'utf8'
		);
		expect( readFrameworkVersion( themeRoot ) ).toBe( null );
	} );

	test( 'stripFrameworkVersion removes the file (childify no-leak)', () => {
		writeFrameworkVersion( themeRoot, '3.5.0' );
		expect( stripFrameworkVersion( themeRoot ) ).toBe( true );
		expect( readFrameworkVersion( themeRoot ) ).toBe( null );
		expect( stripFrameworkVersion( themeRoot ) ).toBe( false );
	} );

	test( 'readThemeVersion reads the style.css Version header', () => {
		fs.writeFileSync(
			path.join( themeRoot, 'style.css' ),
			'/*\nTheme Name: Demo\nVersion: 1.2.3\n*/\n',
			'utf8'
		);
		expect( readThemeVersion( themeRoot ) ).toBe( '1.2.3' );
	} );

	test( 'stampVersionHeaders stamps style.css and readme.txt only', () => {
		expect(
			stampVersionHeaders(
				'/*\nVersion: 3.5.0\n*/\n',
				'/tmp/style.css',
				'1.0.0'
			)
		).toContain( 'Version: 1.0.0' );

		expect(
			stampVersionHeaders(
				'Stable tag: 3.5.0\n',
				'/tmp/readme.txt',
				'1.0.0'
			)
		).toContain( 'Stable tag: 1.0.0' );

		const other = 'Version: 3.5.0\n';
		expect( stampVersionHeaders( other, '/tmp/other.txt', '1.0.0' ) ).toBe(
			other
		);

		// No version -> untouched.
		expect(
			stampVersionHeaders( 'Version: 3.5.0\n', '/tmp/style.css', '' )
		).toBe( 'Version: 3.5.0\n' );
	} );

	test( 'stampVersionHeaders inserts $-bearing versions literally', () => {
		// Regression: the version was interpolated into the replacement
		// string, so "$&" / "$1" sequences in a version value would expand
		// as replacement patterns and corrupt the header.
		const stamped = stampVersionHeaders(
			'/*\nVersion: 3.5.0\n*/\n',
			'/tmp/style.css',
			'1.0.0$&x'
		);
		expect( stamped ).toContain( 'Version: 1.0.0$&x' );
		expect( stamped ).not.toContain( 'Version: 1.0.0Version' );
	} );
} );
