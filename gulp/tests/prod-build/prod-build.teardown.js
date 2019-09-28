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
	// Delete the mock file
	if ( fs.existsSync( file.dest ) ) {
		fs.unlinkSync( file.dest );
	}

	// Check if a previous version of the file exists
	const existingFile = file.dest.replace( /(\.[\w-]+)$/i, '-existing$1' );
	const existingFileExists = fs.existsSync( existingFile );
	if ( existingFileExists ) {
		// If it does, rename it back to the original file name
		fs.renameSync( existingFile, file.dest );
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
