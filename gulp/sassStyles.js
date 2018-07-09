/* eslint-env es6 */
'use strict';

// External dependencies
import {src, dest} from 'gulp';
import pump from 'pump';
import requireUncached from 'require-uncached';

// Internal dependencies
import {paths, gulpPlugins} from './constants';

/**
 * Sass, if that's being used.
 */
export default function sassStyles(done) {
    // get a fresh copy of the config
   const config = requireUncached(paths.config.themeConfig);

    pump([
        src(paths.styles.sass, { sourcemaps: true }),
        gulpPlugins.if(
            config.dev.debug.styles, 
            gulpPlugins.sass({outputStyle: 'nested'}).on('error', gulpPlugins.sass.logError),
            gulpPlugins.sass({outputStyle: 'compressed'}).on('error', gulpPlugins.sass.logError)
        ),
        gulpPlugins.tabify(2, true),
        dest(paths.styles.dest, {sourcemaps: true}),
    ], done);
}