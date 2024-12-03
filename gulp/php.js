/* eslint-env es6 */
'use strict';

/**
 * External dependencies
 */
import pump from 'pump';
import { src, dest } from 'gulp';
import { exec } from 'child_process';

/**
 * Internal dependencies
 */
import { paths, isProd } from './constants.js';
import through2 from "through2";
import removeWpCliBlock from "./removeWpCliBlock.js";

/**
 * PHP Build Task.
 * @param {boolean} runPhpcs - Whether to run PHPCS.
 * @param {function} done - Function to call when async processes finish.
 * @return {Stream} single stream
 */
export default function php(runPhpcs, done) {
	if (runPhpcs) {
		console.log('Running PHPCS via Composer script...');
		const phpcsProcess = exec('vendor/bin/phpcs --standard=phpcs.xml.dist -p -s');

		let stdoutData = '';
		let stderrData = '';

		phpcsProcess.stdout.on('data', (data) => {
			stdoutData += data;
		});

		phpcsProcess.stderr.on('data', (data) => {
			stderrData += data;
		});

		phpcsProcess.on('close', (code) => {
			if (stdoutData) {
				console.log(`STDOUT: ${stdoutData}`);
			}
			if (stderrData) {
				console.error(`STDERR: ${stderrData}`);
			}
			console.log(`PHPCS process exited with code ${code}`);
			if (code !== 0) {
				console.error(`PHPCS found issues. Exit code: ${code}`);
			}
			done();
		});

		phpcsProcess.on('error', (err) => {
			console.error('Failed to start PHPCS:', err);
			done(err);
		});

		return;
	}

	if (isProd) {
		// Only do string replacements and save PHP files when building for production
		return pump([
			src(paths.php.src),
			through2.obj(function (file, enc, callback) {
				// remove wp cli block from functions.php
				if (file.isBuffer() && file.relative === 'functions.php') { // Adjust this check as necessary.
					const content = file.contents.toString(enc);
					const cleanedContent = removeWpCliBlock(content);
					// eslint-disable-next-line no-undef
					file.contents = Buffer.from(cleanedContent, enc);
				}
				callback(null, file);
			}),
			dest(paths.php.dest),
		], done);
	}

	// In development, just pass through the files without saving
	const stream = src(paths.php.src);
	stream.on('end', done);
	stream.on('error', done);
	return stream;
}
