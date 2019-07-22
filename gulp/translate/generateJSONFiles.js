/* eslint-env es6 */
'use strict';

/**
 * External dependencies
 */
import { src, dest } from 'gulp';
import fs from 'fs';
import pump from 'pump';
import map from 'map-stream';

/**
 * Internal dependencies
 */
import {
	rootPath,
	paths,
	isProd,
} from '../constants';
import {
	getThemeConfig,
} from '../utils';

export function JSONTranslationStream() {
	return map( ( data, callback ) => {

		// Create .json files from .po files
		const makeJSONCommand = isProd ? `composer wp -- i18n make-json ${ paths.languages.dir } --no-purge` : `composer wp -- i18n make-json ${ paths.languages.dir } --no-purge`;
		require( 'child_process' ).execSync(
			makeJSONCommand,
			{
				cwd: rootPath,
			}
		);

		callback();
	} );
}

/**
 * Generate translation JSON files.
 * @param {function} done function to call when async processes finish
 * @return {Stream} single stream
 */
export default function generateJSONFiles( done ) {
	const config = getThemeConfig();

	// Don't generate .pot file on production if the config flag is false
	if ( isProd && ! config.export.generateTranslationFiles ) {
		return done();
	}

	return pump( [
		src( paths.languages.src ),
		JSONTranslationStream(),
	], done );
}
