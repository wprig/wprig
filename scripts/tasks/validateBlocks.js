/**
 * Gutenberg Block Markup Validator Task for WP Rig
 *
 * This script recursively checks FSE HTML templates and parts, parses Gutenberg comments,
 * and validates their attributes against Core block.json definitions on the filesystem.
 */

import fs from 'fs';
import path from 'path';
import glob from 'fast-glob';

/**
 * Run Gutenberg FSE Block Validation
 */
export default async function runBlockValidation() {
	console.log( '\n=== 🕵️ Gutenberg Block Schema Linter ===' );

	const themeRoot = process.cwd();
	const templatesPath = path.join( themeRoot, 'templates' );
	const partsPath = path.join( themeRoot, 'parts' );
	const coreBlocksPath = path.resolve( themeRoot, '../../../wp-includes/blocks' );

	if ( ! fs.existsSync( templatesPath ) && ! fs.existsSync( partsPath ) ) {
		console.log( 'No FSE directories (templates/ or parts/) found in theme root.' );
		return true;
	}

	// Find all HTML files
	const htmlFiles = await glob( [ 'templates/**/*.html', 'parts/**/*.html' ], {
		cwd: themeRoot,
		absolute: true,
	} );

	if ( htmlFiles.length === 0 ) {
		console.log( 'No HTML template or part files found.' );
		return true;
	}

	console.log( `Discovered ${htmlFiles.length} FSE block template files. Analyzing...\n` );

	let hasErrors = false;
	let totalFilesValidated = 0;
	let totalBlocksValidated = 0;

	for ( const file of htmlFiles ) {
		const relativePath = path.relative( themeRoot, file );
		const content = fs.readFileSync( file, 'utf-8' );
		const lines = content.split( '\n' );

		totalFilesValidated++;

		// Regex to parse opening Gutenberg block comments: <!-- wp:block-name {attributes} -->
		const blockRegex = /<!--\s*wp:([a-z0-9-]+\/?[a-z0-9-]+)\s*(\{.*?\})?\s*-->/g;
		let match;
		let fileHasErrors = false;

		while ( ( match = blockRegex.exec( content ) ) !== null ) {
			totalBlocksValidated++;

			let blockName = match[1];
			if ( ! blockName.includes( '/' ) ) {
				blockName = 'core/' + blockName;
			}
			const attributesStr = match[2];
			const blockSlug = blockName.split( '/' )[1];

			// Find line number
			const charIndex = match.index;
			const lineNumber = content.substring( 0, charIndex ).split( '\n' ).length;

			// Locate block.json in WordPress Core
			const blockJsonPath = path.join( coreBlocksPath, blockSlug, 'block.json' );

			if ( ! fs.existsSync( blockJsonPath ) ) {
				// Non-core/custom blocks can be skipped or warned depending on setup
				continue;
			}

			// Load the official schema
			let schema;
			try {
				schema = JSON.parse( fs.readFileSync( blockJsonPath, 'utf-8' ) );
			} catch ( err ) {
				console.error( `❌ [${relativePath}:${lineNumber}] Failed to parse block.json for ${blockName}` );
				fileHasErrors = true;
				hasErrors = true;
				continue;
			}

			// Parse attributes if present
			let attributes = {};
			if ( attributesStr ) {
				try {
					attributes = JSON.parse( attributesStr );
				} catch ( err ) {
					console.error( `❌ [${relativePath}:${lineNumber}] Invalid JSON syntax in block comments for ${blockName}: "${attributesStr}"` );
					fileHasErrors = true;
					hasErrors = true;
					continue;
				}
			}

			// Validate attributes
			const supports = schema.supports || {};

			// Check global "className" support (like core/list-item which deactivates it)
			if ( attributes.className ) {
				if ( supports.className === false ) {
					console.error( `❌ [${relativePath}:${lineNumber}] Block "${blockName}" defines custom class "${attributes.className}", but custom classes are EXPLICITLY forbidden by this block's core schema supports. (Gutenberg will trigger a block recovery error!)` );
					fileHasErrors = true;
					hasErrors = true;
				}
			}

			// Check global "anchor" support (allows html ID links)
			if ( attributes.anchor ) {
				if ( ! supports.anchor ) {
					console.error( `❌ [${relativePath}:${lineNumber}] Block "${blockName}" defines anchor "#${attributes.anchor}", but anchors are not supported by this block.` );
					fileHasErrors = true;
					hasErrors = true;
				}
			}

			// Check declared custom attributes
			const declaredAttributes = schema.attributes || {};
			for ( const attrKey of Object.keys( attributes ) ) {
				// Ignore common global layout/styling keys that WordPress Core injects automatically
				if ( [ 'className', 'anchor', 'layout', 'style', 'tagName', 'align' ].includes( attrKey ) ) {
					continue;
				}

				if ( ! Object.prototype.hasOwnProperty.call( declaredAttributes, attrKey ) ) {
					console.warn( `⚠️  [${relativePath}:${lineNumber}] Block "${blockName}" defines unlisted attribute "${attrKey}". Verify if this matches custom configurations or variations.` );
				}
			}
		}

		if ( ! fileHasErrors ) {
			console.log( `✅ [VALID] ${relativePath}` );
		}
	}

	console.log( '\n=== Linter Execution Statistics ===' );
	console.log( `- Files Validated:  ${totalFilesValidated}` );
	console.log( `- Blocks Checked:   ${totalBlocksValidated}` );
	console.log( `- Status:           ${hasErrors ? '❌ FAILED' : '🟢 PASSED'}\n` );

	return ! hasErrors;
}
