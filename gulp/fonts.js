/* eslint-env es6 */
'use strict';

import fs from 'fs';
import path from 'path';
/**
 * Internal dependencies
 */
import { paths } from './constants.js';

/**
 * Copy the fonts folder from wp-rig to the production theme
 * @param {Function} done function to call when async processes finish
 */

export default function fonts( done ) {
	try {
		// Define source and destination explicitly
		const fontSrcBase = path.resolve(
			paths.fonts.src.replace( /\*\*\/\*.*$/, '' )
		);
		const fontSrcPattern = paths.fonts.src;
		const fontDestDir = paths.fonts.dest;

		// Find all font files using Node.js built-in fs.glob (Node 20+)
		const fontFiles = fs.globSync( fontSrcPattern );

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
