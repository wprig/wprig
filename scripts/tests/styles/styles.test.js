/* eslint-env es6 */
/* global test, expect */
/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import { pipeline } from 'node:stream/promises';
import { Readable, Transform, Writable } from 'node:stream';
import Vinyl from 'vinyl';
import fs from 'fs';

/**
 * Internal dependencies
 */
import { testPath } from '../../lib/constants';
import { getThemeConfig, getDefaultConfig } from '../../lib/utils';
import { stylesAfterReplacementStream } from '../../lib/styles';

/**
 * Helper functions to replace mississippi functionality
 */
// Create readable stream from array of objects
const fromArray = (array) => {
	return Readable.from(array, { objectMode: true });
};

// Create transform stream that collects objects and passes them to callback
const concatStream = (callback) => {
	const objects = [];
	return new Transform({
		objectMode: true,
		transform(chunk, encoding, done) {
			objects.push(chunk);
			done(null, chunk);
		},
		flush(done) {
			callback(objects);
			done();
		}
	});
};

function makeMockFiles() {
	return [
		new Vinyl( {
			path: 'mock.css',
			contents: fs.readFileSync( `${ testPath }/styles/mock.css` ),
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

	pipeline(
		fromArray(mockFiles),
		stylesAfterReplacementStream(),
		concatStream(assert)
	)
		.then(() => done())
		.catch(done);
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

	pipeline(
		fromArray(mockFiles),
		stylesAfterReplacementStream(),
		concatStream(assert)
	)
		.then(() => done())
		.catch(done);
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

	pipeline(
		fromArray(mockFiles),
		stylesAfterReplacementStream(),
		concatStream(assert)
	)
		.then(() => done())
		.catch(done);
} );

test( 'custom media is processed', ( done ) => {
	const mockFiles = makeMockFiles();

	const config = getThemeConfig();
	// Force minification of CSS.
	config.dev.debug.styles = false;

	function assert( files ) {
		const file = files[ 0 ];
		const fileContents = file.contents.toString( 'utf-8' );
		expect( fileContents ).toContain(
			'@media screen and (min-width:48em)'
		);
	}

	pipeline(
		fromArray(mockFiles),
		stylesAfterReplacementStream(),
		concatStream(assert)
	)
		.then(() => done())
		.catch(done);
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

	pipeline(
		fromArray(mockFiles),
		stylesAfterReplacementStream(),
		concatStream(assert)
	)
		.then(() => done())
		.catch(done);
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

	pipeline(
		fromArray(mockFiles),
		stylesAfterReplacementStream(),
		concatStream(assert)
	)
		.then(() => done())
		.catch(done);
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

	pipeline(
		fromArray(mockFiles),
		stylesAfterReplacementStream(),
		concatStream(assert)
	)
		.then(() => done())
		.catch(done);
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

	pipeline(
		fromArray(mockFiles),
		stylesAfterReplacementStream(),
		concatStream(assert)
	)
		.then(() => done())
		.catch(done);
} );
