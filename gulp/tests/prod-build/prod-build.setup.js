/* eslint-env es6 */
'use strict';

/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';

/**
 * Internal dependencies
 */
import { filesToMock } from './prod-build.utils';

// Copy the mock files to their destination before testing.
filesToMock.forEach( ( file ) => {
	const filePath = path.dirname( file.dest );
	mkdirp( filePath );
	fs.copyFileSync( file.mock, file.dest );
} );
