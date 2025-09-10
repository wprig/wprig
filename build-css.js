import {
	readFileSync,
	writeFileSync,
	readdirSync,
	existsSync,
	mkdirSync,
	statSync,
} from 'fs';
import path from 'path';
// eslint-disable-next-line import/no-extraneous-dependencies
import browserslist from 'browserslist';
import { bundleAsync, browserslistToTargets } from 'lightningcss';
import { paths } from './gulp/constants.js';
import { replaceInlineCSS } from './gulp/utils.js';

// get this from config
const themeSlug = 'wp-rig';
// Determine if running in development mode
const isDev = process.argv.includes( '--dev' );

// Ensure output directories exist
const ensureDirectoryExistence = ( dir ) => {
	if ( ! existsSync( dir ) ) {
		mkdirSync( dir, { recursive: true } );
	}
};

ensureDirectoryExistence( paths.styles.dest );
ensureDirectoryExistence( paths.styles.editorDest );

/**
 * Build a virtual preload from dev.styles.importFrom in config.
 * All listed files are concatenated and exposed via a virtual import id so
 * we don't break CSS @import ordering in real files.
 */
const rigConfig = JSON.parse(
	readFileSync( path.resolve( 'config/config.default.json' ), 'utf8' )
);
const importFromList = ( rigConfig?.dev?.styles?.importFrom ?? [] ).map(
	( p ) => path.resolve( paths.styles.srcDir, p )
);

/**
 * Concatenate preload content (kept simple & predictable).
 *
 * @return {string} - Concatenated content of all preload files
 */
function loadPreloadSnippet() {
	let buf = '';
	for ( const file of importFromList ) {
		try {
			buf += readFileSync( file, 'utf8' ) + '\n';
		} catch {
			// ignore missing files
		}
	}
	return buf;
}
const PRELOAD_SNIPPET = loadPreloadSnippet();
const VIRTUAL_ID = 'virtual:preload.css';

/**
 * Process CSS content to replace theme URLs with actual paths.
 *
 * Handles both url('~theme/path') and var(--theme-assets-path)/path and converts
 * them to proper absolute URLs with the theme path.
 *
 * @param {string} css - CSS content to process
 * @return {string} - Processed CSS content
 */
function processThemeUrls( css ) {
	const themeName = themeSlug;

	// Replace ~theme/... (with or without quotes)
	let processedCSS = css.replace(
		/url\((['"]?)~theme\/([^'")]+)(['"]?)\)/g,
		( match, openQuote, assetPath, closeQuote ) => {
			const quote = openQuote || "'";
			const endQuote = closeQuote || "'";
			return `url(${ quote }/wp-content/themes/${ themeName }/${ assetPath }${ endQuote })`;
		}
	);

	// Replace var(--theme-assets-path)/...
	processedCSS = processedCSS.replace(
		/var\(--theme-assets-path\)\/([^\s;)]+)/g,
		( match, assetPath ) => {
			return `url('/wp-content/themes/${ themeName }/assets/${ assetPath }')`;
		}
	);

	return processedCSS;
}

/**
 * Insert a snippet right after the top-level @import block (and optional @charset).
 *
 * @param {string} css     - CSS content
 * @param {string} snippet - Snippet to insert
 * @return {string} - Modified CSS content
 */
