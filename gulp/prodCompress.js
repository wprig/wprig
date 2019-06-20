/* eslint-env es6 */
'use strict';

/**
 * External dependencies
 */
import {src, dest} from 'gulp';
import pump from 'pump';
import path from 'path';

/**
 * Internal dependencies
 */
import {prodThemePath, gulpPlugins} from './constants';
import {getThemeConfig} from './utils';

/**
 * Create the zip file
 */
export default function prodCompress(done) {
    const config = getThemeConfig();

    // Bail if the compress option is false
    if ( ! config.export.compress ) {
        return done();
    }

    return pump(
        [
            src(`${prodThemePath}/**/*`),
            gulpPlugins.zip(`${config.theme.slug}.zip`),
            dest(path.normalize(`${prodThemePath}/../`))
        ],
		done
	);
}