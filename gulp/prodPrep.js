/* eslint-env es6 */
'use strict';

/**
 * External dependencies
 */
import { src, dest } from 'gulp';
import pump from 'pump';
import log from 'fancy-log';
import colors from 'ansi-colors';
import path from 'path';

/**
 * Internal dependencies
 */
import {
	isProd,
	prodThemePath,
	rootPath,
	paths,
	nameFieldDefaults,
} from './constants';
import {
	createProdDir,
	gulpRelativeDest,
	getThemeConfig,
} from './utils';

/**
 * Create the production directory
 * @param {function} done function to call when async processes finish
 * @return {Stream} single stream
 */
export default function prodPrep( done ) {
	const config = getThemeConfig( true );

	// Error if not in a production environment
	if ( ! isProd ) {
		log( colors.red( `${ colors.bold( 'Error:' ) } the bundle task may only be called from the production environment. Set NODE_ENV to production and try again.` ) );
		process.exit( 1 );
	}

	// The dev theme and the prod theme can't have the same name
	if ( path.basename( prodThemePath ) === path.basename( rootPath ) ) {
		log( colors.red( `${ colors.bold( 'Error:' ) } the theme slug cannot be the same as the dev theme directory name.` ) );
		process.exit( 1 );
	}

	const requiredConfigUpdates = [
		'slug',
		'name',
	];

	// Error if config that must be set is still the default value.
	/* eslint no-unused-vars: 0 */
	for ( const requiredConfigField of requiredConfigUpdates ) {
		if ( nameFieldDefaults[ requiredConfigField ] === config.theme[ requiredConfigField ] ) {
			log( colors.red( `${ colors.bold( 'Error:' ) } the theme ${ requiredConfigField } must be different than the default value ${ nameFieldDefaults[ requiredConfigField ] }.` ) );
			process.exit( 1 );
		}
	}

	// Create the prod directory
	createProdDir();

	// Copying misc files to the prod directory
	return pump(
		[
			src( paths.export.src, { allowEmpty: true } ),
			dest( gulpRelativeDest ),
		],
		done
	);
}
