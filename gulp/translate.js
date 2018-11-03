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
            domain: (isProd) ? nameFieldDefaults.slug : config.theme.slug,
            package: (isProd) ? nameFieldDefaults.name : config.theme.name,
            bugReport: (isProd) ? nameFieldDefaults.name : config.theme.name,
            lastTranslator: (isProd) ? nameFieldDefaults.author : config.theme.author
        }),
        dest(paths.languages.dest),
    ], done);
}