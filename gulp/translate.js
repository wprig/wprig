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
} from './constants';
import {
	getThemeConfig,
	getStringReplacementTasks,
} from './utils';

export function translationStream() {
	return map( ( data, callback ) => {
		if ( fs.existsSync( paths.languages.dest ) ) {
			fs.unlinkSync(
				paths.languages.dest,
				( err ) => {
					if ( err ) {
						throw err;
					}
				}
			);
		}

		// Create the .pot file
		const makePotCommand = `composer wp -- i18n make-pot ${ paths.languages.src } ${ paths.languages.dest } --exclude=${ paths.languages.exclude }`;
		require( 'child_process' ).execSync(
			makePotCommand,
			{
				cwd: rootPath,
			}
		);

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
 * Generate translation files.
 * @param {function} done function to call when async processes finish
 * @return {Stream} single stream
 */
export default function translate( done ) {
	const config = getThemeConfig();

	if ( isProd ) {
		// Don't generate .pot file on production if the config flag is false
		if ( ! config.export.generatePotFile ) {
			return done();
		}

		// Only do string replacements and save files when building for production
		return pump( [
			src( paths.languages.src ),
			translationStream(),
			getStringReplacementTasks(),
			dest( paths.languages.dest ),
		], done );
	}

	return pump( [
		src( paths.languages.src ),
		translationStream(),
	], done );
}
