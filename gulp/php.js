/* eslint-env es6 */
'use strict';

// External dependencies
import pump from 'pump';
import {src, dest} from 'gulp';

// Internal dependencies
import {paths, rootPath, gulpPlugins, isProd} from './constants';
import {getStringReplacementTasks} from './utils';

/**
 * PHP via PHP Code Sniffer.
 */
export default function php(done) {

	const beforeReplacement = [
		src(paths.php.src),
		// Run code sniffing
		gulpPlugins.phpcs({
			bin: `${rootPath}/vendor/bin/phpcs`,
			standard: 'WordPress',
			warningSeverity: 0
		}),
		// Log all problems that were found
		gulpPlugins.phpcs.reporter('log')
	];

	const afterReplacement = [
		dest( paths.php.dest )
	];

	// Only do string replacements when building for production
	if( isProd ){
		pump(
			[].concat(
				beforeReplacement,
				getStringReplacementTasks(),
				afterReplacement
			),
			done
		);
	} else {
		pump( beforeReplacement, done );
	}

	done();

}
