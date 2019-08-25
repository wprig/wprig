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
		mock: `${ gulpTestPath }/prod-build/prod-test.php`,
		dest: `${ rootPath }/template-parts/prod-test.php`,
	},
];
