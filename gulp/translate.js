/* eslint-env es6 */
'use strict';

// External dependencies
import {src, dest} from 'gulp';
import pump from 'pump';

// Internal dependencies
import {paths, gulpPlugins, nameFieldDefaults, isProd} from './constants';
import {getThemeConfig} from './utils';

/**
 * Generate translation files.
 */
export default function translate(done) {
    // Get a fresh copy of the config
    const config = getThemeConfig();

	pump([
        src(paths.languages.src),
        gulpPlugins.sort(),
        gulpPlugins.wpPot({
            domain: (isProd) ? config.theme.slug : nameFieldDefaults.slug,
            package: (isProd) ? config.theme.name : nameFieldDefaults.name,
            bugReport: (isProd) ? config.theme.name : nameFieldDefaults.name,
            lastTranslator: (isProd) ? config.theme.author : nameFieldDefaults.author
        }),
        dest(paths.languages.dest),
    ], done);
}