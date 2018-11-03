/* eslint-env es6 */
'use strict';

// External dependencies
import {src, dest} from 'gulp';
import pump from 'pump';
import path from 'path';

// Internal dependencies
import {prodThemePath, gulpPlugins, config} from './constants';

/**
 * Create the production directory
 */
export default function prodFinish(done) {

    // Copying misc files to the prod directory
    return pump(
		[
            src(`${prodThemePath}/**/*`),
            gulpPlugins.if(
                config.export.compress, 
                gulpPlugins.zip(`${config.theme.slug}.zip`)
            ),
            dest(path.normalize(`${prodThemePath}/../`))
        ],
		done
	);
}