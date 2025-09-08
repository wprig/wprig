// build-css.js
//
// WP Rig CSS build with Lightning CSS (refactored for readability).
// - Uses `bundle()` so @import resolution and sourcemaps are handled by Lightning CSS.
// - Sourcemaps only in development (`--dev`), production is minified.
// - Ensures `@custom-media` exists before use via a tiny virtual entry that imports
//   (1) assets/css/src/_custom-media.css (if present) and (2) the real entry file.
// - Browser targets are derived dynamically from Browserslist (caniuse-lite). If unavailable,
//   Lightning CSS defaults are used.
// - Optional inline rewrite hook (`replaceInlineCSS`) is applied on every CSS read.
// - Folder layout and output paths remain unchanged.

import path from 'path';
import {
	readFileSync,
	writeFileSync,
	readdirSync,
	existsSync,
	mkdirSync,
	statSync,
	rmSync,
} from 'fs';
import browserslist from 'browserslist';
import { bundle, browserslistToTargets } from 'lightningcss';
import { paths } from './gulp/constants.js';
import { replaceInlineCSS } from './gulp/utils.js'; // optional; safely guarded below

// ------------------------------ config ------------------------------
const isDev = process.argv.includes( '--dev' );

const SRC_DIRS = [
	paths?.styles?.srcDir || 'assets/css/src',
	paths?.styles?.editorSrcDir, // optional
].filter( Boolean );

const OUT_ROOTS = [
	paths?.styles?.dest || 'assets/css',
	paths?.styles?.editorDest, // optional
].filter( Boolean );

const CUSTOM_MEDIA_ABS = path.resolve(
	process.cwd(),
	'assets/css/src/_custom-media.css'
);
const VIRTUAL_DIR = path.resolve( process.cwd(), '.wprig-virtual-entry' );

// ------------------------------ utils ------------------------------
function ensureDir( dir ) {
	if ( ! existsSync( dir ) ) {
		mkdirSync( dir, { recursive: true } );
	}
}
function isFile( p ) {
	try {
		return existsSync( p ) && statSync( p ).isFile();
	} catch {
		return false;
	}
}
function isDir( p ) {
	try {
		return existsSync( p ) && statSync( p ).isDirectory();
	} catch {
		return false;
	}
}
function toPosix( p ) {
	return p.replace( /\\/g, '/' );
}
function listCssEntriesRecursively( dirAbs ) {
	const out = [];
	( function walk( d ) {
		for ( const ent of readdirSync( d, { withFileTypes: true } ) ) {
			const abs = path.join( d, ent.name );
			if ( ent.isDirectory() ) {
				walk( abs );
				continue;
			}
			if (
				ent.isFile() &&
				abs.endsWith( '.css' ) &&
				! path.basename( abs ).startsWith( '_' )
			) {
				out.push( abs );
			}
		}
	} )( dirAbs );
	return out;
}

// ------------------------------ targets via Browserslist ------------------------------
function getDynamicTargets() {
	const cwd = process.cwd();
	try {
		const queries =
			browserslist.loadConfig( { path: cwd } ) || browserslist.defaults;
		const resolved = browserslist( queries, { path: cwd } )
			.filter( ( s ) => ! /^node\s/i.test( s ) ) // drop Node targets
			.filter( ( s ) => ! /\bop_mini\b/i.test( s ) ) // drop op_mini all
			.map( ( s ) => s.replace( /\bTP\b/gi, '999' ) ); // Safari TP → high version
		if ( resolved.length ) {
			return browserslistToTargets( resolved );
		}
	} catch ( e ) {
		console.warn(
			'[build-css] Browserslist targets unavailable, using Lightning defaults:',
			e?.message || e
		);
	}
	return undefined; // lets Lightning CSS choose defaults
}
const TARGETS = getDynamicTargets();

// ------------------------------ resolver helpers ------------------------------
function resolveLocalImport( specifier, from ) {
	if (
		/^(https?:)?\/\//.test( specifier ) ||
		specifier.startsWith( 'data:' )
	) {
		const err = new Error(
			`URL imports are not supported: "${ specifier }" from "${ from }"`
		);
		err.name = 'ResolverError';
		throw err;
	}
	const base = path.isAbsolute( specifier )
		? specifier
		: path.resolve( path.dirname( from ), specifier );
	const dir = path.dirname( base );
	const name = path.basename( base );
	const candidates = [
		base,
		base.endsWith( '.css' ) ? null : `${ base }.css`,
		name.startsWith( '_' ) ? null : path.join( dir, `_${ name }` ),
		name.startsWith( '_' ) || base.endsWith( '.css' )
			? null
			: path.join( dir, `_${ name }.css` ),
		path.join( base, 'index.css' ),
	].filter( Boolean );
	for ( const c of candidates ) {
		if ( isFile( c ) ) {
			return c;
		}
	}
	const tried = candidates.join( '\n  - ' );
	const err = new Error(
		`Failed to resolve @import "${ specifier }" from "${ from }". Tried:\n  - ${ tried }`
	);
	err.name = 'ResolverError';
	throw err;
}

