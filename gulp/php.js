/* eslint-env es6 */
'use strict';

// External dependencies
import pump from 'pump';
import {src, dest} from 'gulp';
import log from 'fancy-log';
import colors from 'ansi-colors';

// Internal dependencies
import {paths, rootPath, gulpPlugins, gulpReplaceOptions, nameFieldDefaults} from './constants';
import {getThemeConfig} from './utils';

const nameFields = Object.keys( nameFieldDefaults );

// We are on the first run by default
let isFirstRun = true;

// Grab the initial config so we can check if the theme slug/name change later
let initialConfig = getThemeConfig();

// Stash theme config
let themeConfig = initialConfig.theme;

/**
 * PHP via PHP Code Sniffer.
 */
export default function php(done) {

	// get a fresh copy of the config
	const config = getThemeConfig(true);

	// We should rebuild if this is the first run OR the theme name fields have changed
	let isRebuild = isFirstRun;
	let i = 0;
	while ( ! isRebuild && i < nameFields.length ) {
		isRebuild = isRebuild || themeConfig[ nameFields[ i ] ] !== config.theme[ nameFields[ i ] ];
		i++;
	}

	if ( isRebuild ) {
		nameFields.forEach( nameField => {
			themeConfig[ nameField ] = config.theme[ nameField ];
		});
		log(colors.yellow(`Rebuilding ${colors.bold('all')} the PHP files, this may take a while...`));
	} else {
		log(colors.yellow(`Rebuilding just the changed PHP files, this should be quick...`));
	}

	// Reset first run.
	if ( isFirstRun ) {
		isFirstRun = false;
	}

	const steps = [
		src(paths.php.src),
		// If not a rebuild, then run tasks on changed files only.
		gulpPlugins.if(
			!isRebuild,
			gulpPlugins.newer(paths.php.dest)
		),
		gulpPlugins.phpcs({
			bin: `${rootPath}/vendor/bin/phpcs`,
			standard: 'WordPress',
			warningSeverity: 0
		}),
		// Log all problems that was found
		gulpPlugins.phpcs.reporter('log'),
	];

	Object.keys( nameFieldDefaults ).forEach( nameField => {
		steps.push( gulpPlugins.stringReplace( nameFieldDefaults[ nameField ], config.theme[ nameField ], gulpReplaceOptions ) );
	});

	steps.push( dest( paths.php.dest ) );

	pump( steps, done );

}
