/* eslint-env es6 */
'use strict';

/**
 * External dependencies
 */
import {src, dest} from 'gulp';
import fs from 'fs';
import pump from 'pump';
import map from 'map-stream';


/**
 * Internal dependencies
 */
import {
    rootPath,
    paths,
    isProd
} from './constants';
import {
    getThemeConfig,
    getStringReplacementTasks
} from './utils';

export function translationStream() {

    return map( (data, callback) => {

        if( fs.existsSync(paths.languages.dest) ) {
            fs.unlinkSync(
                paths.languages.dest,
                (err) => {
                    if (err) throw err;
                }
            );
        }

        const composerCommand = `composer wp -- i18n make-pot ${paths.languages.src} ${paths.languages.dest} --exclude=${paths.languages.exclude}`;
        
        require('child_process').execSync(
            composerCommand,
            {
                cwd: rootPath
            }
        );

        callback();
    });
}

/**
 * Generate translation files.
 */
export default function translate(done) {
    const config = getThemeConfig();

    if( isProd ) {

        // Don't generate .pot file on production if the config flag is false
        if ( ! config.export.generatePotFile ) {
            return done();
        }

		// Only do string replacements and save PHP files when building for production
		return pump([
			src(paths.languages.src),
            translationStream(),
			getStringReplacementTasks(),
			dest( paths.languages.dest )
		], done);

	} else {

		return pump([
			src(paths.languages.src),
            translationStream(),
		], done);

	}
}