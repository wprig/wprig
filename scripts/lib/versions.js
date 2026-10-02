/**
 * WP Rig version helpers.
 *
 * Two versions are tracked independently:
 *
 * - The **framework version** (WP Rig itself) lives in `config/framework.json`.
 *   That file is source-only: it is not part of the production bundle and is
 *   stripped by `childify`, so a theme built with WP Rig never carries the
 *   framework version.
 * - The **theme version** (the theme being built with WP Rig) lives in
 *   `config/config.default.json` (`theme.version`, overridable in
 *   `config/config.json`) and is stamped into `style.css` / `readme.txt`.
 */

import fs from 'fs';
import path from 'path';

/**
 * Theme-relative path to the framework version file.
 *
 * @type {string}
 */
export const FRAMEWORK_VERSION_FILE = 'config/framework.json';

/**
 * Validates a SemVer-ish version string (x.y.z, optional pre-release/build).
 *
 * @param {string} version Version string to validate.
 * @return {boolean} True when the version is valid.
 */
export function isValidVersion( version ) {
	return /^\d+\.\d+\.\d+(?:[-+].+)?$/.test( String( version || '' ) );
}

/**
 * Reads the WP Rig framework version from config/framework.json.
 *
 * @param {string} themeRoot Theme root path.
 * @return {string|null} Framework version, or null when the file is absent.
 */
export function readFrameworkVersion( themeRoot ) {
	const filePath = path.join( themeRoot, FRAMEWORK_VERSION_FILE );

	try {
		const data = JSON.parse( fs.readFileSync( filePath, 'utf8' ) );
		return typeof data.version === 'string' ? data.version : null;
	} catch {
		return null;
	}
}

/**
 * Writes the WP Rig framework version to config/framework.json.
 *
 * @param {string} themeRoot Theme root path.
 * @param {string} version   New framework version.
 * @return {string} Path to the written file.
 */
export function writeFrameworkVersion( themeRoot, version ) {
	const filePath = path.join( themeRoot, FRAMEWORK_VERSION_FILE );

	let data = {};
	try {
		data = JSON.parse( fs.readFileSync( filePath, 'utf8' ) );
	} catch {
		data = {};
	}

	if ( typeof data !== 'object' || data === null ) {
		data = {};
	}

	data.name = data.name || 'wp-rig';
	data.version = version;

	fs.mkdirSync( path.dirname( filePath ), { recursive: true } );
	fs.writeFileSync(
		filePath,
		JSON.stringify( data, null, 2 ) + '\n',
		'utf8'
	);

	return filePath;
}

/**
 * Removes the framework version file (used by childify so a built theme has no
 * trace of the WP Rig version).
 *
 * @param {string} themeRoot Theme root path.
 * @return {boolean} True when a file was removed.
 */
export function stripFrameworkVersion( themeRoot ) {
	const filePath = path.join( themeRoot, FRAMEWORK_VERSION_FILE );

	if ( fs.existsSync( filePath ) ) {
		fs.unlinkSync( filePath );
		return true;
	}

	return false;
}

/**
 * Reads the theme version from style.css (`Version:` header).
 *
 * @param {string} themeRoot Theme root path.
 * @return {string|null} Theme version, or null when unavailable.
 */
export function readThemeVersion( themeRoot ) {
	try {
		const css = fs.readFileSync(
			path.join( themeRoot, 'style.css' ),
			'utf8'
		);
		const match = css.match( /^\s*Version:\s*(.+)$/m );
		return match ? match[ 1 ].trim() : null;
	} catch {
		return null;
	}
}

/**
 * Stamps the resolved theme version into a built file's version header.
 *
 * Only `style.css` (`Version:`) and `readme.txt` (`Stable tag:`) are touched;
 * other files are returned unchanged.
 *
 * @param {string} content  File contents.
 * @param {string} filePath File path (used to detect the header type).
 * @param {string} version  Theme version to stamp.
 * @return {string} Stamped contents.
 */
export function stampVersionHeaders( content, filePath, version ) {
	if ( ! version ) {
		return content;
	}

	const base = path.basename( filePath );

	if ( base === 'style.css' ) {
		// Function replacement: a "$" sequence in the version must be
		// inserted literally, not expanded as a replacement pattern.
		return content.replace(
			/(^\s*Version:\s*).+$/m,
			( _, prefix ) => `${ prefix }${ version }`
		);
	}

	if ( base === 'readme.txt' ) {
		return content.replace(
			/(^\s*Stable tag:\s*).+$/m,
			( _, prefix ) => `${ prefix }${ version }`
		);
	}

	return content;
}
