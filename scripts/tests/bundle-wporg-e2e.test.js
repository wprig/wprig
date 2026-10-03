/* eslint-env es6 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import fse from 'fs-extra';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

let prodPath = '';
let slug = '';
const rootDir = path.join( __dirname, '..', '..' );
// Directories stripped by prodCopyWporgSrc as plugin territory, independent of
// paradigm gating — exempt from the paradigm matrix assertions.
const PLUGIN_TERRITORY_COMPONENTS = new Set( [ 'Blocks' ] );

beforeAll( () => {
	// Execute the wporg bundle command skipping the audit for speed
	execSync( 'npm run bundle:wporg -- --skip-audit', {
		stdio: 'ignore',
		cwd: path.join( __dirname, '..', '..' ),
	} );

	// Determine the current slug based on WP Rig's config fallback logic
	let config = {};

	// Read config logic matching getThemeConfig() exactly
	if (
		fs.existsSync( path.join( rootDir, 'config', 'config.local.json' ) )
	) {
		config = JSON.parse(
			fs.readFileSync(
				path.join( rootDir, 'config', 'config.local.json' ),
				'utf-8'
			)
		);
	} else if (
		fs.existsSync( path.join( rootDir, 'config', 'config.json' ) )
	) {
		config = JSON.parse(
			fs.readFileSync(
				path.join( rootDir, 'config', 'config.json' ),
				'utf-8'
			)
		);
	} else {
		try {
			config = JSON.parse(
				fs.readFileSync(
					path.join( rootDir, 'config', 'config.default.json' ),
					'utf-8'
				)
			);
		} catch ( e ) {}
	}

	// Ensure we handle empty string slugs by defaulting to wp-rig just like the actual builder does.
	slug =
		config.theme && config.theme.slug !== '' ? config.theme.slug : 'wp-rig';

	// The prod path is ../<slug>
	prodPath = path.join( rootDir, '..', slug );
}, 60000 );

afterAll( () => {
	// CRITICAL SAFETY CHECK: NEVER delete the source directory!
	if ( path.resolve( prodPath ) === path.resolve( rootDir ) ) {
		console.error(
			`CRITICAL SAFETY ABORT: prodPath (${ prodPath }) resolves to the source directory. Cleanup aborted to prevent data loss.`
		);
		return;
	}

	// Clean up generated bundle for testing
	if ( prodPath && fs.existsSync( prodPath ) ) {
		fse.removeSync( prodPath );
	}
	const zipPath = `${ prodPath }.zip`;
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
	if (
		fs.existsSync(
			path.join( __dirname, '..', '..', 'assets', 'css', 'src' )
		)
	) {
		expect( fs.existsSync( filePath ) ).toBe( true );
	}
} );

test( 'bundle:wporg outputs assets/js/src', () => {
	const filePath = path.join( prodPath, 'assets', 'js', 'src' );
	if (
		fs.existsSync(
			path.join( __dirname, '..', '..', 'assets', 'js', 'src' )
		)
	) {
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

// --- Paradigm bake-and-strip assertions (SPEC-005) ---

/** Resolves the active theme type the same way the build does. */
function resolveThemeType() {
	const readJson = ( p ) =>
		fs.existsSync( p ) ? JSON.parse( fs.readFileSync( p, 'utf-8' ) ) : {};
	const merged = {
		...readJson( path.join( rootDir, 'config', 'config.default.json' ) ),
		...readJson( path.join( rootDir, 'config', 'config.json' ) ),
		...readJson( path.join( rootDir, 'config', 'config.local.json' ) ),
	};
	return merged.theme?.themeType ?? 'classic';
}

/**
 * Paradigm tag declared in a prod Component.php, or 'all'.
 *
 * @param {string} themeProdPath Production theme path.
 * @param {string} dir           Component directory name.
 * @return {string|null} Paradigm tag, or null when Component.php is missing.
 */
function componentTag( themeProdPath, dir ) {
	const componentPhp = path.join(
		themeProdPath,
		'inc',
		dir,
		'Component.php'
	);
	if ( ! fs.existsSync( componentPhp ) ) {
		return null;
	}
	const match = fs
		.readFileSync( componentPhp, 'utf-8' )
		.match( /const\s+PARADIGM\s*=\s*['"]([^'"]+)['"]/ );
	return match ? match[ 1 ] : 'all';
}

test( 'bundle:wporg does not ship the config directory', () => {
	expect( fs.existsSync( path.join( prodPath, 'config' ) ) ).toBe( false );
} );

