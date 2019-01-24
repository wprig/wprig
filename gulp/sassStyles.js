/* eslint-env es6 */
'use strict';

// External dependencies
import {src, dest} from 'gulp';
import pump from 'pump';

// Internal dependencies
import {paths, gulpPlugins, isProd} from './constants';
import {getThemeConfig, getStringReplacementTasks, logError} from './utils';

/**
 * Sass, if that's being used.
 */
export default function sassStyles(done) {
    // get a fresh copy of the config
   const config = getThemeConfig(true);

    const beforeReplacement = [
        src(paths.styles.sass, { sourcemaps: true }),
        logError('sass'),
        gulpPlugins.if(
            config.dev.debug.styles, 
            gulpPlugins.sass({outputStyle: 'nested'}),
            gulpPlugins.sass({outputStyle: 'compressed'})
        ),
        gulpPlugins.tabify(2, true),
        gulpPlugins.rename({
			suffix: '.min'
		}),
    ];

    const afterReplacement = [
		dest(paths.styles.dest, {sourcemaps: true}),
	];

    return pump(
		[].concat(
			beforeReplacement,
			// Only do string replacements when building for production
			gulpPlugins.if(
				isProd,
				getStringReplacementTasks(),
				[]
			),
			afterReplacement
		),
		done
	);
}