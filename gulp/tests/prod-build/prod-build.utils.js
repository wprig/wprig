/* eslint-env es6 */
'use strict';

/**
 * Internal dependencies
 */
import {
	gulpTestPath,
	prodThemePath,
	rootPath,
} from '../../constants';

export const filesToMock = [
	{
		mock: `${ gulpTestPath }/prod-build/config.local.json`,
		dest: `${ rootPath }/config/config.local.json`,
	},
	{
		mock: `${ gulpTestPath }/translations/fr_FR.po`,
		dest: `${ rootPath }/languages/fr_FR.po`,
		prodDest: `${ prodThemePath }/languages/fr_FR.po`,
	},
	{
		mock: `${ gulpTestPath }/translations/fr_FR.mo`,
		dest: `${ rootPath }/languages/fr_FR.mo`,
	},
];