function readCssFile( filePath ) {
	if ( ! isFile( filePath ) ) {
		const e = new Error( `Cannot read file: ${ filePath }` );
		e.name = 'ResolverError';
		throw e;
	}
	let content = readFileSync( filePath, 'utf8' );
	if ( typeof replaceInlineCSS === 'function' ) {
		try {
			content = replaceInlineCSS( content );
		} catch {
			// Ignore hook errors to keep the build resilient
		}
	}
	return Buffer.from( content );
}

// ------------------------------ virtual entry ------------------------------
function createVirtualEntry( realEntryAbs ) {
	ensureDir( VIRTUAL_DIR );
	const virtualEntry = path.join(
		VIRTUAL_DIR,
		`${ path.basename( realEntryAbs, '.css' ) }.entry.css`
	);
	let src = '';
	if ( isFile( CUSTOM_MEDIA_ABS ) ) {
		src += `@import "${ toPosix( CUSTOM_MEDIA_ABS ) }";\n`;
	}
	src += `@import "${ toPosix( realEntryAbs ) }";\n`;
	writeFileSync( virtualEntry, src );
	return virtualEntry;
}
function cleanupVirtualEntry( virtualEntry ) {
	try {
		rmSync( virtualEntry, { force: true } );
	} catch {}
}

// ------------------------------ bundling ------------------------------
function bundleCss( entryFilename ) {
	return bundle( {
		filename: entryFilename,
		projectRoot: process.cwd(),
		minify: ! isDev,
		sourceMap: isDev,
		errorRecovery: true,
		targets: TARGETS, // undefined → Lightning defaults
		drafts: { customMedia: true, nesting: true },
		resolver: {
			read: ( filePath ) => readCssFile( filePath ),
			resolve: ( specifier, from ) =>
				resolveLocalImport( specifier, from ),
		},
	} );
}

function writeArtifacts( outAbs, code, map ) {
	ensureDir( path.dirname( outAbs ) );
	writeFileSync( outAbs, code );
	if ( isDev && map ) {
		const mapPath = `${ outAbs }.map`;
		writeFileSync( mapPath, map );
		writeFileSync(
			outAbs,
			Buffer.concat( [
				Buffer.isBuffer( code ) ? code : Buffer.from( code ),
				Buffer.from(
					`\n/*# sourceMappingURL=${ path.basename( mapPath ) } */\n`
				),
			] )
		);
	}
}

// ------------------------------ build steps ------------------------------
function buildEntry( realEntryAbs, outAbs ) {
	const virtualEntry = createVirtualEntry( realEntryAbs );
	try {
		const { code, map } = bundleCss( virtualEntry );
		writeArtifacts( outAbs, code, map );
		return true;
	} finally {
		cleanupVirtualEntry( virtualEntry );
	}
}

function buildDir( srcRootAbs, outRootAbs ) {
	const entries = listCssEntriesRecursively( srcRootAbs );
	entries.forEach( ( entryAbs ) => {
		const rel = path.relative( srcRootAbs, entryAbs );
		const outRel = path.join(
			path.dirname( rel ),
			`${ path.basename( rel, '.css' ) }.min.css`
		);
		const outAbs = path.resolve( outRootAbs, outRel );
		buildEntry( entryAbs, outAbs );
	} );
}

// ------------------------------ entry point ------------------------------
( function run() {
	const pairs = Math.max( SRC_DIRS.length, OUT_ROOTS.length );
	for ( let i = 0; i < pairs; i++ ) {
		const srcDir = SRC_DIRS[ i ] ?? SRC_DIRS[ SRC_DIRS.length - 1 ];
		const outDir = OUT_ROOTS[ i ] ?? OUT_ROOTS[ OUT_ROOTS.length - 1 ];
		if ( ! srcDir || ! outDir ) {
			continue;
		}

		const srcAbs = path.resolve( process.cwd(), srcDir );
		const outAbs = path.resolve( process.cwd(), outDir );
		if ( ! isDir( srcAbs ) ) {
			continue;
		}

		ensureDir( outAbs );
		buildDir( srcAbs, outAbs );
	}
} )();
