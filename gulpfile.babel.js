/* eslint-env es6 */
'use strict';

// External dependencies
import {parallel, series} from 'gulp';

// Internal dependencies
import bundle from './gulp/bundle';
import generateCert from './gulp/generateCert';
import images from './gulp/images';
import php from './gulp/php';
import {reload, serve} from './gulp/browserSync';
import sassStyles from './gulp/sassStyles';
import scripts from './gulp/scripts';
import styles from './gulp/styles';
import translate from './gulp/translate';
import watch from './gulp/watch';

/**
 * Map out the sequence of events on first load and make it the default task
 */
export const firstRun = series( parallel(php, images, sassStyles, styles, scripts), serve, watch);

export default firstRun;

/**
 * Export theme for distribution.
 */
export const bundleTheme = series(php, scripts, styles, images, translate, bundle);

/**
 * Export all imported functions as tasks
 */
export { bundle, generateCert, images, php, sassStyles, scripts, styles, translate, watch };
