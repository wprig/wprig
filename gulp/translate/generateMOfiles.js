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
import {
	paths,
	gulpPlugins,
	isProd
} from '../constants';
import {
	getThemeConfig,
} from '../utils';

/**
* Generate .mo files from .po files.
* @param {function} done function to call when async processes finish
* @return {Stream} single stream
*/
export default function generateMOFiles( done ) {
	const config = getThemeConfig();

	// Don't generate .pot file on production if the config flag is false
	if ( isProd && ! config.export.generateTranslationFiles ) {
		return done();
	}

	return pump( [
		src( paths.languages.poSrc ),
		gulpPlugins.potomo(),
		dest( paths.languages.moDest ),
	], done );
}
