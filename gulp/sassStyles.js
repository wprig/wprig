/* eslint-env es6 */
'use strict';

// External dependencies
import {src, dest} from 'gulp';
import pump from 'pump';
import requireUncached from 'require-uncached';

// Internal dependencies
import {rootPath, paths, gulpPlugins} from './constants';

/**
 * Sass, if that's being used.
 */
export default function sassStyles(done) {
    // get a fresh copy of the config
    const config = requireUncached(`${rootPath}/dev/config/themeConfig.js`);

    pump([
        src(paths.styles.sass, { base: `${rootPath}/` }),
        gulpPlugins.sourcemaps.init(),
        gulpPlugins.sass().on('error', gulpPlugins.sass.logError),
        gulpPlugins.tabify(2, true),
        gulpPlugins.sourcemaps.write(`${rootPath}/maps`),
        dest('.'),
    ], done);
}