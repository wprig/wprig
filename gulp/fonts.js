/* eslint-env es6 */
'use strict';

import fs from 'fs';
import path from 'path';
import glob from 'glob';
/**
 * Internal dependencies
 */
import { paths } from './constants.js';

/**
 * Copy the fonts folder from wp-rig to the production theme
 * @param {Function} done function to call when async processes finish
 * @return {Stream} single stream or undefined if fonts directory does not exist
 */

// The below works perfectly

export default function fonts( done ) {
	try {
		// Define source and destination explicitly
		const fontSrcBase = path.resolve(
			paths.fonts.src.replace( /\*\*\/\*.*$/, '' )
		);
		const fontSrcPattern = paths.fonts.src;
		const fontDestDir = paths.fonts.dest;

		// Find all font files
		const fontFiles = glob.sync( fontSrcPattern );

		// Count successful copies
		let successCount = 0;

		fontFiles.forEach( ( srcFile ) => {
			// Calculate the relative path to maintain directory structure
			const relativePath = path.relative( fontSrcBase, srcFile );
			const destFile = path.join( fontDestDir, relativePath );

			// Ensure destination directory exists
			const destDir = path.dirname( destFile );
			if ( ! fs.existsSync( destDir ) ) {
				fs.mkdirSync( destDir, { recursive: true } );
			}

			try {
				// Read directly as binary buffer
				const buffer = fs.readFileSync( srcFile );

				// Write directly as binary buffer
				fs.writeFileSync( destFile, buffer );

				// Verify file sizes match
				const srcSize = fs.statSync( srcFile ).size;
				const destSize = fs.statSync( destFile ).size;

				if ( srcSize === destSize ) {
					successCount++;
				}
			} catch ( err ) {
				console.error( `Error copying ${ srcFile }: ${ err.message }` );
			}
		} );
		done();
	} catch ( err ) {
		console.error( 'Error in font copying process:', err );
		done( err );
	}
}
