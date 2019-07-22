/* eslint-env es6 */
'use strict';

/**
 * External dependencies
 */
import { series } from 'gulp';

/**
 * Internal dependencies
 */
import generateMOFiles from './translate/generateMOFiles';
import generatePotFile from './translate/generatePotFile';
import generateJSONFiles from './translate/generateJSONFiles';

/**
 * Export other translation tasks
 */
export {default as generateMOFiles } from './translate/generateMOFiles';
export {default as generatePotFile } from './translate/generatePotFile';
export {default as generateJSONFiles } from './translate/generateJSONFiles';

/**
 * Export default translate task.
 */
export const translate = series(
	generatePotFile,
	generateJSONFiles,
	generateMOFiles
);

export default translate;