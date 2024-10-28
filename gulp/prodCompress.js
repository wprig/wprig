/* eslint-env es6 */
'use strict';

/**
 * External dependencies
 */
import { src, dest } from 'gulp';
import pump from 'pump';
import path from 'path';
import zip from 'gulp-zip';

/**
 * Internal dependencies
 */
import { prodThemePath } from './constants.js';
import { getThemeConfig } from './utils.js';

/**
 * Create the zip file
 * @param {function} done function to call when async processes finish
 * @return {Stream} single stream
 */
export default function prodCompress( done ) {
	const config = getThemeConfig();

	// Bail if the compress option is false
	if ( ! config.export.compress ) {
		return done();
	}

	return pump(
		[
			src( `${ prodThemePath }/**/*` ),
			zip( `${ config.theme.slug }.zip` ),
			dest( path.normalize( `${ prodThemePath }/../` ) ),
		],
		done
	);
}
