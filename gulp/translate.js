/* eslint-env es6 */
'use strict';

// External dependencies
import {src, dest} from 'gulp';
import pump from 'pump';
import requireUncached from 'require-uncached';

// Internal dependencies
import {rootPath, paths, gulpPlugins} from './constants';

/**
 * Generate translation files.
 */
export default function translate(done) {
    // Get a fresh copy of the config
    const config = requireUncached(`${rootPath}/dev/config/themeConfig.js`);

	pump([
        src(paths.languages.src),
        gulpPlugins.sort(),
        gulpPlugins.wpPot({
            domain: config.theme.name,
            package: config.theme.name,
            bugReport: config.theme.name,
            lastTranslator: config.theme.author
        }),
        dest(paths.languages.dest),
    ], done);
}