/* eslint-env es6 */
'use strict';

import path from 'node:path';
import fg from 'fast-glob';
import fse from 'fs-extra';

/**
 * Expand glob patterns to a file list.
 * @param {string|string[]} patterns - Glob pattern(s). Backslashes will be normalized to forward slashes on Windows.
 * @param {Object}          [options] - fast-glob options; ignore patterns will also be normalized for Windows.
 * @return {Promise<string[]>}        - Resolved file paths matching the glob(s).
 */
export async function globFiles( patterns, options = {} ) {
	// Normalize patterns to use forward slashes for cross-platform (Windows) globbing
	const normalize = ( p ) => {
		if ( typeof p === 'string' ) {
			return p.replace( /\\/g, '/' );
		}
		return p;
	};
	const normalizedPatterns = Array.isArray( patterns )
		? patterns.map( ( p ) => normalize( p ) )
		: normalize( patterns );
	const normalizedOptions = { ...options };
	if ( Array.isArray( options.ignore ) ) {
		normalizedOptions.ignore = options.ignore.map( ( p ) =>
			p.replace( /\\/g, '/' )
		);
	} else if ( typeof options.ignore === 'string' ) {
		normalizedOptions.ignore = options.ignore.replace( /\\/g, '/' );
	}
	const list = await fg( normalizedPatterns, {
		onlyFiles: true,
		dot: false,
		caseSensitiveMatch: false,
		...normalizedOptions,
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
