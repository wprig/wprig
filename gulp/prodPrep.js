/* eslint-env es6 */
'use strict';

// External dependencies
import {src, dest} from 'gulp';
import pump from 'pump';
import log from 'fancy-log';
import colors from 'ansi-colors';
import path from 'path';

// Internal dependencies
import {isProd, prodThemePath, rootPath, paths} from './constants';
import {createProdDir, getStringReplacementTasks} from './utils';

/**
 * Create the production directory
 */
export default function prodPrep(done) {

    // Error if not in a production environment
    if( ! isProd ){
        log(colors.red(`${colors.bold('Error:')} the bundle task may only be called from the production environment. Set NODE_ENV to production and try again.`));
        process.exit(1);
    }

    // The dev theme and the prod theme can't have the same name
    if ( path.basename(prodThemePath) === path.basename(rootPath) ){
        log(colors.red(`${colors.bold('Error:')} the theme slug cannot be the same as the dev theme directory name.`));
        process.exit(1);
    }

    // Create the prod directory
    createProdDir();

    // Copying misc files to the prod directory
    return pump(
		[].concat(
			[
                src(paths.export.src)
            ],
			getStringReplacementTasks(),
			[
                dest(paths.export.dest)
            ]
		),
		done
	);
}