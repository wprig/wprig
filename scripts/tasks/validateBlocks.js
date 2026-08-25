/**
 * Gutenberg Block Markup Validator Task for WP Rig
 *
 * This script recursively checks FSE HTML templates and parts, parses Gutenberg comments,
 * and validates their attributes against Core block.json definitions on the filesystem.
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import glob from 'fast-glob';
import {
	validateBlockMarkup,
	resolveCoreBlocksPath,
} from '../lib/validate-block-markup.js';

/**
 * Run Gutenberg FSE Block Validation
 */
export default async function runBlockValidation() {
	console.log( '\n=== 🕵️ Gutenberg Block Schema Linter ===' );

	const themeRoot = process.cwd();
	const templatesPath = path.join( themeRoot, 'templates' );
	const partsPath = path.join( themeRoot, 'parts' );

	if ( ! fs.existsSync( templatesPath ) && ! fs.existsSync( partsPath ) ) {
		console.log(
			'No FSE directories (templates/ or parts/) found in theme root.'
		);
		return true;
	}

	// Find all HTML files
	const htmlFiles = await glob(
		[ 'templates/**/*.html', 'parts/**/*.html' ],
		{
			cwd: themeRoot,
			absolute: true,
		}
	);

	if ( htmlFiles.length === 0 ) {
		console.log( 'No HTML template or part files found.' );
		return true;
	}

	const coreBlocksPath = resolveCoreBlocksPath( themeRoot );

	console.log(
		`Discovered ${ htmlFiles.length } FSE block template files. Analyzing...\n`
	);

	let hasErrors = false;
	let totalFilesValidated = 0;
	let totalBlocksValidated = 0;

	for ( const file of htmlFiles ) {
		const relativePath = path.relative( themeRoot, file );
		const content = fs.readFileSync( file, 'utf-8' );

		totalFilesValidated++;

		const { errors, warnings, validated } = validateBlockMarkup(
			content,
			relativePath,
			{
				themeRoot,
				coreBlocksPath,
			}
		);

		totalBlocksValidated += validated;

		for ( const error of errors ) {
			console.error(
				`❌ [${ relativePath }:${ error.line }] ${ error.message }`
			);
			hasErrors = true;
		}

		for ( const warning of warnings ) {
			console.warn(
				`⚠️  [${ relativePath }:${ warning.line }] ${ warning.message }`
			);
		}

		if ( errors.length === 0 ) {
			console.log( `✅ [VALID] ${ relativePath }` );
		}
	}

	console.log( '\n=== Linter Execution Statistics ===' );
	console.log( `- Files Validated:  ${ totalFilesValidated }` );
	console.log( `- Blocks Checked:   ${ totalBlocksValidated }` );
	console.log(
		`- Status:           ${ hasErrors ? '❌ FAILED' : '🟢 PASSED' }\n`
	);

	return ! hasErrors;
}

const isDirectRun =
	process.argv[ 1 ] &&
	import.meta.url === pathToFileURL( path.resolve( process.argv[ 1 ] ) ).href;

if ( isDirectRun ) {
	const ok = await runBlockValidation();
	process.exit( ok ? 0 : 1 );
}
