/* eslint-env es6 */
'use strict';

/**
 * External dependencies
 */
import { src, dest } from 'gulp';
import pump from 'pump';

/**
 * Internal dependencies
 */
import { paths } from './constants.js';
import gulpImagemin from 'gulp-imagemin';
import gulpNewer from 'gulp-newer';
import webp from 'gulp-webp';

/**
 * Optimize images.
 * @param {Function} done function to call when async processes finish
 * @return {Stream} single stream
 */
export function images(done) {
	return pump(
		[
			src(paths.images.src),
			gulpNewer(paths.images.dest),
			gulpImagemin(),
			dest(paths.images.dest),
		],
		done
	);
}

/**
 * Convert images to webp.
 * @param {Function} done function to call when async processes finish
 * @return {Stream} single stream
 */
export function convertToWebP(done) {
	return pump(
		[
			src(paths.images.src),
			gulpNewer(paths.images.dest),
			webp(),
			dest(paths.images.dest),
		],
		done
	);
}
