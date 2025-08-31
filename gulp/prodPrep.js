/* eslint-env es6 */
'use strict';

/**
 * External dependencies
 */
// Use Node's fs and glob directly for copying, remove Gulp src/dest/pump
import log from 'fancy-log';
import colors from 'ansi-colors';
import path from 'path';
import fs from 'fs';          // Node's file system module
import glob from 'glob';        // Glob for pattern resolution
import { mkdirp } from 'mkdirp'; // Utility to create directories recursively

/**
 * Internal dependencies
 */
import {
	isProd,
	prodThemePath,
	rootPath,
	paths, // Still need paths to get the source list from config
	nameFieldDefaults,
} from './constants.js';
import {
	createProdDir,
	// gulpRelativeDest is not needed for manual copy
	getThemeConfig,
} from './utils.js';

/**
 * Create the production directory and manually copy export files (from filesToCopy) using fs streams.
 * @param {function} done function to call when async processes finish
 * @return {void} Calls done() on completion or error.
 */
export default function prodPrep(done) {
	// Check if running in production environment based on NODE_ENV
	if (!isProd) {
		log(colors.red(`${colors.bold('Error:')} The prodPrep task may only be called when NODE_ENV is set to 'production'.`));
		return done(new Error("prodPrep requires NODE_ENV=production"));
	}

	const config = getThemeConfig(true); // Get production config

	// --- Environment & Config Checks ---
	if (!prodThemePath) {
		log(colors.red(`${colors.bold('Error:')} Production theme path is not defined. Check NODE_ENV and theme config.`));
		return done(new Error('Production theme path missing'));
	}
	if (path.basename(prodThemePath) === path.basename(rootPath)) {
		log(colors.red(`${colors.bold('Error:')} The theme slug cannot be the same as the dev theme directory name.`));
		return done(new Error('Production theme slug matches development directory name'));
	}
	const requiredConfigUpdates = ['slug', 'name'];
	for (const requiredConfigField of requiredConfigUpdates) {
		if (nameFieldDefaults[requiredConfigField] === config.theme[requiredConfigField]) {
			log(colors.red(`${colors.bold('Error:')} The theme ${requiredConfigField} must be different than the default value ${nameFieldDefaults[requiredConfigField]}.`));
			return done(new Error(`Theme config field '${requiredConfigField}' is still default`));
		}
	}
	// --- End Checks ---

	// Create the prod directory
	try {
		createProdDir();
	} catch (err) {
		log(colors.red(`${colors.bold('Error:')} Failed to create production directory: ${err.message}`));
		return done(err);
	}

	// Resolve all source files defined in constants.js (populated from themeConfig.js -> filesToCopy)
	let filesToCopy = [];
	try {
		// paths.export.src contains absolute paths built in constants.js for filesToCopy
		paths.export.src.forEach((pattern) => {
			const files = glob.sync(pattern, { nodir: true }); // Exclude directories
			filesToCopy = filesToCopy.concat(files);
		});
	} catch (err) {
		log(colors.red(`${colors.bold('Error:')} Failed to resolve source file patterns for prodPrep: ${err.message}`));
		return done(err);
	}

	if (filesToCopy.length === 0) {
		log(colors.yellow('prodPrep: No files found matching export patterns (filesToCopy) to copy.'));
		return done(); // Nothing to copy, complete successfully
	}

	log(colors.cyan(`prodPrep: Copying ${filesToCopy.length} files (from filesToCopy) manually...`));

	let filesProcessed = 0;
	let copyErrors = 0;
	const totalFiles = filesToCopy.length;

	// Function to check if all files are processed and call done()
	const checkCompletion = () => {
		if (++filesProcessed >= totalFiles) { // Use >= for safety
			if (copyErrors > 0) {
				log(colors.red(`${colors.bold('prodPrep Error:')} ${copyErrors} file(s) failed to copy.`));
				done(new Error(`${copyErrors} file(s) failed to copy during prodPrep.`));
			} else {
				log(colors.green(`prodPrep: Successfully copied ${totalFiles} files.`));
				done();
			}
		}
	};

	// Manual file copy logic for each file listed in filesToCopy
	filesToCopy.forEach((srcFilePath) => {
		const relativePath = path.relative(rootPath, srcFilePath);
		const destFilePath = path.join(prodThemePath, relativePath);
		const destDir = path.dirname(destFilePath);

		// Ensure destination directory exists
		try {
			mkdirp.sync(destDir);
		} catch (err) {
			log(colors.red(`prodPrep: Error creating directory ${destDir}: ${err.message}`));
			copyErrors++;
			checkCompletion();
			return; // Skip this file
		}

		// Create read and write streams
		const readStream = fs.createReadStream(srcFilePath);
		const writeStream = fs.createWriteStream(destFilePath);

		readStream.on('error', (err) => {
			log(colors.red(`prodPrep: Error reading file ${srcFilePath}: ${err.message}`));
			copyErrors++;
			if (!writeStream.destroyed) writeStream.end();
			checkCompletion();
		});

		writeStream.on('error', (err) => {
			log(colors.red(`prodPrep: Error writing file ${destFilePath}: ${err.message}`));
			copyErrors++;
			checkCompletion();
		});

		writeStream.on('finish', () => {
			checkCompletion(); // File copied successfully
		});

		// Start the copy process
		readStream.pipe(writeStream);
	});

    // Safety net
    if (totalFiles === 0) {
        done();
    }
}
