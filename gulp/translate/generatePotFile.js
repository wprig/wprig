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
	gulpPlugins,
	nameFieldDefaults,
} from '../constants';
import {
	getThemeConfig,
	getStringReplacementTasks,
} from '../utils';

function WPCLIgeneratePotFile() {
	// Delete any existing .pot file
	if ( fs.existsSync( paths.languages.potDest ) ) {
		fs.unlinkSync(
			paths.languages.potDest,
			( err ) => {
				if ( err ) {
					throw err;
				}
			}
		);
	}

	// Create the .pot file
	const makePotCommand = `composer wp -- i18n make-pot ${ rootPath } ${ rootPath }/languages/${ nameFieldDefaults.slug }.pot --exclude=${ paths.languages.exclude }`;
	require( 'child_process' ).execSync(
		makePotCommand,
		{
			cwd: rootPath,
		}
	);
}

export function PotTranslationStream() {
	return map( ( data, callback ) => {
		WPCLIgeneratePotFile();

		callback();
	} );
}

/**
 * Generate translation POT file.
 * @param {function} done function to call when async processes finish
 * @return {Stream} single stream
 */
export default function generatePotFile( done ) {
	const config = getThemeConfig();

	if ( isProd ) {
		// Don't generate .pot file on production if the config flag is false
		if ( ! config.export.generatePotFile && ! config.export.generateTranslationFiles ) {
			return done();
		}

		WPCLIgeneratePotFile();

		// Only do string replacements and save files when building for production
		return pump( [
			src( paths.languages.potSrc ),
			getStringReplacementTasks(),
			gulpPlugins.rename({
				basename: config.theme.slug
			}),
			dest( paths.languages.dir ),
		], done );
	}

	return pump( [
		src( paths.languages.src ),
		PotTranslationStream(),
	], done );
}
