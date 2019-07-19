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
* CSS via PostCSS + CSSNext (includes Autoprefixer by default).
* @param {function} done function to call when async processes finish
* @return {Stream} single stream
*/
export default function generateMOfiles( done ) {
	return pump( [
		src( paths.languages.poSrc ),
		gulpPlugins.potomo(),
		dest( paths.languages.moDest ),
	], done );
}
