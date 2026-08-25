/**
 * Block Pattern Validator Task for WP Rig
 *
 * Validates block patterns shipped in the theme's `patterns/` directory and in
 * installed components' bundled `patterns/` directories:
 *
 * 1. Metadata (i18n-aware) — required Title/Slug/Categories headers present,
 *    valid slug charset, no placeholder strings left in titles or content
 *    (pairs with `audit:i18n`).
 * 2. Markup validity — block comments parsed and validated against Core
 *    block.json definitions via the shared block schema validator.
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import glob from 'fast-glob';
import {
	validateBlockMarkup,
	resolveCoreBlocksPath,
} from '../lib/validate-block-markup.js';
import themeConfig from '../../config/themeConfig.js';

const HEADER_REGEX = /^\s*\*\s*([A-Za-z ]+?):\s*(.*)$/;
const SLUG_REGEX = /^[A-z0-9/_-]+$/;
const PLACEHOLDER_TITLES = [ 'new pattern' ];
const PLACEHOLDER_CONTENT = [ 'hello world!' ];

/**
 * Maps a pattern header key to its camelCase property name.
 *
 * @param {string} key Raw header key, e.g. "Viewport Width".
 * @return {string} CamelCased property, e.g. "viewportWidth".
 */
export function normalizeHeaderKey( key ) {
	const words = key.trim().toLowerCase().split( /\s+/ );

	return words
		.map( ( word, index ) =>
			0 === index
				? word
				: word.charAt( 0 ).toUpperCase() + word.slice( 1 )
		)
		.join( '' );
}

/**
 * Parses the file-header metadata from a pattern file's docblock.
 *
 * @param {string} content Raw pattern file content.
 * @return {Object<string,string>} Parsed headers keyed by normalized property name.
 */
export function parsePatternHeaders( content ) {
	const headers = {};
	const lines = content.split( '\n' );

	for ( const line of lines ) {
		const match = line.match( HEADER_REGEX );

		if ( ! match ) {
			continue;
		}

		const key = normalizeHeaderKey( match[ 1 ] );

		if ( key ) {
			headers[ key ] = match[ 2 ].trim();
		}
	}

	return headers;
}

/**
 * Extracts the block markup from a pattern file, skipping the PHP docblock.
 *
 * @param {string} content Raw pattern file content.
 * @return {string} The block markup portion of the file.
 */
export function extractPatternContent( content ) {
	const start = content.indexOf( '<!-- wp:' );

	return -1 === start ? '' : content.slice( start );
}

/**
 * Validates pattern metadata headers (i18n-aware).
 *
 * @param {Object<string,string>} headers                   Parsed pattern headers.
 * @param {Object}                [options]                 Options.
 * @param {Object<string,string>} [options.knownCategories] Config-seeded category slugs.
 * @return {{errors: Array<Object>, warnings: Array<Object>}} Validation result.
 */
export function checkPatternHeaders( headers, options = {} ) {
	const errors = [];
	const warnings = [];

	if ( ! headers.title ) {
		errors.push( {
			message:
				'Missing required "Title" header. Block pattern metadata is not translatable without a title.',
		} );
	} else if (
		PLACEHOLDER_TITLES.includes( headers.title.trim().toLowerCase() )
	) {
		errors.push( {
			message: `Placeholder title "${ headers.title }" — replace it with a real, translatable title.`,
		} );
	}

	if ( ! headers.slug ) {
		errors.push( {
			message:
				'Missing required "Slug" header (expected "theme/pattern-name").',
		} );
	} else if ( ! SLUG_REGEX.test( headers.slug ) ) {
		errors.push( {
			message: `Invalid slug "${ headers.slug }". Use only letters, numbers, hyphens, underscores, and forward slashes.`,
		} );
	}

	if ( ! headers.categories ) {
		errors.push( {
			message:
				'Missing required "Categories" header. Wire the pattern into a registered category.',
		} );
	} else {
		const categorySlugs = headers.categories
			.split( ',' )
			.map( ( slug ) => slug.trim() );
		const knownCategories = options.knownCategories || {};

		for ( const categorySlug of categorySlugs ) {
			if (
				! Object.prototype.hasOwnProperty.call(
					knownCategories,
					categorySlug
				)
			) {
				warnings.push( {
					message: `Unknown category "${ categorySlug }" — not in config patterns.categories. Register it or filter it via \`wprig_block_pattern_categories\`.`,
				} );
			}
		}
	}

	return { errors, warnings };
}

