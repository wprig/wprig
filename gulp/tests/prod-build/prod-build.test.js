/* eslint-env es6 */
/* global test, expect */

/**
 * External dependencies
 */
import fs from 'fs';
import glob from 'glob';

/**
 * Internal dependencies
 */
import { getThemeConfig } from '../../utils';
import {
	prodThemePath,
	isProd,
	rootPath,
	nameFieldDefaults,
	paths,
} from '../../constants';

test( 'gulp runs in production mode', ( done ) => {
	expect( isProd ).toBe( true );
	done();
} );

test( 'the production theme directory exists', ( done ) => {
	const config = getThemeConfig( true );

	const prodThemeDirExists = fs.existsSync( prodThemePath );
	expect( nameFieldDefaults.slug === config.theme.slug ).toBe( false );
	expect( prodThemeDirExists ).toBe( true );

	done();
} );

test( 'config defined files to copy exist in the production theme', ( done ) => {
	const copiedFiles = [];

	// Get all files to be copied to the prod directory
	paths.export.src.forEach( ( filePath ) => {
		// Update their paths from dev to prod
		copiedFiles.push(
			filePath.replace( rootPath, prodThemePath )
		);
	} );

	// Make sure the files exist.
	copiedFiles.forEach( ( filePath ) => {
		const fileExists = fs.existsSync( filePath );
		const failMessage = `The expected file ${ filePath } does not exist`;
		expect( fileExists, failMessage ).toBe( true );
	} );

	done();
} );

test( 'string replacement files to copy exist in the production theme and do not contain default strings', ( done ) => {
	const copiedFiles = [];

	// Get all paths to be replaced
	paths.export.stringReplaceSrc.forEach( ( filePath ) => {
		// If there is a glob
		if ( filePath.includes( '*' ) ) {
			// Get the array of paths from the glob
			const filePathsArray = glob.sync( filePath );
			// And add each one to the copied files array
			filePathsArray.forEach( ( globFilePath ) => {
				copiedFiles.push(
					globFilePath.replace( rootPath, prodThemePath )
				);
			} );
		// If the path is a directory that exists
		} else if ( fs.lstatSync( filePath ).isDirectory() && fs.existsSync( filePath ) ) {
			// Get the array of files in the directory
			const filePathsArray = fs.readdirSync( filePath );
			// And add each one to the copied files array
			filePathsArray.forEach( ( globFilePath ) => {
				copiedFiles.push(
					globFilePath.replace( rootPath, prodThemePath )
				);
			} );
		// Otherwise if it is a single file that exists
		} else if ( fs.existsSync( filePath ) ) {
			// Add it directly to the copied files array
			copiedFiles.push(
				filePath.replace( rootPath, prodThemePath )
			);
		}
	} );

	// Make sure each copied file exists.
	copiedFiles.forEach( ( filePath ) => {
		const fileExists = fs.existsSync( filePath );
		let failMessage = `The expected file ${ filePath } does not exist`;
		expect( fileExists, failMessage ).toBe( true );
		// And that it doesn't have any default strings.
		const fileContents = fs.readFileSync(
			filePath,
			{ encoding: 'utf-8' }
		);
		Object.keys( nameFieldDefaults ).forEach( ( key ) => {
			failMessage = `The file ${ filePath } contains the default string ${ nameFieldDefaults[ key ] }`;
			expect( fileContents, failMessage ).not.toContain( nameFieldDefaults[ key ] );
		} );
	} );

	done();
} );
