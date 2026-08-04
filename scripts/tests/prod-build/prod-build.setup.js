/* eslint-env es6 */
'use strict';

/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';

/**
 * Internal dependencies
 */
import { filesToMock } from './prod-build.utils.js';

// Copy the mock files to their destination before testing.
filesToMock.forEach( ( file ) => {
	// Check if the file already exists
	const fileExists = fs.existsSync( file.dest );
	if ( fileExists ) {
		// If it does, rename the file adding an -existing suffix
		const existingFile = file.dest.replace( /(\.[\w-]+)$/i, '-existing$1' );
		fs.renameSync( file.dest, existingFile );
	}

	// Copy the mock file to the desired location
	const filePath = path.dirname( file.dest );
	if (!fs.existsSync(filePath)) {
		fs.mkdirSync(filePath, { recursive: true });
	}
	fs.copyFileSync( file.mock, file.dest );
} );