function insertAfterTopImports( css, snippet ) {
	const charsetRe = /^\s*@charset[^;]+;\s*/i;
	let head = '';
	let rest = css;
	const cm = rest.match( charsetRe );
	if ( cm ) {
		head = cm[ 0 ];
		rest = rest.slice( cm[ 0 ].length );
	}
	const importBlockRe = /^(?:\s*@import\s+(?:url\()?[^;]+;\s*)+/i;
	const ib = rest.match( importBlockRe );
	const importsBlock = ib ? ib[ 0 ] : '';
	if ( ib ) {
		rest = rest.slice( importsBlock.length );
	}
	return head + importsBlock + snippet + rest;
}

/**
 * Ensure a single virtual import is present after the top-level imports (idempotent).
 *
 * @param {string} css - CSS content
 * @return {string} - CSS with virtual import ensured
 */
function ensureVirtualImportInserted( css ) {
	if (
		css.includes( `@import "${ VIRTUAL_ID }"` ) ||
		css.includes( `@import '${ VIRTUAL_ID }'` )
	) {
		return css;
	}
	return insertAfterTopImports( css, `@import "${ VIRTUAL_ID }";\n` );
}

/**
 * Dev-only guard: fail fast if a file still contains a late @import.
 *
 * @param {string} css  - CSS content
 * @param {string} file - File path (for error messages)
 * @throws {Error} If late @import is detected
 */
function assertNoLateImports( css, file ) {
	if ( ! isDev ) {
		return;
	}
	// Strip any number of leading block comments and whitespace
	let s = css;
	for (;;) {
		const before = s;
		s = s.replace( /^\s*\/\*[\s\S]*?\*\/\s*/m, '' );
		s = s.replace( /^\s+/, '' );
		if ( s === before ) {
			break;
		}
	}
	// Allowed at the very top: @charset, @layer, @import (any amount/order)
	const top =
		s.match(
			/^((\s*@charset[^\n;]*;\s*|\s*@layer[^{;]*;\s*|\s*@import\s+[^\n;]*;\s*)*)/i
		)?.[ 0 ] ?? '';
	const rest = s.slice( top.length );
	if ( /@import\s+[^;]+;/i.test( rest ) ) {
		throw new Error(
			`Late @import in ${ file } — must precede all other rules (except @charset/@layer).`
		);
	}
}

/**
 * Recursively collect all CSS files (excluding partials starting with "_").
 *
 * @param {string} dir - Directory to search
 * @return {string[]} - List of CSS file paths
 */
const getAllFiles = ( dir ) => {
	const files = readdirSync( dir );
	let filelist = [];
	files.forEach( ( file ) => {
		const filePath = path.join( dir, file );
		const fileStat = statSync( filePath );
		if ( fileStat.isDirectory() ) {
			filelist = filelist.concat( getAllFiles( filePath ) );
		} else if ( file.endsWith( '.css' ) && ! file.startsWith( '_' ) ) {
			filelist.push( filePath );
		}
	} );
	return filelist;
};

/**
 * Process a single CSS file with LightningCSS bundler.
 * - Targets are derived from Browserslist (env-aware)
 * - Virtual preload import is injected after top-level @import block
 * - Source map is emitted and linked via sourceMappingURL
 *
 * @param {string} filePath   - Path to input CSS file
 * @param {string} outputPath - Path to output CSS file
 * @return {Promise<void>}
 */
const processCSSFile = async ( filePath, outputPath ) => {
	const entryAbs = path.resolve( filePath );

	// Resolve Browserslist targets from project config (.browserslistrc / package.json)
	const browserslistEnv =
		process.env.BROWSERSLIST_ENV ||
		( isDev ? 'development' : 'production' );
	const browsers = browserslist( null, {
		path: process.cwd(),
		env: browserslistEnv,
	} );
	const targets = browserslistToTargets( browsers );

	const result = await bundleAsync( {
		filename: entryAbs,
		minify: ! isDev,
		sourceMap: isDev,
		sourceMapIncludeSources: true, // embed original sources so DevTools can jump to them
		drafts: { customMedia: true },
		targets, // <- derived from Browserslist
		resolver: {
			// Provide processed source per file so each keeps its identity in the map
			read( readPath ) {
				// Serve the virtual preload file
				if ( readPath === VIRTUAL_ID ) {
					return PRELOAD_SNIPPET || '';
				}

				// Read original file content
				let css = readFileSync( readPath, 'utf8' );

				// Validate import ordering (dev) without mutating sources
				assertNoLateImports( css, readPath );

				// Apply text-level transforms that should be visible as "original" in maps
				css = replaceInlineCSS( css );
				css = processThemeUrls( css );

				// Inject the virtual preload import AFTER the top-level import block
				if ( PRELOAD_SNIPPET ) {
					css = ensureVirtualImportInserted( css );
				}

				return css;
			},
			resolve( specifier, from ) {
				// Keep the virtual id as-is; resolve real paths relative to importer
				if ( specifier === VIRTUAL_ID ) {
					return VIRTUAL_ID;
				}
				return path.resolve( path.dirname( from ), specifier );
			},
		},
	} );

	// Write CSS (and map) + append sourceMappingURL in one go
	if ( result.map ) {
		const mapFile = `${ outputPath }.map`;
		writeFileSync( mapFile, result.map );

		// Append a comment at the end of the CSS file that allows browsers to locate the corresponding map file.
		const cssWithMap = Buffer.concat( [
			result.code,
			Buffer.from(
				`\n/*# sourceMappingURL=${ path.basename( mapFile ) } */\n`
			),
		] );
		writeFileSync( outputPath, cssWithMap );
	} else {
		writeFileSync( outputPath, result.code );
	}
};

/**
 * Process all CSS files in a directory (await all bundles).
 *
 * @param {string} dir     - Source directory
 * @param {string} destDir - Destination directory
 * @return {Promise<void>}
 */
const processDirectory = async ( dir, destDir ) => {
	const files = getAllFiles( dir );
	const tasks = files.map( ( file ) => {
		const relativePath = path.relative( dir, file );
		const outputPath = path.join(
			destDir,
			relativePath.replace( '.css', '.min.css' )
		);
		const outputDir = path.dirname( outputPath );
		ensureDirectoryExistence( outputDir );
		return processCSSFile( file, outputPath );
	} );
	await Promise.all( tasks );
};

// Kick off both directories (top-level await wrapper for Node ESM)
( async () => {
	await processDirectory( paths.styles.srcDir, paths.styles.dest );
	await processDirectory(
		paths.styles.editorSrcDir,
		paths.styles.editorDest
	);
} )();
