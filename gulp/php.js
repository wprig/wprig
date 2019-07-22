/* eslint-env es6 */
'use strict';

/**
 * External dependencies
 */
import pump from 'pump';
import { src, dest } from 'gulp';
import { pipeline } from 'mississippi';

/**
 * Internal dependencies
 */
import { paths, PHPCSOptions, gulpPlugins, isProd } from './constants';
import { getStringReplacementTasks, getThemeConfig } from './utils';

export function phpBeforeReplacementStream() {
	const config = getThemeConfig();

	// Return a single stream containing all the
	// before replacement functionality
	return pipeline.obj( [
		// Only code sniff PHP files if the debug setting is true
		gulpPlugins.if(
			config.dev.debug.phpcs,
			gulpPlugins.phpcs( PHPCSOptions )
		),
		// Log all problems that were found.
		gulpPlugins.phpcs.reporter( 'log' ),
	] );
}

/**
 * PHP via PHP Code Sniffer.
 * @param {function} done function to call when async processes finish
 * @return {Stream} single stream
 */
export default function php( done ) {
	if ( isProd ) {
		// Only do string replacements and save PHP files when building for production
		return pump( [
			src( paths.php.src ),
			phpBeforeReplacementStream(),
			getStringReplacementTasks(),
			dest( paths.php.dest ),
		], done );
	}

	// Only run code sniffing in dev, don't save PHP files
	return pump( [
		src( paths.php.src ),
		phpBeforeReplacementStream(),
	], done );
}
