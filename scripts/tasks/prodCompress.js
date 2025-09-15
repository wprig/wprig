/* eslint-env es6 */
'use strict';

import path from 'node:path';
import fs from 'node:fs';
import fse from 'fs-extra';
import archiver from 'archiver';

import { prodThemePath } from '../lib/constants.js';
import { getThemeConfig } from '../lib/utils.js';

/**
 * Gulp-free production compression task: create a zip from prodThemePath
 * @param {Function} done callback when finished
 */
export default function prodCompress( done ) {
	try {
		const config = getThemeConfig();

		if ( ! config.export.compress ) {
			return done();
		}

		const zipName = `${ config.theme.slug }.zip`;
		const destDir = path.normalize( path.join( prodThemePath, '..' ) );
		const destZip = path.join( destDir, zipName );

		fse.ensureDirSync( destDir );

		const output = fs.createWriteStream( destZip );
		const archive = archiver( 'zip', { zlib: { level: 9 } } );

		output.on( 'close', () => done() );
		output.on( 'error', ( err ) => done( err ) );
		archive.on( 'error', ( err ) => done( err ) );

		archive.pipe( output );
		// Add contents of prodThemePath to the root of the zip
		archive.directory( prodThemePath, false );
		archive.finalize();
	} catch ( e ) {
		done( e );
	}
}
