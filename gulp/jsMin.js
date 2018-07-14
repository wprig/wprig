/* eslint-env es6 */
'use strict';

// External dependencies
import {src, dest} from 'gulp';
import pump from 'pump';

// Internal dependencies
import {paths, gulpPlugins} from './constants';

/**
 * Copy minified JS files without touching them.
 */
export default function jsMin(done) {
	pump([
        src(paths.scripts.min),
        gulpPlugins.newer(paths.scripts.dest),
        dest(paths.verbose),
        dest(paths.scripts.dest),
    ], done);
}