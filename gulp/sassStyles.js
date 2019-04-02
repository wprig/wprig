/* eslint-env es6 */
'use strict';

// External dependencies
import {src, dest} from 'gulp';
import pump from 'pump';
import { pipeline } from 'mississippi';

// Internal dependencies
import {paths, gulpPlugins, isProd} from './constants';
import {getThemeConfig, getStringReplacementTasks, logError} from './utils';

export function sassBeforeReplacementStream() {
	// We only have one item, so  no need to combine streams
	return logError('sass');
}

export function sassAfterReplacementStream() {
	const config = getThemeConfig();

	// Return a single stream containing all the
	// after replacement functionality
	return pipeline.obj([
		gulpPlugins.if(
            config.dev.debug.styles,
            gulpPlugins.sass({outputStyle: 'expanded'}),
            gulpPlugins.sass({outputStyle: 'compressed'})
        ),
        gulpPlugins.if(
            config.dev.debug.styles,
            gulpPlugins.tabify(2, true)
        ),
        gulpPlugins.rename({
			suffix: '.min'
		}),
	]);
}

/**
 * Sass, if that's being used.
 */
export default function sassStyles(done) {
    return pump([
		src(paths.styles.sass, {sourcemaps: !isProd}),
		sassBeforeReplacementStream(),
		// Only do string replacements when building for production
		gulpPlugins.if(
			isProd,
			getStringReplacementTasks()
		),
		sassAfterReplacementStream(),
		dest(paths.styles.dest, {sourcemaps: !isProd}),
	], done);
}