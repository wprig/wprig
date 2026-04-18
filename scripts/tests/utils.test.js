/* eslint-env es6 */
/* global test, expect */

/**
 * Internal dependencies
 */
import {
	getAssetPath,
	escapeRegExp,
	backslashToForwardSlash,
	appendBaseToFilePathArray,
} from '../lib/utils.js';

test( 'getAssetPath maps assets to src directory', () => {
	expect( getAssetPath( 'assets/css/main.css' ) ).toBe(
		'assets/css/src/main.css'
	);
	expect( getAssetPath( 'assets/js/main.js' ) ).toBe(
		'assets/js/src/main.js'
	);
	expect( getAssetPath( 'assets/images/logo.png' ) ).toBe(
		'assets/images/src/logo.png'
	);
} );

test( 'getAssetPath does not map if already in src, build, or vendor', () => {
	expect( getAssetPath( 'assets/css/src/main.css' ) ).toBe(
		'assets/css/src/main.css'
	);
	expect( getAssetPath( 'assets/js/build/main.js' ) ).toBe(
		'assets/js/build/main.js'
	);
	expect( getAssetPath( 'assets/js/vendor/library.js' ) ).toBe(
		'assets/js/vendor/library.js'
	);
} );

test( 'getAssetPath does not map if not in assets directory', () => {
	expect( getAssetPath( 'inc/Component.php' ) ).toBe( 'inc/Component.php' );
} );

test( 'escapeRegExp escapes special characters', () => {
	expect( escapeRegExp( 'test.css' ) ).toBe( 'test\\.css' );
	expect( escapeRegExp( 'a+b*c?' ) ).toBe( 'a\\+b\\*c\\?' );
} );

test( 'backslashToForwardSlash converts backslashes', () => {
	expect( backslashToForwardSlash( 'path\\to\\file' ) ).toBe(
		'path/to/file'
	);
	expect( backslashToForwardSlash( [ 'a\\b', 'c\\d' ] ) ).toEqual( [
		'a/b',
		'c/d',
	] );
} );

test( 'appendBaseToFilePathArray appends base path', () => {
	expect( appendBaseToFilePathArray( 'file.js', 'base' ) ).toBe(
		'base/file.js'
	);
	expect( appendBaseToFilePathArray( [ 'f1.js', 'f2.js' ], 'base' ) ).toEqual(
		[ 'base/f1.js', 'base/f2.js' ]
	);
} );
