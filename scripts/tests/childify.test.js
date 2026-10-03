/* eslint-env es6 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
	getPhpFiles,
	readThemeType,
	resolveKeepList,
	readMergedConfig,
	REQUIRED_INC_FILES,
} from '../../node/childify.js';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );
const themeRoot = path.resolve( __dirname, '../..' );

describe( 'Childify Script Utilities', () => {
	test( 'getPhpFiles finds PHP files recursively and respects exclusions', () => {
		const phpFiles = getPhpFiles( themeRoot );

		// Expect basic theme files to be found
		const relativePaths = phpFiles.map( ( f ) =>
			path.relative( themeRoot, f )
		);
		expect( relativePaths ).toContain( 'functions.php' );
		expect( relativePaths ).toContain( path.join( 'inc', 'Theme.php' ) );
		expect( relativePaths ).toContain(
			path.join( 'inc', 'Template_Tags.php' )
		);

		// Expect excluded directories to be ignored
		const hasVendor = relativePaths.some( ( p ) =>
			p.startsWith( 'vendor/' )
		);
		const hasNodeModules = relativePaths.some( ( p ) =>
			p.startsWith( 'node_modules/' )
		);
		const hasGit = relativePaths.some( ( p ) => p.startsWith( '.git/' ) );

		expect( hasVendor ).toBe( false );
		expect( hasNodeModules ).toBe( false );
		expect( hasGit ).toBe( false );
	} );
} );

describe( 'Childify Paradigm-Aware Keep-List (Zero-Config Scaffolding)', () => {
	test( 'classic theme keeps the classic core (Styles, Scripts, Sidebars)', () => {
		expect( resolveKeepList( 'classic' ).sort() ).toEqual(
			[ 'Styles', 'Sidebars', 'Scripts' ].sort()
		);
	} );

	test( 'block-capable themes additionally keep the block components', () => {
		const expected = [
			'Styles',
			'Sidebars',
			'Scripts',
			'Editor',
			'Blocks',
			'Block_Patterns',
			'Block_Styles',
			'Icons',
		].sort();

		expect( resolveKeepList( 'universal' ).sort() ).toEqual( expected );
		expect( resolveKeepList( 'block-based' ).sort() ).toEqual( expected );
	} );

	test( 'readThemeType resolves the active paradigm from the shared config', () => {
		const themeType = readThemeType();
		expect( [ 'classic', 'universal', 'block-based' ] ).toContain(
			themeType
		);
		expect( themeType ).toBe( readMergedConfig()?.theme?.themeType );
	} );

	test( 'readMergedConfig reflects shipped config.json, not config.local.json', () => {
		const customPath = path.join( themeRoot, 'config', 'config.json' );
		if ( ! fs.existsSync( customPath ) ) {
			return; // No config.json in this clone — nothing to verify.
		}
		const cfg = readMergedConfig();
		const custom = JSON.parse( fs.readFileSync( customPath, 'utf8' ) );
		expect( cfg?.theme?.enableBlocks ).toBe( custom?.theme?.enableBlocks );
	} );
} );

describe( 'Child Theme Regression & Static Analysis Guard', () => {
	test( 'REQUIRED_INC_FILES keeps every framework file the kept components depend on', () => {
		// Regression: childify used to move Paradigm.php, the paradigm traits,
		// Versioning_Trait.php, and Asset_Provider.php to the backup even though
		// kept components (Theme.php, Styles, Scripts, Sidebars, Block_Patterns,
		// Icons) import them — producing a child theme that fatals on load.
		for ( const required of [
			'Paradigm.php',
			'Paradigm_Component_Trait.php',
			'Classic_Component_Trait.php',
			'Versioning_Trait.php',
			'Asset_Provider.php',
		] ) {
			expect( REQUIRED_INC_FILES ).toContain( required );
		}
	} );

	test( 'every root-namespace import of kept components resolves to a kept file', () => {
		// Invariant: for each kept component (superset keep-list) plus Theme.php,
		// any `use WP_Rig\WP_Rig\X;` class/trait import that maps to a root
		// inc/X.php file must be in REQUIRED_INC_FILES — otherwise childify
		// would move a live dependency into the backup.
		const keptDirs = resolveKeepList( 'block-based' );
		const sources = [ 'Theme.php' ].concat(
			keptDirs.map( ( dir ) => `${ dir }/Component.php` )
		);

		const violations = [];
		for ( const rel of sources ) {
			const filePath = path.join( themeRoot, 'inc', rel );
			if ( ! fs.existsSync( filePath ) ) {
				continue;
			}
			const content = fs.readFileSync( filePath, 'utf8' );
			const imports = content.match( /^use WP_Rig\\WP_Rig\\(\w+);/gm );
			for ( const className of imports || [] ) {
				const depFile = `${ className }.php`;
				if (
					fs.existsSync( path.join( themeRoot, 'inc', depFile ) ) &&
					! REQUIRED_INC_FILES.includes( depFile )
				) {
					violations.push( `${ rel } -> inc/${ depFile }` );
				}
			}
		}

		expect( violations ).toEqual( [] );
	} );

	test( 'inc/Theme.php is child-theme compatible', () => {
		const filePath = path.join( themeRoot, 'inc', 'Theme.php' );
		const content = fs.readFileSync( filePath, 'utf8' );

		// Theme.php should scan the active stylesheet/child theme directory
		expect( content ).toContain( 'get_stylesheet_directory()' );
		expect( content ).not.toContain( 'get_template_directory()' );
	} );

	test( 'inc/Template_Tags.php supports child theme asset overrides with fallback', () => {
		const filePath = path.join( themeRoot, 'inc', 'Template_Tags.php' );
		const content = fs.readFileSync( filePath, 'utf8' );

		// Template_Tags should check for assets in get_stylesheet_directory() first
		expect( content ).toContain( 'get_stylesheet_directory()' );
		expect( content ).toContain( 'get_stylesheet_directory_uri()' );

		// Ensure fallback is also defined
		expect( content ).toContain( 'get_template_directory()' );
		expect( content ).toContain( 'get_template_directory_uri()' );
	} );

	test( 'inc/Versioning_Trait.php is child-theme compatible', () => {
		const filePath = path.join( themeRoot, 'inc', 'Versioning_Trait.php' );
		const content = fs.readFileSync( filePath, 'utf8' );

		// Should use dynamic theme-version retrieval instead of hardcoding template
		expect( content ).toContain( 'wp_get_theme()' );
		expect( content ).not.toContain( 'wp_get_theme( get_template() )' );
	} );

	test( 'inc/Localization/Component.php supports child theme translations', () => {
		const filePath = path.join(
			themeRoot,
			'inc',
			'Localization/Component.php'
		);
		const content = fs.readFileSync( filePath, 'utf8' );

		expect( content ).toContain( 'is_child_theme()' );
		expect( content ).toContain( 'get_stylesheet_directory()' );
		expect( content ).toContain( 'get_template_directory()' );
	} );

	test( 'childify strips the source-only framework version file', () => {
		const filePath = path.join( themeRoot, 'node', 'childify.js' );
		const content = fs.readFileSync( filePath, 'utf8' );

		// A built child theme must not carry the WP Rig framework version.
		expect( content ).toContain( 'stripFrameworkVersion' );
	} );
} );
