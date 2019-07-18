/* eslint-env es6 */
/* global test, expect */

/**
 * External dependencies
 */
import {
	concat,
} from 'mississippi';
import fs from 'fs';

/**
 * Internal dependencies
 */
import { getThemeConfig } from '../../utils';
import { filesToMock } from './prod-build.utils';
import {
	prodThemePath,
	isProd,
	rootPath,
	nameFieldDefaults,
	paths,
} from '../../constants';

test( 'gulp runs in production mode', ( done ) => {
	function assert() {
		expect( isProd ).toBe( true );
	}

	concat( assert );
	done();
} );

test( 'the production theme directory exists', ( done ) => {
	const config = getThemeConfig( true );

	function assert() {
		const prodThemeDirExists = fs.existsSync( prodThemePath );
		expect( nameFieldDefaults.slug === config.theme.slug ).toBe( false );
		expect( prodThemeDirExists ).toBe( true );
	}

	concat( assert );
	done();
} );

test( 'files are copied to the production theme', ( done ) => {
	const copiedFiles = [];

	for ( const filePath of paths.export.src ) {
		copiedFiles.push(
			filePath.replace( rootPath, prodThemePath )
		);
	}

	filesToMock.forEach( ( file ) => {
		if ( Object.prototype.hasOwnProperty.call( file, 'prodDest' ) ) {
			copiedFiles.push( file.prodDest );
		}
	} );

	paths.export.stringReplaceSrc.forEach( ( filePath ) => {
		if ( ! filePath.includes( '*' ) ) {
			copiedFiles.push(
				filePath.replace( rootPath, prodThemePath )
			);
		}
	} );

	function assert() {
		// Make sure the files exist.
		copiedFiles.forEach( ( filePath ) => {
			const fileExists = fs.existsSync( filePath );
			expect( fileExists ).toBe( true );
			/*
			// And that they don't have any default strings.
			const fileContents = fs.readFileSync(
				filePath,
				{ encoding: 'utf-8' }
			);
			Object.keys( nameFieldDefaults ).forEach( ( key ) => {
				expect( fileContents ).not.toContain( nameFieldDefaults[ key ] );
			} );
			*/
		} );
	}

	concat( assert );
	done();
} );
