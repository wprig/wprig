/* eslint-env es6 */
'use strict';

/**
 * Internal dependencies
 */
import {
	gulpTestPath,
	rootPath,
} from '../../constants';

export const filesToMock = [
	{
		mock: `${ gulpTestPath }/prod-build/config.local.json`,
		dest: `${ rootPath }/config/config.local.json`,
	},
	{
		mock: `${ gulpTestPath }/prod-build/mmenu-light/mmenu-light.css`,
		dest: `${ rootPath }/assets/css/vendor/mmenu-light.css`,
	},
	{
		mock: `${ gulpTestPath }/prod-build/mmenu-light/mmenu-light.js`,
		dest: `${ rootPath }/assets/js/vendor/mmenu-light.js`,
	},
];
