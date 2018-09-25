/* eslint-env es6 */
'use strict';

// External dependencies
import {src, dest} from 'gulp';
import pump from 'pump';

// Internal dependencies
import {paths, gulpPlugins} from './constants';

/**
 * Copy JS libraries without touching them.
 */
export default function jsLibs(done) {
	pump([
		src(paths.scripts.libs),
		gulpPlugins.newer({
			dest: paths.scripts.verboseLibsDest,
			extra: [paths.config.themeConfig]
		}),
		dest(paths.scripts.verboseLibsDest),
		dest(paths.scripts.libsDest),
	], done);
}