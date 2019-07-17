/* eslint-env es6 */
/* global test, expect */

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
import {
	gulpTestPath,
	paths,
} from '../../constants';
import {
	translationStream,
} from '../../translate';

function makeMockFiles() {
	return [
		new Vinyl( {
			path: 'languages/fr_FR.po',
			contents: fs.readFileSync( `${ gulpTestPath }/translations/fr_FR.po` ),
		} ),
		new Vinyl( {
			path: 'languages/fr_FR.mo',
			contents: fs.readFileSync( `${ gulpTestPath }/translations/fr_FR.mo` ),
		} ),
	];
}

test( 'pot file generation', ( done ) => {
	const mockFiles = makeMockFiles();

	function assert() {
		const potFileExists = fs.existsSync( paths.languages.dest );
		expect( potFileExists ).toBe( true );
	}

	pump( [
		from.obj( mockFiles ),
		translationStream(),
		concat( assert ),
	], done );
} );
