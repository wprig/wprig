/* eslint-env es6 */
'use strict';

// External dependencies
import requireUncached from 'require-uncached';
import pump from 'pump';
import {src, dest} from 'gulp';
import log from 'fancy-log';
import colors from 'ansi-colors';

// Internal dependencies
import {paths, rootPath, gulpPlugins, gulpReplaceOptions} from './constants';

// We are on the first run by default
let isFirstRun = true;

// Grab the initial config so we can check if the theme slug/name change later
let initialConfig = require(paths.config.themeConfig);

// Stash theme config
let themeConfig = initialConfig.theme;

/**
 * PHP via PHP Code Sniffer.
 */
export default function php(done) {

    // get a fresh copy of the config
    const config = requireUncached(paths.config.themeConfig);

	// We should rebuild if this is the first run OR the theme slug/name have changed
	let isRebuild = isFirstRun ||
		( themeConfig.slug !== config.theme.slug ) ||
        ( themeConfig.name !== config.theme.name );

	if ( isRebuild ) {
		themeConfig.slug = config.theme.slug;
        themeConfig.name = config.theme.name;
        log(colors.yellow(`Rebuilding ${colors.bold('all')} the PHP files, this may take a while...`));
	} else {
        log(colors.yellow(`Rebuilding just the changed PHP files, this should be quick...`));
    }

	// Reset first run.
	if ( isFirstRun ) {
		isFirstRun = false;
    }

	pump([
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
        gulpPlugins.stringReplace('wprig', config.theme.slug, gulpReplaceOptions),
        gulpPlugins.stringReplace('WP Rig', config.theme.name, gulpReplaceOptions),
<<<<<<< HEAD
        dest(paths.verbose),
=======
>>>>>>> 0167df9104a316dd12add03209411f098c6e17ca
        dest(paths.php.dest),
    ], done);

}