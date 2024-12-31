/* eslint-env es6 */
"use strict";

/**
 * External dependencies
 */
import { src, dest } from "gulp";
import pump from "pump";
import fs from "fs";

/**
 * Internal dependencies
 */
import { paths } from "./constants.js";

/**
 * Copy the fonts folder from wp-rig to the production theme
 * @param {function} done function to call when async processes finish
 * @return {Stream} single stream or undefined if fonts directory does not exist
 */
export default function fonts(done) {
	// Check if the fonts directory exists
	if (fs.existsSync(paths.fonts.src)) {
		return pump([src(paths.fonts.src), dest(paths.fonts.dest)], done);
	}

	// If the directory does not exist, just complete the task without error
	done();
}
