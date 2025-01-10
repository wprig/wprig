/* eslint-env es6 */
'use strict';

/**
 * External dependencies
 */
import { src, dest } from 'gulp';

/**
 * Internal dependencies
 */
import { paths } from './constants.js';
import imagemin from 'imagemin';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminPngquant from 'imagemin-pngquant';
import imageminWebp from 'imagemin-webp';
import imageminSvgo from 'imagemin-svgo';
import gulpNewer from 'gulp-newer';
import path from 'path';

/**
 * Optimize images.
 * @param {Function} done function to call when async processes finish
 * @return {Stream} single stream
 */
/**
 * Optimize images using imagemin.
 * @return {Promise} Resolves when all images are optimized
 */
export async function images() {
	const newerImages = src( paths.images.src ).pipe(
		gulpNewer( paths.images.dest )
	);

	newerImages.on( 'data', async ( file ) => {
		try {
			await imagemin( [ file.path ], {
				destination: paths.images.dest,
				plugins: [
					imageminMozjpeg( { quality: 75 } ), // Optimize JPEGs
					imageminPngquant( { quality: [ 0.6, 0.8 ] } ), // Optimize PNGs
					imageminSvgo( { removeViewBox: false } ), // Optimize SVGs
				],
			} );
		} catch ( err ) {
			console.error( `Failed to optimize: ${ file.path }`, err );
		}
	} );

	return newerImages;
}

/**
 * Convert images to webp using gulp-webp.
 * @param {Function} done Function to indicate task completion
 * @return {Stream} Returns a stream for Gulp
 */
export async function convertToWebP( done ) {
	// Use gulp-newer to filter out already processed images
	src( paths.images.src )
		.pipe( gulpNewer( paths.images.dest ) ) // Skip already processed images
		.on( 'data', async ( file ) => {
			try {
				// Process the file using imagemin and the WebP plugin
				await imagemin(
					[ file.path ], // Source file
					{
						destination: paths.images.dest, // Destination folder
						plugins: [
							imageminWebp( {
								quality: 75, // Quality for WebP conversion
							} ),
						],
					}
				);
			} catch ( err ) {
				console.error(
					`Failed to convert to WebP: ${ path.basename(
						file.path
					) }`,
					err
				);
			}
		} )
		.on( 'end', done ); // Call done when stream ends
}
