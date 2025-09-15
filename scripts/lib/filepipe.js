/* eslint-env es6 */
'use strict';

import path from 'node:path';
import fg from 'fast-glob';
import fse from 'fs-extra';

/**
 * Expand glob patterns to a file list.
 * @param {string|string[]} patterns
 * @param {Object}          [options]
 * @return {Promise<string[]>}
 */
export async function globFiles( patterns, options = {} ) {
	const list = await fg( patterns, {
		onlyFiles: true,
		dot: false,
		caseSensitiveMatch: false,
		...options,
	} );
	return list;
}

/**
 * Compute destination path preserving relative path from baseDir.
 * @param {string} srcFile
 * @param {string} baseDir
 * @param {string} destRoot
 */
export function destPathFor( srcFile, baseDir, destRoot ) {
	const rel = path.relative( baseDir, srcFile );
	return path.join( destRoot, rel );
}

/**
 * Ensure directory and write a file (string or Buffer)
 * @param {string}        filePath
 * @param {string|Buffer} data
 * @param {string}        [encoding]
 */
export async function writeFileEnsured( filePath, data, encoding ) {
	await fse.ensureDir( path.dirname( filePath ) );
	if ( Buffer.isBuffer( data ) ) {
		await fse.writeFile( filePath, data );
	} else {
		await fse.writeFile( filePath, data, encoding || 'utf8' );
	}
}
