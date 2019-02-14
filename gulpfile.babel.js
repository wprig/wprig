/* eslint-env es6 */
'use strict';

// External dependencies
import {parallel, series} from 'gulp';

// Internal dependencies
import generateCert from './gulp/generateCert';
import images from './gulp/images';
import php from './gulp/php';
import {serve} from './gulp/browserSync';
import sassStyles from './gulp/sassStyles';
import scripts from './gulp/scripts';
import styles from './gulp/styles';
import translate from './gulp/translate';
import watch from './gulp/watch';
import prodPrep from './gulp/prodPrep';
import prodFinish from './gulp/prodFinish';

/**
 * Map out the sequence of events on first load and make it the default task
 */
export const firstRun = series(
    parallel(php, images, sassStyles, styles, scripts), serve, watch
);

export default firstRun;

/**
 * Build theme for development without BrowserSync or watching
 */
export const buildDev = parallel(
    php, images, sassStyles, styles, scripts, translate
);

/**
 * Export theme for distribution.
 */
export const bundleTheme = series(
    prodPrep, parallel(php, scripts, styles, sassStyles, images), translate, prodFinish
);

/**
 * Export all imported functions as tasks
 */
export { generateCert, images, php, sassStyles, scripts, styles, translate, watch };
