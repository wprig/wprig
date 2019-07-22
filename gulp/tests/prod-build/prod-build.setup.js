/* eslint-env es6 */
'use strict';

/**
 * External dependencies
 */
import fs from 'fs';

/**
 * Internal dependencies
 */
import { filesToMock } from './prod-build.utils';

// Copy the mock files to their destination before testing.
filesToMock.forEach( ( file ) => {
	fs.copyFileSync( file.mock, file.dest );
} );
