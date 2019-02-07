/* eslint-env es6 */
'use strict';

// External dependencies
import {src, dest} from 'gulp';
import pump from 'pump';

// Internal dependencies
import {paths, gulpPlugins} from './constants';

/**
 * Optimize images.
 */
export default function images(done) {
    pump([
        src(paths.images.src),
        gulpPlugins.newer(paths.images.dest),
        gulpPlugins.imagemin(),
        dest(paths.images.dest),
    ], done);
}

/**
 * Copy the screenshot.
 */
export function screenshot(done) {
    pump([
        src(paths.screenshot.src),
        dest(paths.screenshot.dest),
    ], done);
}
