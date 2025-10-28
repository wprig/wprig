/* eslint-env es6 */
'use strict';

import path from 'node:path';
import fg from 'fast-glob';
import fse from 'fs-extra';
import { paths } from '../lib/constants.js';

/**
 * Copy font files from assets to destination, preserving structure.
 * @param {Function} done callback when finished
 */
export default async function fonts( done ) {
	try {
		// Normalize glob pattern for cross-platform globbing (Windows)
		const pattern = paths.fonts.src.replace( /\\/g, '/' );
		// Derive base directory from the glob pattern (strip /**/… part)
		const baseFromPattern = pattern.replace( /\*\*\/\*.*$/, '' );
		const baseDir = path.resolve( baseFromPattern );
		const files = await fg( pattern, { onlyFiles: true, dot: false } );
		await Promise.all(
			files.map( async ( srcFilePosix ) => {
				const srcFile = path.normalize( srcFilePosix );
				const rel = path.relative( baseDir, srcFile );
				const destFile = path.join( paths.fonts.dest, rel );
				await fse.ensureDir( path.dirname( destFile ) );
				await fse.copy( srcFile, destFile, { overwrite: true } );
			} )
		);
		return done();
	} catch ( e ) {
		return done( e );
	}
}
