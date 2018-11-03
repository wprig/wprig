/* eslint-env es6 */
'use strict';

// External dependencies
import log from 'fancy-log';
import colors from 'ansi-colors';

// Internal dependencies
import {isProd} from './constants';
import {createProdDir} from './utils';

/**
 * Create the production directory
 */
export default function prodPrep(done) {

    if( ! isProd ){
        log(colors.red(`${colors.bold('Error:')} the bundle task may only be called from the production environment. Set NODE_ENV to production and try again.`));
        done();
        return;
    }

    createProdDir();

    done();
    return;
}