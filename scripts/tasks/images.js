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

	try {
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
	} catch ( err ) {
		console.warn(
			`Sharp couldn't process ${ srcFile }. Falling back to direct copy.`
		);
		// If Sharp fails for any reason, fall back to copying
		await fse.copy( srcFile, destFile, { overwrite: true } );
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
	// Normalize patterns for cross-platform globbing (Windows)
	const normalizedPatterns = patterns.map( ( p ) => p.replace( /\\/g, '/' ) );
	const files = await fg( normalizedPatterns, {
		caseSensitiveMatch: false,
		dot: false,
		onlyFiles: true,
	} );

	for ( const file of files ) {
		const osFile = path.normalize( file );
		const dest = destPathFor( osFile );
		if ( ! ( await isNewer( osFile, dest ) ) ) {
			continue;
		}
		const ext = path.extname( osFile );
		try {
			if ( isSVG( ext ) ) {
				await optimizeSVG( osFile, dest );
			} else if ( isRaster( ext ) ) {
				await optimizeRaster( osFile, dest );
			} else {
				// Fallback: copy as-is
				await fse.ensureDir( path.dirname( dest ) );
				await fse.copy( osFile, dest, { overwrite: true } );
			}
		} catch ( err ) {
			console.error( `Failed to optimize: ${ osFile }`, err );
		}
	}
}

/**
 * Converts JPEG/PNG sources to the modern raster formats the 7.1 pipeline
 * ships: WebP (universal) plus AVIF (HEIF-encapsulated AV1, the 7.1-era
 * default). AVIF emits through sharp's `heif({ compression: 'av1' })` codec —
 * verified on sharp 0.35.x / libvips 8.18. Builds whose libheif lacks the AV1
 * encoder degrade gracefully (AVIF is skipped, WebP still ships).
 *
 * HEIC/HEVC is intentionally NOT a target: the shipped sharp build has no HEVC
 * encoder ("heifsave: Unsupported compression"), HEIC is Safari-ecosystem-only
 * and patent-encumbered, and AVIF supersedes it on the open web. HDR AVIF
 * (10-bit) is container-supported (`bitdepth: 10`) but requires 10/16-bit
 * source imagery; the standard pipeline optimizes SDR masters.
 */
export async function convertToModernFormats() {
	const srcRoot = getSrcRoot();
	const patterns = [ paths.images.src ];
	// Normalize patterns for cross-platform globbing (Windows)
	const normalizedPatterns = patterns.map( ( p ) => p.replace( /\\/g, '/' ) );
	const files = await fg( normalizedPatterns, {
		caseSensitiveMatch: false,
		dot: false,
		onlyFiles: true,
	} );

	for ( const file of files ) {
		const osFile = path.normalize( file );
		const ext = path.extname( osFile ).toLowerCase();
		if ( ! [ '.jpg', '.jpeg', '.png' ].includes( ext ) ) {
			continue; // Skip non-convertible types here
		}
		const rel = path.relative( srcRoot, osFile );
		const baseDest = path.join( getDestRoot(), rel );

		await convertFormat( osFile, baseDest, 'webp', ( img ) =>
			img.webp( { quality: 75 } )
		);
		await convertFormat( osFile, baseDest, 'avif', ( img ) =>
			img.heif( { compression: 'av1', quality: 70, effort: 4 } )
		);
	}
}

/**
 * Encodes `srcFile` to `format`, writing alongside `baseDest` (same basename,
 * new extension). Returns silently when sharp cannot encode the format on the
 * host (e.g. an AVIF-less libheif) so one missing codec never breaks the build.
 *
 * @param {string}   srcFile  Absolute path to the source image.
 * @param {string}   baseDest Destination path including the original extension.
 * @param {string}   format   Target extension without the leading dot (webp/avif).
 * @param {Function} encode   Sharp format encoder: `(img) => img.format(...)`.
 */
async function convertFormat( srcFile, baseDest, format, encode ) {
	const destFile = baseDest.replace( /\.[^.]+$/i, `.${ format }` );
	if ( ! ( await isNewer( srcFile, destFile ) ) ) {
		return;
	}
	try {
		await fse.ensureDir( path.dirname( destFile ) );
		await encode( sharp( srcFile, { sequentialRead: true } ) ).toFile(
			destFile
		);
	} catch ( err ) {
		console.warn(
			`Failed to convert to ${ format.toUpperCase() }: ${ path.basename(
				srcFile
			) }. Skipping this file.`,
			err.message
		);
		// Continue with next file - don't let this error stop the process
	}
}

/** @deprecated Use {@link convertToModernFormats} (WebP + AVIF). */
export async function convertToWebP() {
	await convertToModernFormats();
}