/**
 * Checks pattern content for un-translatable placeholders.
 *
 * @param {string} content Extracted pattern block markup.
 * @return {Array<Object>} Content errors.
 */
export function checkPatternContent( content ) {
	const errors = [];
	const lower = content.toLowerCase();

	if ( PLACEHOLDER_CONTENT.some( ( phrase ) => lower.includes( phrase ) ) ) {
		errors.push( {
			message:
				'Placeholder content detected (e.g. "Hello world!"). Replace with meaningful, translatable starter content.',
		} );
	}

	const templatePlaceholders = content.match( /\{\{[a-z]+\}\}/gi );

	if ( templatePlaceholders ) {
		errors.push( {
			message: `Un-substituted template placeholders: ${ templatePlaceholders.join(
				', '
			) }. Scaffold finished incorrectly.`,
		} );
	}

	return errors;
}

/**
 * Validates every pattern file under the given directory.
 *
 * @param {string} themeRoot Theme root path.
 * @return {boolean} True when all patterns pass validation.
 */
export async function runPatternValidation( themeRoot = process.cwd() ) {
	console.log( '\n=== 🧩 Block Pattern Linter ===' );

	const knownCategories = themeConfig?.patterns?.categories || {};
	const patternsDir = path.join( themeRoot, 'patterns' );
	const componentPatternsDir = path.join( themeRoot, 'inc' );

	const patterns = await glob(
		[
			patternsDir && fs.existsSync( patternsDir )
				? 'patterns/**/*.php'
				: null,
			componentPatternsDir && fs.existsSync( componentPatternsDir )
				? 'inc/*/patterns/**/*.php'
				: null,
		].filter( Boolean ),
		{
			cwd: themeRoot,
			absolute: true,
		}
	);

	if ( patterns.length === 0 ) {
		console.log( 'No block patterns found. Skipping pattern validation.' );
		return true;
	}

	const coreBlocksPath = resolveCoreBlocksPath( themeRoot );

	console.log(
		`Discovered ${ patterns.length } pattern file(s). Analyzing...\n`
	);

	let hasErrors = false;
	let totalBlocksValidated = 0;

	for ( const file of patterns ) {
		const relativePath = path.relative( themeRoot, file );
		const content = fs.readFileSync( file, 'utf-8' );
		const headers = parsePatternHeaders( content );
		const markup = extractPatternContent( content );
		const fileErrors = [];
		const fileWarnings = [];

		const headerResult = checkPatternHeaders( headers, {
			knownCategories,
		} );
		fileErrors.push( ...headerResult.errors );
		fileWarnings.push( ...headerResult.warnings );

		fileErrors.push( ...checkPatternContent( markup ) );

		if ( markup ) {
			const markupResult = validateBlockMarkup( markup, relativePath, {
				themeRoot,
				coreBlocksPath,
			} );
			totalBlocksValidated += markupResult.validated;
			fileErrors.push( ...markupResult.errors );
			fileWarnings.push( ...markupResult.warnings );
		} else if (
			! headerResult.errors.some( ( e ) => e.message.includes( 'Slug' ) )
		) {
			fileErrors.push( {
				message:
					'No block markup found in pattern. Add at least one block.',
			} );
		}

		for ( const warning of fileWarnings ) {
			console.warn( `⚠️  [${ relativePath }] ${ warning.message }` );
		}

		for ( const error of fileErrors ) {
			console.error( `❌ [${ relativePath }] ${ error.message }` );
			hasErrors = true;
		}

		if ( fileErrors.length === 0 ) {
			console.log( `✅ [VALID] ${ relativePath }` );
		}
	}

	console.log( '\n=== Pattern Linter Statistics ===' );
	console.log( `- Files Validated:  ${ patterns.length }` );
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
	const ok = await runPatternValidation();
	process.exit( ok ? 0 : 1 );
}
