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
import { paths } from './constants';

/**
 * Copy the fonts folder from wp-rig to the production theme
 * @param {function} done function to call when async processes finish
 * @return {Stream} single stream
 */
export default function fonts( done ) {
	return pump( [
		src( paths.fonts.src ),
		dest( paths.fonts.dest ),
	], done );
}
