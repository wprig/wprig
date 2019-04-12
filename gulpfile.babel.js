/* eslint-env es6 */
'use strict';

// External dependencies
import {parallel, series} from 'gulp';

// Internal dependencies
import generateCert from './gulp/generateCert';
import images from './gulp/images';
import php from './gulp/php';
import {serve} from './gulp/browserSync';
import scripts from './gulp/scripts';
import styles from './gulp/styles';
import editorStyles from './gulp/editorStyles';
import translate from './gulp/translate';
import watch from './gulp/watch';
import prodPrep from './gulp/prodPrep';
import prodFinish from './gulp/prodFinish';
import {
    sourceStringReplacementPHP,
    sourceStringReplacementJS,
    sourceStringReplacementCSS
} from './gulp/sourceStringReplacement';
import {cleanCSS, cleanJS} from './gulp/clean';

/**
 * Map out the sequence of events on first load and make it the default task
 */
export const firstRun = series(
    cleanCSS, cleanJS, parallel(php, images, series( styles, editorStyles ), scripts), serve, watch
);

export default firstRun;

/**
 * Build theme for development without BrowserSync or watching
 */
export const buildDev = parallel(
    php, images, series( styles, editorStyles ), scripts, translate
);

/**
 * Export theme for distribution.
 */
export const bundleTheme = series(
    prodPrep, parallel(php, scripts, series( styles, editorStyles ), images), translate, prodFinish
);

/**
 * Replace default strings in source files
 */
export const sourceStringReplacement = parallel(
    sourceStringReplacementPHP, sourceStringReplacementJS, sourceStringReplacementCSS
);

/**
 * Export all imported functions as tasks
 */
export { generateCert, images, php, scripts, styles, editorStyles, translate, watch, cleanCSS, cleanJS };
