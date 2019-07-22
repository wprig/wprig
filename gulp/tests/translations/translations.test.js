/* eslint-env es6 */
/* global test, expect */

/**
 * External dependencies
 */
import {
	pipe as pump,
	from,
	concat
} from 'mississippi';
import Vinyl from 'vinyl';
import fs from 'fs';

/**
 * Internal dependencies
 */
import {
	paths,
	gulpTestPath
} from '../../constants';

import {
	PotTranslationStream,
} from '../../translate/generatePotFile';

function makeMockFiles() {
	return [
		new Vinyl( {
			path: 'mock.css',
			contents: fs.readFileSync( `${ gulpTestPath }/translations/editor-filters.js` ),
		} ),
	];
}

test( 'pot file generation', ( done ) => {
	const mockFiles = makeMockFiles();

	function assert() {
		const filePath = paths.languages.potDest;
		// Test that the .pot file exists
		const potFileExists = fs.existsSync( filePath );
		let failMessage = `The expected .pot file ${ filePath } does not exist`;
		expect( potFileExists, failMessage ).toBe( true );

		const fileContents = fs.readFileSync(
			filePath,
			{ encoding: 'utf-8' }
		);

		// Test that the .pot file contains .php translations
		failMessage = `The .pot file ${ filePath } does not contain any .php translations`;
		expect( fileContents, failMessage ).toContain( '.php' );
		
		// Test that the .pot file contains .js translations
		/**
		 * WP Rig doesn't have any translatable strings in JS.
		 * Once there are some, we can run this test.
		 * failMessage = `The .pot file ${ filePath } does not contain any .js translations`;
		 * expect( fileContents, failMessage ).toContain( '.js' );
		*/
	}

	pump( [
		from.obj( mockFiles ),
		PotTranslationStream(),
		concat( assert ),
	], done );
} );
