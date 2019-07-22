/* eslint-env es6 */
/* global test, expect */

/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';
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

test( 'if .po files exist in the dev theme then .mo files are generated in the production theme', ( done ) => {
	// Get any .po files that exist
	const poFilePathsArray = glob.sync( `${ rootPath }/languages/*.po` );

	// Create an array of .mo files from .po files
	const moFilePathsArray = poFilePathsArray.map( ( filePath ) => {
		return filePath
			// Update the file path from dev to prod
			.replace( rootPath, prodThemePath )
			// And replace .po with .mo
			.replace( '.po', '.mo' );
	} );

	// Make sure each prod .mo file exist.
	moFilePathsArray.forEach( ( filePath ) => {
		const fileExists = fs.existsSync( filePath );
		let failMessage = `The expected .mo file ${ filePath } does not exist`;
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

test( 'if .po files exist in the dev theme then .json files are generated in the production theme', ( done ) => {
	// Get any .po files that have JavaScript translations
	const poFilePathsArray = glob.sync( `${ rootPath }/languages/*.po` )
		/**
		 * Skip the .po file if it does not have JavaScript strings
		 * as wp-cli will not generate a JSON file.
		 * See https://github.com/wp-cli/i18n-command/issues/136#issuecomment-453006359
		 */
		.filter( function( filePath ) {
			// Get the file contents
			const fileContents = fs.readFileSync(
				filePath,
				{ encoding: 'utf-8' }
			);

			return fileContents.includes( '.js' );
		} );

	let JSONFilePathsArray = [];

	// For each .po file found
	poFilePathsArray.forEach( ( poFilePath ) => {
		// Stash the .po file base name
		const poFileBaseName = path.basename( poFilePath, '.po' );
		// Get all corresponding .json files
		const currentJSONFilePathsArray = glob.sync( `${ prodThemePath }/languages/*.json` )
			/**
			 * Skip the .json file if it is unrelated
			 * to the .po file we are checking.
			 */
			.filter( function( jsonFilePath ) {
				// Get the file base name
				const jsonFileBaseName = path.basename( jsonFilePath, '.json' );

				/**
				 * The generated JSON files have a hash in the file name
				 * but always start with the same file base name as the
				 * .po file they were generated from. So we can check if
				 * the .json file base name starts with the .po file base name
				 * to determine which .po file it came from.
				 */
				return jsonFileBaseName.startsWith( poFileBaseName );
			} );

		// Add the current .po files .json files to the main array
		JSONFilePathsArray = JSONFilePathsArray.concat( currentJSONFilePathsArray );
	} );

	// Make sure each prod .json file exist.
	JSONFilePathsArray.forEach( ( filePath ) => {
		const fileExists = fs.existsSync( filePath );
		let failMessage = `The expected .json file ${ filePath } does not exist`;
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

test( 'pot file generation', ( done ) => {

	const filePath = paths.languages.potDest;
	// Test that the .pot file exists
	const potFileExists = fs.existsSync( filePath );
	let failMessage = `The expected .pot file ${ filePath } does not exist`;
	expect( potFileExists, failMessage ).toBe( true );

	const fileContents = fs.readFileSync(
		filePath,
		{ encoding: 'utf-8' }
	);

	// Test that the .pot file contains .php translations
	failMessage = `The .pot file ${ filePath } does not contain any .php translations`;
	expect( fileContents, failMessage ).toContain( '.php' );
	
	// Test that the .pot file contains .js translations
	failMessage = `The .pot file ${ filePath } does not contain any .js translations`;
	expect( fileContents, failMessage ).toContain( '.js' );

	done();
} );
