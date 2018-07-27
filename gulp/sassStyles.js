/* eslint-env es6 */
'use strict';

// External dependencies
import {src, dest} from 'gulp';
import pump from 'pump';

// Internal dependencies
import {paths, gulpPlugins} from './constants';
import {getThemeConfig} from './utils';

/**
 * Sass, if that's being used.
 */
export default function sassStyles(done) {
    // get a fresh copy of the config
   const config = getThemeConfig(true);

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