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
];
