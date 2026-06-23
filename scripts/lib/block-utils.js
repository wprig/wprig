import path from 'node:path';
import fs from 'node:fs';
import fse from 'fs-extra';
import { spawn } from 'node:child_process';
import themeConfig from '../../config/themeConfig.js';

export const root = process.cwd();
export const blocksRoot = path.join( root, 'assets', 'blocks' );
export const defaultNamespace =
	themeConfig?.theme?.slug?.replace( /[^a-z0-9-]/gi, '-' ) || 'wprig';

/**
 * Checks if blocks are enabled in theme configuration.
 * Exits if not enabled.
 */
export function checkBlocksEnabled() {
	if ( ! themeConfig?.theme?.enableBlocks ) {
		console.error(
			'\x1b[31m%s\x1b[0m',
			'Error: Blocks are not enabled for this theme.'
		);
		console.log( 'To enable blocks, run: npm run theme:enable-blocks' );
		console.warn(
			'⚠️  Warning ⚠️ : Themes with included blocks will be rejected by the WordPress.org theme repository.'
		);
		process.exit( 1 );
	}
}

/**
 * Parses block name into namespace and slug.
 *
 * @param {string} input Block name in format <namespace>/<slug> or <slug>
 * @return {Object} { namespace, slug, full }
 */
export function parseName( input ) {
	if ( ! input ) {
		throw new Error(
			'Missing block name. Expected <namespace>/<slug> or <slug>.'
		);
	}
	const parts = String( input ).split( '/' );
	let ns, slug;
	if ( parts.length === 1 ) {
		slug = parts[ 0 ];
		ns = defaultNamespace;
	} else if ( parts.length === 2 ) {
		[ ns, slug ] = parts;
	} else {
		throw new Error(
			'Invalid name. Use <namespace>/<slug> (e.g., wprig/hero).'
		);
	}
	slug = slug
		.toLowerCase()
		.replace( /[^a-z0-9-]/g, '-' )
		.replace( /^-+|-+$/g, '' );
	ns = ns.toLowerCase().replace( /[^a-z0-9-]/g, '-' );
	if ( ! slug || ! ns ) {
		throw new Error( 'Invalid namespace or slug.' );
	}
	return { namespace: ns, slug, full: `${ ns }/${ slug }` };
}

/**
 * Ensures the blocks root directory exists.
 */
export function ensureBlocksRoot() {
	fse.ensureDirSync( blocksRoot );
}

/**
 * Checks if a path exists.
 *
 * @param {string} p Path to check
 * @return {boolean} True if exists
 */
export function pathExists( p ) {
	try {
		fs.accessSync( p );
		return true;
	} catch {
		return false;
	}
}

/**
 * Executes @wordpress/create-block command.
 *
 * @param {string} cwd  Working directory
 * @param {Array}  args Command arguments
 * @return {Promise} Resolves on success
 */
export function execCreateBlock( cwd, args ) {
	const bin = path.join( root, 'node_modules', '.bin', 'create-block' );
	const cmd = pathExists( bin ) ? bin : 'npx';
	const finalArgs = pathExists( bin )
		? args
		: [ '-y', '@wordpress/create-block', ...args ];
	return new Promise( ( resolve, reject ) => {
		const child = spawn( cmd, finalArgs, {
			cwd,
			stdio: 'inherit',
			shell: process.platform === 'win32',
		} );
		child.on( 'exit', ( code ) =>
			code === 0
				? resolve()
				: reject(
						new Error( `create-block failed with code ${ code }` )
				  )
		);
	} );
}

/**
 * Decodes HTML entities in a string.
 *
 * @param {string} text Text to decode
 * @return {string} Decoded text
 */
export function decodeHtmlEntities( text ) {
	if ( ! text || typeof text !== 'string' ) {
		return text;
	}

	return text
		.replace( /&quot;/g, '"' )
		.replace( /&amp;/g, '&' )
		.replace( /&lt;/g, '<' )
		.replace( /&gt;/g, '>' )
		.replace( /&#39;/g, "'" );
}

/**
 * Removes stray subfolders created by @wordpress/create-block.
 *
 * @param {string} blockDir Block directory
 */
export async function cleanupCreateBlockArtifacts( blockDir ) {
	try {
		const normalize = ( s ) =>
			String( s || '' )
				.toLowerCase()
				.replace( /[^a-z0-9-]/g, '-' )
				.replace( /^-+|-+$/g, '' );
		const candidates = [];
		const themeSlug = normalize( themeConfig?.theme?.slug || '' );
		if ( themeSlug ) {
			candidates.push( themeSlug );
		}
		const projectDir = normalize( path.basename( root ) || '' );
		if ( projectDir ) {
			candidates.push( projectDir );
		}

		const entries = fs.readdirSync( blockDir, { withFileTypes: true } );
		for ( const ent of entries ) {
			if ( ! ent.isDirectory() ) {
				continue;
			}
			const name = ent.name;
			if ( [ 'src', 'build' ].includes( name ) ) {
				continue;
			}
			if ( candidates.includes( name ) ) {
				await fse.remove( path.join( blockDir, name ) );
			}
		}
	} catch {
		// best-effort cleanup
	}
}
