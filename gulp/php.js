/* eslint-env es6 */
'use strict';

/**
 * External dependencies
 */
import pump from 'pump';
import { src, dest } from 'gulp';

/**
 * Internal dependencies
 */
import { paths, isProd, rootPath } from './constants.js';
import { getStringReplacementTasks, getThemeConfig } from './utils.js';

/**
 * PHP Build Task.
 * @param {function} done - Function to call when async processes finish.
 * @return {Stream} single stream
 */
export default function php(done) {
	if (isProd) {
		// Only do string replacements and save PHP files when building for production
		return pump([
			src(paths.php.src),
			getStringReplacementTasks(),
			dest(paths.php.dest),
		], done);
	}

	// In development, just pass through the files without saving
	const stream = src(paths.php.src);
	stream.on('end', done);
	stream.on('error', done);
	return stream;
}
