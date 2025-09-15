/* eslint-env es6 */
'use strict';

import path from 'node:path';
import fse from 'fs-extra';
import fg from 'fast-glob';
import sharp from 'sharp';
import { optimize as svgoOptimize } from 'svgo';

// Reuse theme paths from existing constants (no gulp needed)
import { paths, assetsDir } from '../lib/constants.js';

function getSrcRoot() {
	// Our images source lives at `${assetsDir}/images/src`
	return path.join( assetsDir, 'images', 'src' );
}

function getDestRoot() {
	return paths.images.dest.endsWith( '/' )
		? paths.images.dest.slice( 0, -1 )
		: paths.images.dest;
}

function destPathFor( srcFile ) {
	const srcRoot = getSrcRoot();
	const destRoot = getDestRoot();
	const rel = path.relative( srcRoot, srcFile );
	return path.join( destRoot, rel );
}

async function isNewer( src, dest ) {
	try {
		const [ s, d ] = await Promise.all( [
			fse.stat( src ),
			fse.stat( dest ),
		] );
		return s.mtimeMs > d.mtimeMs;
	} catch ( e ) {
		// If dest missing, treat as newer
		if ( e && e.code === 'ENOENT' ) {
			return true;
		}
		// On other errors, process to be safe
		return true;
	}
}

function isRaster( ext ) {
	return [
		'.jpg',
		'.jpeg',
		'.png',
		'.gif',
		'.JPG',
		'.JPEG',
		'.PNG',
		'.GIF',
	].includes( ext );
}

function isSVG( ext ) {
	return ext.toLowerCase() === '.svg';
}

async function optimizeRaster( srcFile, destFile ) {
	const ext = path.extname( srcFile ).toLowerCase();
	await fse.ensureDir( path.dirname( destFile ) );

	// Configure sharp pipeline
	let img = sharp( srcFile, { sequentialRead: true } );
	// Respect EXIF orientation and strip metadata by default
	img = img.rotate();

	if ( ext === '.jpg' || ext === '.jpeg' ) {
		await img
			.jpeg( { quality: 75, mozjpeg: true, progressive: true } )
			.toFile( destFile );
		return;
	}

	if ( ext === '.png' ) {
		await img
			.png( {
				quality: 80,
				compressionLevel: 9,
				adaptiveFiltering: true,
			} )
			.toFile( destFile );
		return;
	}

	// For GIFs, sharp cannot write GIF; copy through unchanged (keep behavior parity)
	await fse.copy( srcFile, destFile, { overwrite: true } );
}

async function optimizeSVG( srcFile, destFile ) {
	const code = await fse.readFile( srcFile, 'utf8' );
	const result = svgoOptimize( code, {
		multipass: true,
		plugins: [
			{
				name: 'preset-default',
				params: { overrides: { removeViewBox: false } },
			},
		],
	} );
	await fse.ensureDir( path.dirname( destFile ) );
	await fse.writeFile( destFile, result.data, 'utf8' );
}

export async function images() {
	const patterns = [ paths.images.src ];
	const files = await fg( patterns, {
		caseSensitiveMatch: false,
		dot: false,
		onlyFiles: true,
	} );

	for ( const file of files ) {
		const dest = destPathFor( file );
		if ( ! ( await isNewer( file, dest ) ) ) {
			continue;
		}
		const ext = path.extname( file );
		try {
			if ( isSVG( ext ) ) {
				await optimizeSVG( file, dest );
			} else if ( isRaster( ext ) ) {
				await optimizeRaster( file, dest );
			} else {
				// Fallback: copy as-is
				await fse.ensureDir( path.dirname( dest ) );
				await fse.copy( file, dest, { overwrite: true } );
			}
		} catch ( err ) {
			console.error( `Failed to optimize: ${ file }`, err );
		}
	}
}

export async function convertToWebP() {
	const srcRoot = getSrcRoot();
	const patterns = [ paths.images.src ];
	const files = await fg( patterns, {
		caseSensitiveMatch: false,
		dot: false,
		onlyFiles: true,
	} );

	for ( const file of files ) {
		const ext = path.extname( file ).toLowerCase();
		if ( ! [ '.jpg', '.jpeg', '.png' ].includes( ext ) ) {
			continue; // Skip non-webp convertible types here
		}
		const rel = path.relative( srcRoot, file );
		const destFile = path
			.join( getDestRoot(), rel )
			.replace( /\.[^.]+$/i, '.webp' );
		if ( ! ( await isNewer( file, destFile ) ) ) {
			continue;
		}
		try {
			await fse.ensureDir( path.dirname( destFile ) );
			await sharp( file, { sequentialRead: true } )
				.webp( { quality: 75 } )
				.toFile( destFile );
		} catch ( err ) {
			console.error(
				`Failed to convert to WebP: ${ path.basename( file ) }`,
				err
			);
		}
	}
}
