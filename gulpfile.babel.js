/* eslint-env es6 */
'use strict';

// External dependencies
import {parallel, series} from 'gulp';

// Internal dependencies
import bundle from './gulp/bundle';
import {serve, reload} from './gulp/browserSync';
import images from './gulp/images';
import jsLibs from './gulp/jsLibs';
import jsMin from './gulp/jsMin';
import php from './gulp/php';
import sassStyles from './gulp/sassStyles';
import scripts from './gulp/scripts';
import styles from './gulp/styles';
import translate from './gulp/translate';
import watch from './gulp/watch';
import generateCert from './gulp/generateCert';

/**
 * Map out the sequence of events on first load and make it the default task
 */
export const firstRun = series(php, parallel(scripts, jsMin, jsLibs), sassStyles, styles, images, serve, watch);

export default firstRun;

/**
 * Test the theme.
 */
export const testTheme = series(php);

/**
 * Export theme for distribution.
 */
export const bundleTheme = series(testTheme, parallel(scripts, jsMin, jsLibs), styles, images, translate, bundle);

/**
 * Export all imported functions as tasks
 */
export { bundle, generateCert, jsLibs, jsMin, php, sassStyles, scripts, styles, translate, watch };
