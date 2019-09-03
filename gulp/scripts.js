/* eslint-env es6 */
'use strict';

// External dependencies
/**
 * External dependencies
 */
import { src, dest } from 'gulp';
import pump from 'pump';
import { pipeline } from 'mississippi';

/**
 * Internal dependencies
 */
import { paths, gulpPlugins, isProd } from './constants';
import { getThemeConfig, getStringReplacementTasks, logError } from './utils';

export function scriptsBeforeReplacementStream() {
	// Return a single stream containing all the
	// before replacement functionality
	return pipeline.obj( [
		logError( 'JavaScript' ),
		gulpPlugins.newer( {
			dest: paths.scripts.dest,
			extra: [ paths.config.themeConfig ],
		} ),
		gulpPlugins.eslint(),
		gulpPlugins.eslint.format(),
	] );
}

export function scriptsAfterReplacementStream() {
	const config = getThemeConfig();

	// Return a single stream containing all the
	// after replacement functionality
	return pipeline.obj( [
		gulpPlugins.babel( {
			presets: [
				'@babel/preset-env',
			],
		} ),
		gulpPlugins.if(
			! config.dev.debug.scripts,
			gulpPlugins.uglify()
		),
		gulpPlugins.rename( {
			suffix: '.min',
		} ),
	] );
}

/**
 * JavaScript via Babel, ESlint, and uglify.
 * @param {function} done function to call when async processes finish
 * @return {Stream} single stream
 */
export default function scripts( done ) {
	return pump( [
		src( paths.scripts.src, { sourcemaps: ! isProd } ),
		scriptsBeforeReplacementStream(),
		// Only do string replacements when building for production
		gulpPlugins.if(
			isProd,
			getStringReplacementTasks()
		),
		scriptsAfterReplacementStream(),
		dest( paths.scripts.dest, { sourcemaps: ! isProd } ),
	], done );
}
