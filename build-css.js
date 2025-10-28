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
import themeConfig from './config/themeConfig.js'; // merged WP Rig config (default -> config -> local)
import { paths } from './scripts/lib/constants.js';
import { replaceInlineCSS } from './scripts/lib/utils.js';

// Determine if running in development mode
const isDev = process.argv.includes( '--dev' );

/**
 * Ensure output directory exists.
 * @param {string} dir
 * @return {void}
 */
const ensureDirectoryExistence = ( dir ) => {
	if ( ! existsSync( dir ) ) {
		mkdirSync( dir, { recursive: true } );
	}
};

ensureDirectoryExistence( paths.styles.dest );
ensureDirectoryExistence( paths.styles.editorDest );

/**
 * Get theme slug from merged config (fallback to 'wp-rig').
 * @type {string}
 */
const themeSlug = themeConfig?.theme?.slug || 'wp-rig';

/**
 * Resolve preload entries from config:
 * - prefer dev.styles.preload (new)
 * - fallback to deprecated dev.styles.importFrom with a warning
 * @param {Object} cfg - Theme config object
 * @return {string[]} Array of relative preload file paths.
 */
function resolvePreloadList( cfg ) {
	const styles = cfg?.dev?.styles ?? {};
	if ( Array.isArray( styles.preload ) && styles.preload.length ) {
		return styles.preload;
	}
	if ( Array.isArray( styles.importFrom ) && styles.importFrom.length ) {
		// eslint-disable-next-line no-console
		console.warn(
			'[deprecation] config.dev.styles.importFrom is deprecated. ' +
				'Use config.dev.styles.preload instead.'
		);
		return styles.importFrom;
	}
	return [];
}

/** Preload list from merged config (relative to styles srcDir). */
const preloadListRel = resolvePreloadList( themeConfig );

/** Map relative entries to absolute paths using WP Rig paths.styles.srcDir. */
const preloadListAbs = preloadListRel.map( ( p ) =>
	path.resolve( paths.styles.srcDir, p )
);

/**
 * Concatenate all preload files into a single virtual snippet.
 * Missing files are silently skipped to match legacy behavior.
 * @return {string} Concatenated preload CSS snippet.
 */ function loadPreloadSnippet() {
	let buf = '';
	for ( const file of preloadListAbs ) {
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
 * - Virtual preload import can be injected after top-level @import block (theme CSS only)
 * - Source map is emitted and linked via sourceMappingURL in dev mode
 *
 * @param {string} filePath         - Path to input CSS file
 * @param {string} outputPath       - Path to output CSS file
 * @param {boolean} injectPreload   - Whether to inject theme preload snippet (default: true)
 * @return {Promise<void>}
 */
const processCSSFile = async ( filePath, outputPath, injectPreload = true ) => {
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
		targets,
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

				// Inject the virtual preload import AFTER the top-level import block (theme CSS only)
				if ( injectPreload && PRELOAD_SNIPPET ) {
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

	if ( isDev && result.map ) {
		try {
			const mapJson = JSON.parse( result.map.toString() );
			if (
				! Array.isArray( mapJson.sources ) ||
				mapJson.sources.length === 0
			) {
				// eslint-disable-next-line no-console
				console.warn(
					'[css] Warning: sourcemap has no sources for',
					filePath
				);
			}
		} catch ( err ) {
			// eslint-disable-next-line no-console
			console.warn(
				'[css] Failed to parse sourcemap for',
				filePath,
				err
			);
		}
	}

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
	// Theme-level CSS (inject preload snippet if configured)
	await processDirectory( paths.styles.srcDir, paths.styles.dest );
	await processDirectory(
		paths.styles.editorSrcDir,
		paths.styles.editorDest
	);

	// Block-level CSS: compile each block's style.css and editor.css into build/ (no theme preload injection)
	const blocksDir = path.join(
		paths.assetsDir || path.join( process.cwd(), 'assets' ),
		'blocks'
	);
	try {
		const slugs = readdirSync( blocksDir, {
			withFileTypes: true,
		} )
			.filter( ( d ) => d.isDirectory() )
			.map( ( d ) => d.name );

		for ( const slug of slugs ) {
			const blockDir = path.join( blocksDir, slug );
			const outDir = path.join( blockDir, 'build' );
			if ( ! existsSync( outDir ) ) {
				mkdirSync( outDir, { recursive: true } );
			}
			const styleIn = path.join( blockDir, 'style.css' );
			const editorIn = path.join( blockDir, 'editor.css' );
			if ( existsSync( styleIn ) ) {
				await processCSSFile(
					styleIn,
					path.join( outDir, 'style.css' ),
					false
				);
			}
			if ( existsSync( editorIn ) ) {
				await processCSSFile(
					editorIn,
					path.join( outDir, 'editor.css' ),
					false
				);
			}
		}
	} catch {
		// no blocks or cannot read; ignore
	}
} )();
