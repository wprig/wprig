/* eslint-env es6 */
/* global test, expect */
/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import {
	pipe as pump,
	from,
	concat,
} from 'mississippi';
import Vinyl from 'vinyl';
import fs from 'fs';

/**
 * Internal dependencies
 */
import { gulpTestPath } from '../../constants';
import { getThemeConfig, getDefaultConfig } from '../../utils';
import { stylesAfterReplacementStream } from '../../styles';

function makeMockFiles() {
	return [
		new Vinyl( {
			path: 'mock.css',
			contents: fs.readFileSync( `${ gulpTestPath }/styles/mock.css` ),
		} ),
	];
}

test( 'nesting', ( done ) => {
	const mockFiles = makeMockFiles();

	const config = getThemeConfig();
	// Force minification of CSS.
	config.dev.debug.styles = false;

	function assert( files ) {
		const file = files[ 0 ];
		const fileContents = file.contents.toString( 'utf-8' );
		expect( fileContents ).toContain( '.entry .inner' );
	}

	pump( [
		from.obj( mockFiles ),
		stylesAfterReplacementStream(),
		concat( assert ),
	], done );
} );

test( 'partials are imported', ( done ) => {
	const mockFiles = makeMockFiles();

	const config = getThemeConfig();
	// Force minification of CSS.
	config.dev.debug.styles = false;

	function assert( files ) {
		const file = files[ 0 ];
		const fileContents = file.contents.toString( 'utf-8' );
		expect( fileContents ).toContain( ':root' );
		expect( fileContents ).toContain( '--global-font-color:#333' );
	}

	pump( [
		from.obj( mockFiles ),
		stylesAfterReplacementStream(),
		concat( assert ),
	], done );
} );

test( 'custom properties processed', ( done ) => {
	const mockFiles = makeMockFiles();

	const config = getThemeConfig();
	// Force minification of CSS.
	config.dev.debug.styles = false;

	function assert( files ) {
		const file = files[ 0 ];
		const fileContents = file.contents.toString( 'utf-8' );
		expect( fileContents ).toContain( 'color:#e36d60' );
		expect( fileContents ).toContain( 'font-family:"Crimson Text",serif' );
	}

	pump( [
		from.obj( mockFiles ),
		stylesAfterReplacementStream(),
		concat( assert ),
	], done );
} );

test( 'custom media is processed', ( done ) => {
	const mockFiles = makeMockFiles();

	const config = getThemeConfig();
	// Force minification of CSS.
	config.dev.debug.styles = false;

	function assert( files ) {
		const file = files[ 0 ];
		const fileContents = file.contents.toString( 'utf-8' );
		expect( fileContents ).toContain( '@media screen and (min-width:48em)' );
	}

	pump( [
		from.obj( mockFiles ),
		stylesAfterReplacementStream(),
		concat( assert ),
	], done );
} );

test( 'minifies by default', ( done ) => {
	const mockFiles = makeMockFiles();

	const config = getThemeConfig();
	// Set styles debug to the default value.
	const defaultConfig = getDefaultConfig();
	config.dev.debug.styles = defaultConfig.dev.debug.styles;

	function assert( files ) {
		const file = files[ 0 ];
		const fileContents = file.contents.toString( 'utf-8' );
		expect( file.basename ).toEqual( 'mock.min.css' );
		// Minified files will not have newlines.
		expect( fileContents ).not.toContain( '\n' );
	}

	pump( [
		from.obj( mockFiles ),
		stylesAfterReplacementStream(),
		concat( assert ),
	], done );
} );

test( 'debug config disables minify', ( done ) => {
	const config = getThemeConfig();
	config.dev.debug.styles = true;

	const mockFiles = makeMockFiles();

	function assert( files ) {
		const file = files[ 0 ];
		const fileContents = file.contents.toString( 'utf-8' );
		// Unminified files will have newlines.
		expect( fileContents ).toContain( '\n' );
	}

	pump( [
		from.obj( mockFiles ),
		stylesAfterReplacementStream(),
		concat( assert ),
	], done );
} );

test( 'IE grid prefix if configured', ( done ) => {
	const config = getThemeConfig();
	config.dev.styles.autoprefixer = { grid: true };

	const mockFiles = makeMockFiles();

	function assert( files ) {
		const file = files[ 0 ];
		const fileContents = file.contents.toString( 'utf-8' );
		expect( fileContents ).toContain( '-ms-grid' );
	}

	pump( [
		from.obj( mockFiles ),
		stylesAfterReplacementStream(),
		concat( assert ),
	], done );
} );

test( 'No IE grid prefix by default', ( done ) => {
	const config = getThemeConfig();
	// Set autoprefix to the default value.
	const defaultConfig = getDefaultConfig();
	config.dev.styles.autoprefixer = defaultConfig.dev.styles.autoprefixer;

	const mockFiles = makeMockFiles();

	function assert( files ) {
		const file = files[ 0 ];
		const fileContents = file.contents.toString( 'utf-8' );
		expect( fileContents ).not.toContain( '-ms-grid' );
	}

	pump( [
		from.obj( mockFiles ),
		stylesAfterReplacementStream(),
		concat( assert ),
	], done );
} );
