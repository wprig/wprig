/* eslint-env es6 */
'use strict';

import path from 'node:path';
import fse from 'fs-extra';

import { isProd, rootPath, prodThemePath, paths } from '../lib/constants.js';
import {
	getThemeConfig,
	getReplacements,
	applyReplacements,
} from '../lib/utils.js';
import { stampVersionHeaders } from '../lib/versions.js';
import { globFiles, writeFileEnsured } from '../lib/filepipe.js';

/**
 * Run string replacements on selected export files and write them into prod directory.
 * @param {Function} done
 */
export default async function prodStringReplace( done ) {
	try {
		if ( ! isProd ) {
			return done();
		}

		const replacements = getReplacements( true );
		const themeVersion = getThemeConfig( true ).theme.version;

		// 1. Process files already in production (built assets, copied files)
		const prodFiles = await globFiles(
			[
				`${ prodThemePath }/**/*.js`,
				`${ prodThemePath }/**/*.css`,
				`${ prodThemePath }/**/*.php`,
			],
			{
				ignore: [ '**/*.svg' ],
			}
		);

		await Promise.all(
			prodFiles.map( async ( srcFile ) => {
				const content = await fse.readFile( srcFile, 'utf8' );
				const replaced = stampVersionHeaders(
					applyReplacements( content, replacements ),
					srcFile,
					themeVersion
				);
				await fse.writeFile( srcFile, replaced, 'utf8' );
			} )
		);

		// 2. Process source files that might not be in production yet (like style.css)
		const sourceFiles = await globFiles( paths.export.stringReplaceSrc );

		await Promise.all(
			sourceFiles.map( async ( srcFile ) => {
				const rel = path.relative( rootPath, srcFile );
				const destFile = path.join( prodThemePath, rel );
				const content = await fse.readFile( srcFile, 'utf8' );
				const replaced = stampVersionHeaders(
					applyReplacements( content, replacements ),
					srcFile,
					themeVersion
				);
				await writeFileEnsured( destFile, replaced, 'utf8' );
			} )
		);

		return done();
	} catch ( e ) {
		return done( e );
	}
}
