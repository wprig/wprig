/* eslint-env es6 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import promoteVersion from '../tasks/promoteVersion.js';
import promoteFrameworkVersion from '../tasks/promoteFrameworkVersion.js';

/**
 * Seeds a minimal theme/framework root for version-task tests.
 *
 * @param {string} root Temp root.
 */
function seedRoot( root ) {
	fs.mkdirSync( path.join( root, 'config' ), { recursive: true } );
	fs.writeFileSync(
		path.join( root, 'config', 'framework.json' ),
		JSON.stringify( { name: 'wp-rig', version: '3.5.0' }, null, 2 ) + '\n',
		'utf8'
	);
	fs.writeFileSync(
		path.join( root, 'config', 'config.default.json' ),
		JSON.stringify( { theme: { version: '1.0.0' } }, null, 2 ) + '\n',
		'utf8'
	);
	fs.writeFileSync(
		path.join( root, 'config', 'config.json' ),
		JSON.stringify( { theme: { version: '1.0.0' } }, null, 2 ) + '\n',
		'utf8'
	);
	fs.writeFileSync(
		path.join( root, 'package.json' ),
		JSON.stringify( { name: 'wprig', version: '3.5.0' }, null, 2 ) + '\n',
		'utf8'
	);
	fs.writeFileSync(
		path.join( root, 'style.css' ),
		'/*\nTheme Name: Demo\nVersion: 1.0.0\n*/\n',
		'utf8'
	);
	fs.writeFileSync(
		path.join( root, 'readme.txt' ),
		'Stable tag: 1.0.0\n',
		'utf8'
	);
	fs.writeFileSync(
		path.join( root, 'CHANGELOG.md' ),
		'# Changelog\n',
		'utf8'
	);
}

describe( 'Version promotion tasks', () => {
	let root;

	beforeEach( () => {
		root = fs.mkdtempSync( path.join( os.tmpdir(), 'wprig-promote-' ) );
		seedRoot( root );
	} );

	afterEach( () => {
		fs.rmSync( root, { recursive: true, force: true } );
	} );

	test( 'promoteVersion bumps only the theme version', async () => {
		await promoteVersion( root, '1.2.0' );

		const framework = JSON.parse(
			fs.readFileSync(
				path.join( root, 'config', 'framework.json' ),
				'utf8'
			)
		);
		const pkg = JSON.parse(
			fs.readFileSync( path.join( root, 'package.json' ), 'utf8' )
		);
		const defCfg = JSON.parse(
			fs.readFileSync(
				path.join( root, 'config', 'config.default.json' ),
				'utf8'
			)
		);
		const cfg = JSON.parse(
			fs.readFileSync(
				path.join( root, 'config', 'config.json' ),
				'utf8'
			)
		);

		// Theme stream moved.
		expect( defCfg.theme.version ).toBe( '1.2.0' );
		expect( cfg.theme.version ).toBe( '1.2.0' );
		expect(
			fs.readFileSync( path.join( root, 'style.css' ), 'utf8' )
		).toContain( 'Version: 1.2.0' );
		expect(
			fs.readFileSync( path.join( root, 'readme.txt' ), 'utf8' )
		).toContain( 'Stable tag: 1.2.0' );

		// Framework stream untouched.
		expect( framework.version ).toBe( '3.5.0' );
		expect( pkg.version ).toBe( '3.5.0' );
	} );

	test( 'promoteFrameworkVersion bumps only the framework version', async () => {
		await promoteFrameworkVersion( root, '3.6.0' );

		const framework = JSON.parse(
			fs.readFileSync(
				path.join( root, 'config', 'framework.json' ),
				'utf8'
			)
		);
		const pkg = JSON.parse(
			fs.readFileSync( path.join( root, 'package.json' ), 'utf8' )
		);
		const defCfg = JSON.parse(
			fs.readFileSync(
				path.join( root, 'config', 'config.default.json' ),
				'utf8'
			)
		);

		// Framework stream moved.
		expect( framework.version ).toBe( '3.6.0' );
		expect( pkg.version ).toBe( '3.6.0' );

		// Theme stream untouched.
		expect( defCfg.theme.version ).toBe( '1.0.0' );
		expect(
			fs.readFileSync( path.join( root, 'style.css' ), 'utf8' )
		).toContain( 'Version: 1.0.0' );
	} );

	test( 'both tasks reject invalid versions', async () => {
		await expect( promoteVersion( root, 'nope' ) ).rejects.toThrow();
		await expect(
			promoteFrameworkVersion( root, '1.0' )
		).rejects.toThrow();
	} );
} );
