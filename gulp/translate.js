/* eslint-env es6 */
'use strict';

// External dependencies
import {src, dest} from 'gulp';
import pump from 'pump';
import requireUncached from 'require-uncached';

// Internal dependencies
import {paths, gulpPlugins} from './constants';

/**
 * Generate translation files.
 */
export default function translate(done) {
    // Get a fresh copy of the config
    const config = requireUncached(paths.config.themeConfig);

	pump([
        src(paths.languages.src),
        gulpPlugins.sort(),
        gulpPlugins.wpPot({
            domain: config.theme.slug,
            package: config.theme.name,
            bugReport: config.theme.name,
            lastTranslator: config.theme.author
        }),
        dest(paths.languages.dest),
    ], done);
}