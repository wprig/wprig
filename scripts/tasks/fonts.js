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
		const pattern = paths.fonts.src;
		const baseDir = path.resolve( pattern.replace( /\*\*\/\*.*$/, '' ) );
		const files = await fg( pattern, { onlyFiles: true, dot: false } );
		await Promise.all(
			files.map( async ( srcFile ) => {
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
