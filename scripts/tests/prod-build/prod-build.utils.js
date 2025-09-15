/* eslint-env es6 */
'use strict';

/**
 * Internal dependencies
 */
import { testPath, rootPath } from '../../lib/constants';

export const filesToMock = [
	{
		mock: `${ testPath }/prod-build/config.local.json`,
		dest: `${ rootPath }/config/config.local.json`,
	},
	{
		mock: `${ testPath }/prod-build/mmenu-light/mmenu-light.css`,
		dest: `${ rootPath }/assets/css/vendor/mmenu-light.css`,
	},
	{
		mock: `${ testPath }/prod-build/mmenu-light/mmenu-light.js`,
		dest: `${ rootPath }/assets/js/vendor/mmenu-light.js`,
	},
];
