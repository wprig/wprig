/* eslint-env es6 */
'use strict';

/**
 * External dependencies
 */
import fs from 'fs';
import rimraf from 'rimraf';

/**
 * Internal dependencies
 */
import { filesToMock } from './prod-build.utils';
import {
	prodThemePath,
	paths,
} from '../../constants';

// Delete the mock files after testing.
filesToMock.forEach( ( file ) => {
	if ( fs.existsSync( file.dest ) ) {
		fs.unlinkSync( file.dest );
	}
} );

// Delete the dev .pot file
if ( fs.existsSync( paths.languages.potSrc ) ) {
	fs.unlinkSync( paths.languages.potSrc );
}

// Delete the prod theme directory after testing.
if ( fs.existsSync( prodThemePath ) ) {
	rimraf.sync( prodThemePath );
}
