/* eslint-env es6 */
'use strict';

import path from 'node:path';
import fse from 'fs-extra';

import {
	isProd,
	rootPath,
	prodThemePath,
	paths,
	nameFieldDefaults,
} from '../lib/constants.js';
import { getThemeConfig } from '../lib/utils.js';
import { globFiles, writeFileEnsured } from '../lib/filepipe.js';

function buildReplacements() {
	const themeConfig = getThemeConfig( true );
	return Object.keys( nameFieldDefaults ).map( ( nameField ) => ( {
		searchValue: new RegExp(
			String( nameFieldDefaults[ nameField ] ).replace( /\\/g, '\\\\' ),
			'g'
		),
		replaceValue: themeConfig.theme[ nameField ],
	} ) );
}

function applyReplacements( content, replacements ) {
	let out = content;
	replacements.forEach( ( { searchValue, replaceValue } ) => {
		out = out.replace( searchValue, replaceValue );
	} );
	return out;
}

/**
 * Run string replacements on selected export files and write them into prod directory.
 * @param {Function} done
 */
export default async function prodStringReplace( done ) {
	try {
		if ( ! isProd ) {
			return done();
		}

		const files = await globFiles( paths.export.stringReplaceSrc );
		const replacements = buildReplacements();

		await Promise.all(
			files.map( async ( srcFile ) => {
				const rel = path.relative( rootPath, srcFile );
				const destFile = path.join( prodThemePath, rel );
				const content = await fse.readFile( srcFile, 'utf8' );
				const replaced = applyReplacements( content, replacements );
				await writeFileEnsured( destFile, replaced, 'utf8' );
			} )
		);

		return done();
	} catch ( e ) {
		return done( e );
	}
}
