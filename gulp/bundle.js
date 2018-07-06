/* eslint-env es6 */
'use strict';

// External dependencies
import {src, dest} from 'gulp';
import pump from 'pump';
import requireUncached from 'require-uncached';

// Internal dependencies
import {rootPath, paths, gulpPlugins} from './constants';

/**
 * Create zip archive from generated theme files.
 */
export default function bundle(done) {
    // get a fresh copy of the config
    const config = requireUncached(`${rootPath}/dev/config/themeConfig.js`);

	pump([
        src(paths.export.src),
        gulpPlugins.if(
            config.export.compress, 
            gulpPlugins.zip(`${config.theme.name}.zip`), 
            dest(`${paths.export.dest}${config.theme.name}`)
        ),
        gulpPlugins.if(
            config.export.compress, 
            dest(paths.export.dest)
        ),
    ], done);
}