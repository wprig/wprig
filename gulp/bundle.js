/* eslint-env es6 */
'use strict';

// External dependencies
import {src, dest} from 'gulp';
import pump from 'pump';
import requireUncached from 'require-uncached';

// Internal dependencies
import {paths, gulpPlugins} from './constants';

/**
 * Create zip archive from generated theme files.
 */
export default function bundle(done) {
    // get a fresh copy of the config
    const config = requireUncached(paths.config.themeConfig);

	pump([
        src(paths.export.src),
        gulpPlugins.if(
            config.export.compress, 
            gulpPlugins.zip(`${config.theme.slug}.zip`), 
            dest(`${paths.export.dest}${config.theme.slug}`)
        ),
        gulpPlugins.if(
            config.export.compress, 
            dest(paths.export.dest)
        ),
    ], done);
}