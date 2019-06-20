/* eslint-env es6 */
'use strict';

/**
 * External dependencies
 */
import {src, dest} from 'gulp';
import pump from 'pump';

/**
 * Internal dependencies
 */
import {isProd, paths} from './constants';
import {getStringReplacementTasks} from './utils';

/**
 * Run string replacement on production files
 */
export default function prodStringReplace(done) {

    // Bail if not in production
    if ( ! isProd ) {
        return done();
    }

    return pump(
        [
            src(paths.export.stringReplaceSrc),
            getStringReplacementTasks(),
            dest(paths.export.dest)
        ],
		done
	);
}
