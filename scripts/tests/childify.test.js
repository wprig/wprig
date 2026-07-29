/* eslint-env es6 */
/* global test, expect, describe */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPhpFiles } from '../../node/childify.js';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );
const themeRoot = path.resolve( __dirname, '../..' );

describe( 'Childify Script Utilities', () => {
	test( 'getPhpFiles finds PHP files recursively and respects exclusions', () => {
		const phpFiles = getPhpFiles( themeRoot );

		// Expect basic theme files to be found
		const relativePaths = phpFiles.map( ( f ) => path.relative( themeRoot, f ) );
		expect( relativePaths ).toContain( 'functions.php' );
		expect( relativePaths ).toContain( path.join( 'inc', 'Theme.php' ) );
		expect( relativePaths ).toContain( path.join( 'inc', 'Template_Tags.php' ) );

		// Expect excluded directories to be ignored
		const hasVendor = relativePaths.some( ( p ) => p.startsWith( 'vendor/' ) );
		const hasNodeModules = relativePaths.some( ( p ) => p.startsWith( 'node_modules/' ) );
		const hasGit = relativePaths.some( ( p ) => p.startsWith( '.git/' ) );

		expect( hasVendor ).toBe( false );
		expect( hasNodeModules ).toBe( false );
		expect( hasGit ).toBe( false );
	} );
} );

describe( 'Child Theme Regression & Static Analysis Guard', () => {
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
		const filePath = path.join( themeRoot, 'inc', 'Localization/Component.php' );
		const content = fs.readFileSync( filePath, 'utf8' );

		expect( content ).toContain( 'is_child_theme()' );
		expect( content ).toContain( 'get_stylesheet_directory()' );
		expect( content ).toContain( 'get_template_directory()' );
	} );
} );
