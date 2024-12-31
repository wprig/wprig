/* eslint-env es6 */
'use strict';

/**
 * External dependencies
 */
import { src, dest } from 'gulp';
import pump from 'pump';
import sort from 'gulp-sort';
import wpPot from 'gulp-wp-pot';

/**
 * Internal dependencies
 */
import { paths, nameFieldDefaults, isProd } from './constants.js';
import { getThemeConfig } from './utils.js';

/**
 * Generate translation files.
 * @param {function} done function to call when async processes finish
 * @return {Stream} single stream
 */
export default function translate( done ) {
	const config = getThemeConfig();

	// Don't generate .pot file on production if the config flag is false
	if ( isProd && ! config.export.generatePotFile ) {
		return done();
	}

	pump([
		src( paths.languages.src ),
		sort(),
		wpPot({
			domain: ( isProd ) ? config.theme.slug : nameFieldDefaults.slug,
			package: ( isProd ) ? config.theme.name : nameFieldDefaults.name,
			bugReport: ( isProd ) ? config.theme.author : nameFieldDefaults.author,
			lastTranslator: ( isProd ) ? config.theme.author : nameFieldDefaults.author,
		}),
		dest( paths.languages.dest ),
	], done);
}