test( 'bundle:wporg ships Paradigm.php as a baked stub with no config reads', () => {
	const filePath = path.join( prodPath, 'inc', 'Paradigm.php' );
	expect( fs.existsSync( filePath ) ).toBe( true );
	const content = fs.readFileSync( filePath, 'utf-8' );

	expect( content ).toContain( 'BAKED AT BUILD TIME' );
	expect( content ).toContain( resolveThemeType() );
	expect( content ).not.toContain( 'file_get_contents' );
	expect( content ).not.toContain( 'get_config' );
	expect( content ).not.toContain( 'get_theme_file_path' );
} );

test( 'bundle:wporg ships paradigm traits with no config reads', () => {
	for ( const trait of [
		'Paradigm_Component_Trait.php',
		'Classic_Component_Trait.php',
	] ) {
		const filePath = path.join( prodPath, 'inc', trait );
		expect( fs.existsSync( filePath ) ).toBe( true );
		const content = fs.readFileSync( filePath, 'utf-8' );
		expect( content ).not.toContain( 'file_get_contents' );
		expect( content ).not.toContain( 'json_decode' );
	}
} );

test( 'bundle:wporg ships exactly the components the paradigm matrix allows', () => {
	const definitions = JSON.parse(
		fs.readFileSync(
			path.join( rootDir, 'config', 'paradigms.json' ),
			'utf-8'
		)
	);
	const themeType = resolveThemeType();
	const prodIncDir = path.join( prodPath, 'inc' );
	const srcIncDir = path.join( rootDir, 'inc' );

	expect( fs.existsSync( prodIncDir ) ).toBe( true );

	const prodComponents = fs
		.readdirSync( prodIncDir, { withFileTypes: true } )
		.filter( ( d ) => d.isDirectory() && d.name !== 'Dev_Tools' )
		.map( ( d ) => d.name );

	// Every shipped component's tag must be enabled for the theme type.
	for ( const name of prodComponents ) {
		const tag = componentTag( prodPath, name );
		if ( null === tag ) {
			continue; // Not a component directory.
		}
		expect( definitions.tags[ tag ] ).toContain( themeType );
	}

	// Every source component gated out for the theme type must be absent.
	for ( const name of fs.readdirSync( srcIncDir, { withFileTypes: true } ) ) {
		if ( ! name.isDirectory() || name.name === 'Dev_Tools' ) {
			continue;
		}
		if ( PLUGIN_TERRITORY_COMPONENTS.has( name.name ) ) {
			continue;
		}
		const srcComponentPhp = path.join(
			srcIncDir,
			name.name,
			'Component.php'
		);
		if ( ! fs.existsSync( srcComponentPhp ) ) {
			continue;
		}
		const tag = ( fs
			.readFileSync( srcComponentPhp, 'utf-8' )
			.match( /const\s+PARADIGM\s*=\s*['"]([^'"]+)['"]/ ) || [
			null,
			'all',
		] )[ 1 ];
		const enabled = definitions.tags[ tag ].includes( themeType );
		const shipped = prodComponents.includes( name.name );
		expect( {
			component: name.name,
			tag,
			shipped,
		} ).toEqual( {
			component: name.name,
			tag,
			shipped: enabled,
		} );
	}
} );

test( 'bundle:wporg output passes php -l on every PHP file', () => {
	let phpUsable = true;
	try {
		execSync( 'php -v', { stdio: 'ignore' } );
	} catch {
		phpUsable = false;
	}
	if ( ! phpUsable ) {
		return; // php binary unavailable on this runner.
	}

	const phpFiles = [];
	const walk = ( dir ) => {
		for ( const entry of fs.readdirSync( dir, { withFileTypes: true } ) ) {
			const full = path.join( dir, entry.name );
			if ( entry.isDirectory() ) {
				walk( full );
			} else if ( entry.name.endsWith( '.php' ) ) {
				phpFiles.push( full );
			}
		}
	};
	walk( prodPath );

	expect( phpFiles.length ).toBeGreaterThan( 0 );
	for ( const file of phpFiles ) {
		let result;
		try {
			result = execSync( `php -l "${ file }"`, {
				stdio: 'pipe',
				encoding: 'utf-8',
			} );
		} catch ( err ) {
			throw new Error( `php -l failed for ${ file }:\n${ err.stderr }` );
		}
		expect( result ).toContain( 'No syntax errors detected' );
	}
} );
