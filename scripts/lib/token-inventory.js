import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadTokens, normalizeTokens } from '../tasks/tokens.js';
import themeConfig from '../../config/themeConfig.js';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const defaultThemeRoot = path.resolve( __dirname, '../..' );

/**
 * Extracts every `--name:` declaration from CSS source.
 *
 * @param {string} css CSS source.
 * @return {Set<string>} Declared custom-property names.
 */
export function parseDeclaredCustomProperties( css ) {
	const names = new Set();
	const pattern = /(^|[^\w-])(--[\w-]+)\s*:/g;
	let match;

	while ( ( match = pattern.exec( css ) ) !== null ) {
		names.add( match[ 2 ] );
	}

	return names;
}

/**
 * Builds the set of custom-property names the generator emits (canonical,
 * structural, semantic light/dark, and legacy aliases).
 *
 * @param {Object} tokens v2 tokens.
 * @param {Object} [opts] Options (binding/legacyAliases).
 * @return {Object} { names: string[], values: Object, count: number }.
 */
export function buildTokenInventory( tokens, opts = {} ) {
	const plan = normalizeTokens( tokens, opts );
	const values = {};
	const names = new Set();

	for ( const list of [
		plan.primitives,
		plan.structure,
		plan.semanticLight,
		plan.semanticDark,
		plan.aliases,
	] ) {
		for ( const entry of list ) {
			names.add( entry.name );
			if ( ! ( entry.name in values ) ) {
				values[ entry.name ] = entry.value;
			}
		}
	}

	return {
		version: 2,
		names: [ ...names ].sort(),
		values,
		count: names.size,
	};
}

/**
 * Loads the effective inventory for a theme: generated names plus the
 * hand-authored names declared in `_tokens.custom.css`.
 *
 * @param {string} [themeRoot] Theme root (defaults to the WP Rig root).
 * @return {Object} { names: string[], values: Object, count: number }.
 */
export function loadTokenInventory( themeRoot = defaultThemeRoot ) {
	const tokens = loadTokens(
		JSON.parse(
			fs.readFileSync(
				path.join( themeRoot, 'config', 'tokens.json' ),
				'utf8'
			)
		)
	);
	// Respect the project's alias policy so the lint inventory matches what is
	// actually emitted (aliases are opt-in after the codemod).
	const legacyAliases =
		themeConfig?.theme?.designTokens?.legacyAliases !== false;
	const inventory = buildTokenInventory( tokens, { legacyAliases } );

	const customPath = path.join(
		themeRoot,
		'assets',
		'css',
		'src',
		'_tokens.custom.css'
	);
	if ( fs.existsSync( customPath ) ) {
		for ( const name of parseDeclaredCustomProperties(
			fs.readFileSync( customPath, 'utf8' )
		) ) {
			if ( ! inventory.names.includes( name ) ) {
				inventory.names.push( name );
			}
		}
		inventory.names.sort();
		inventory.count = inventory.names.length;
	}

	return inventory;
}

/**
 * Writes the inventory to `artifacts/token-inventory.json` (a byproduct for
 * tooling/debugging; the lint plugins compute it live).
 *
 * @param {Object} tokens      v2 tokens.
 * @param {Object} [opts]      Options.
 * @param {string} [themeRoot] Theme root.
 * @return {Promise<string>} Written path.
 */
export async function writeTokenInventory(
	tokens,
	opts = {},
	themeRoot = defaultThemeRoot
) {
	const fsExtra = ( await import( 'fs-extra' ) ).default;
	const outDir = path.join( themeRoot, 'artifacts' );
	const outPath = path.join( outDir, 'token-inventory.json' );

	const resolvedTokens =
		tokens ||
		loadTokens(
			JSON.parse(
				fs.readFileSync(
					path.join( themeRoot, 'config', 'tokens.json' ),
					'utf8'
				)
			)
		);

	const inventory = tokens
		? buildTokenInventory( resolvedTokens, opts )
		: loadTokenInventory( themeRoot );

	await fsExtra.ensureDir( outDir );
	await fsExtra.writeJson( outPath, inventory, { spaces: 2 } );

	return outPath;
}
