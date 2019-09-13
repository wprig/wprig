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
import { paths, gulpPlugins } from './constants';

/**
 * Optimize images.
 * @param {function} done function to call when async processes finish
 * @return {Stream} single stream
 */
export default function images( done ) {
	return pump( [
		src( paths.images.src ),
		gulpPlugins.newer( paths.images.dest ),
		gulpPlugins.imagemin(),
		dest( paths.images.dest ),
	], done );
}
