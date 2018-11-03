/* eslint-env es6 */
'use strict';

// External dependencies
import {src, dest} from 'gulp';
import pump from 'pump';
import log from 'fancy-log';
import colors from 'ansi-colors';

// Internal dependencies
import {paths, gulpPlugins, isProd} from './constants';
import {getThemeConfig, getStringReplacementTasks} from './utils';

/**
 * Create zip archive from generated theme files.
 */
export default function bundle(done) {

    if( ! isProd ){
        log(colors.red(`${colors.bold('Error:')} the bundle task may only be called from the production environment. Set NODE_ENV to production and try again.`));
        done();
        return;
    }

    // get a fresh copy of the config
    const config = getThemeConfig(true);

    let beforeReplacement = [
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
    ];

    let afterReplacement = [

    ];

    return pump(
		[].concat(
			beforeReplacement,
			getStringReplacementTasks(),
			afterReplacement
		),
		done
    );
}