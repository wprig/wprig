/**
 * Gutenberg Block Markup Validator (shared core)
 *
 * Parses Gutenberg block comments from a string and validates their attributes
 * against Core block.json definitions on the filesystem. Shared by the FSE
 * template linter (validateBlocks.js) and the block pattern linter
 * (validatePatterns.js).
 */

import fs from 'fs';
import path from 'path';

const BLOCK_REGEX = /<!--\s*wp:([a-z0-9-]+\/?[a-z0-9-]+)\s*(\{.*?\})?\s*-->/g;

/**
 * Attribute keys WordPress Core injects automatically and should not warn about.
 */
const GLOBAL_ATTRIBUTE_KEYS = [
	'className',
	'anchor',
	'layout',
	'style',
	'tagName',
	'align',
];

/**
 * Resolves the Core blocks directory relative to a theme root.
 *
 * @param {string} themeRoot Theme root path.
 * @return {string} Absolute path to wp-includes/blocks.
 */
export function resolveCoreBlocksPath( themeRoot ) {
	return path.resolve( themeRoot, '../../../wp-includes/blocks' );
}

/**
 * Validates Gutenberg block markup in a content string against Core block.json
 * definitions.
 *
 * @param {string} content             The markup to validate.
 * @param {string} relativePath        Relative file path for error reporting.
 * @param {Object} [options]           Options.
 * @param {string} [options.themeRoot] Theme root used to locate Core blocks. Defaults to process.cwd().
 * @return {{errors: Array<Object>, warnings: Array<Object>, validated: number}} Validation result.
 */
export function validateBlockMarkup( content, relativePath, options = {} ) {
	const themeRoot = options.themeRoot || process.cwd();
	const coreBlocksPath =
		options.coreBlocksPath || resolveCoreBlocksPath( themeRoot );
	const errors = [];
	const warnings = [];
	let validated = 0;

	BLOCK_REGEX.lastIndex = 0;
	let match;

	while ( ( match = BLOCK_REGEX.exec( content ) ) !== null ) {
		validated++;

		let blockName = match[ 1 ];
		if ( ! blockName.includes( '/' ) ) {
			blockName = 'core/' + blockName;
		}
		const attributesStr = match[ 2 ];
		const blockSlug = blockName.split( '/' )[ 1 ];

		const charIndex = match.index;
		const lineNumber = content
			.substring( 0, charIndex )
			.split( '\n' ).length;

		const blockJsonPath = path.join(
			coreBlocksPath,
			blockSlug,
			'block.json'
		);

		if ( ! fs.existsSync( blockJsonPath ) ) {
			continue;
		}

		let schema;
		try {
			schema = JSON.parse( fs.readFileSync( blockJsonPath, 'utf-8' ) );
		} catch ( err ) {
			errors.push( {
				message: `Failed to parse block.json for ${ blockName }`,
				line: lineNumber,
			} );
			continue;
		}

		let attributes = {};
		if ( attributesStr ) {
			try {
				attributes = JSON.parse( attributesStr );
			} catch ( err ) {
				errors.push( {
					message: `Invalid JSON syntax in block comments for ${ blockName }: "${ attributesStr }"`,
					line: lineNumber,
				} );
				continue;
			}
		}

		const supports = schema.supports || {};

		if ( attributes.className ) {
			if ( supports.className === false ) {
				errors.push( {
					message: `Block "${ blockName }" defines custom class "${ attributes.className }", but custom classes are EXPLICITLY forbidden by this block's core schema supports. (Gutenberg will trigger a block recovery error!)`,
					line: lineNumber,
				} );
			}
		}

		if ( attributes.anchor ) {
			if ( ! supports.anchor ) {
				errors.push( {
					message: `Block "${ blockName }" defines anchor "#${ attributes.anchor }", but anchors are not supported by this block.`,
					line: lineNumber,
				} );
			}
		}

		const declaredAttributes = schema.attributes || {};
		for ( const attrKey of Object.keys( attributes ) ) {
			if ( GLOBAL_ATTRIBUTE_KEYS.includes( attrKey ) ) {
				continue;
			}

			if (
				! Object.prototype.hasOwnProperty.call(
					declaredAttributes,
					attrKey
				)
			) {
				warnings.push( {
					message: `Block "${ blockName }" defines unlisted attribute "${ attrKey }". Verify if this matches custom configurations or variations.`,
					line: lineNumber,
				} );
			}
		}
	}

	return { errors, warnings, validated };
}
