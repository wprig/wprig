/**
 * WP Rig Bake & Sync Task (`rig:bake`)
 *
 * Drives the Node port of wp-theme-control (bin/wp-theme-control/) so Site
 * Editor database changes — unsynced patterns, custom templates/parts, Font
 * Library activations, and Global Styles — can be baked into the theme's
 * version-controlled files and reviewed as a git diff.
 *
 * Paradigm gate: block-based workflows only (SPEC-015 D5). The task refuses
 * with guidance when theme.themeType is 'classic'.
 *
 * WP Rig layers on top of upstream:
 * 1. The baked-pattern header (`Baked: yes`) injected into every pattern file
 *    written this run, parsed from the run manifest (idempotent).
 * 2. The empty-state overlay rule: config/user-styles.json is deleted when a
 *    bake captured neither style nor font changes (SPEC-016 §2.2).
 *
 * See .ai/plans/SPEC-015-rig-bake-integration.md and
 * .ai/plans/SPEC-016-user-styles-overlay.md.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { isFeatureEnabled } from '../lib/paradigm.js';
import { logger } from '../lib/rig-utils.js';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const themeRoot = path.resolve( __dirname, '../..' );

const WP_ROOT_MARKER = 'wp-settings.php';
const STATE_DIR_DEFAULT = '.wp-theme-control';
const BAKED_MARKER = 'Baked: yes';
const BAKED_PATTERN_KINDS = new Set( [ 'wp_block', 'runtime_pattern' ] );
const OVERLAY_RELATIVE_PATH = path.join( 'config', 'user-styles.json' );

/**
 * Valid bake scopes for the Node port of wp-theme-control
 * (bin/wp-theme-control/index.js).
 *
 * @param {string} scope Bake scope.
 * @return {string} The validated scope.
 */
export function resolveBakeScope( scope ) {
	const valid = [
		'all',
		'plan',
		'patterns',
		'templates',
		'fonts',
		'styles',
		'clean',
	];

	if ( ! valid.includes( scope ) ) {
		throw new Error(
			`Unknown bake scope "${ scope }". Valid scopes: ${ valid.join(
				', '
			) }.`
		);
	}

	return scope;
}

/**
 * Walks up from a start directory looking for a WordPress root (the
 * directory containing wp-settings.php).
 *
 * @param {string} startDir Directory to walk up from.
 * @return {string|null} Absolute WordPress root, or null when not found.
 */
export function findWpRoot( startDir ) {
	let current = path.resolve( startDir );

	while ( true ) {
		if ( fs.existsSync( path.join( current, WP_ROOT_MARKER ) ) ) {
			return current;
		}

		const parent = path.dirname( current );
		if ( parent === current ) {
			return null;
		}
		current = parent;
	}
}

/**
 * Extracts an explicit --path= passthrough argument, if any.
 *
 * @param {string[]} passthrough Raw passthrough arguments.
 * @return {string|null} The explicit WP root path, or null.
 */
export function extractExplicitPath( passthrough = [] ) {
	const arg = passthrough.find( ( value ) => value.startsWith( '--path=' ) );

	return arg ? arg.slice( '--path='.length ) || null : null;
}

/**
 * Parses the run manifest TSV and returns the pattern file targets written
 * this run (kinds wp_block and runtime_pattern).
 *
 * @param {string} manifestContent Raw manifest TSV content.
 * @return {string[]} Absolute file paths of baked pattern files.
 */
export function parseManifestTargets( manifestContent ) {
	const lines = manifestContent.split( '\n' ).filter( ( line ) => line );
	const targets = [];

	for ( const line of lines.slice( 1 ) ) {
		const [ kind, , , target ] = line.split( '\t' );

		if ( BAKED_PATTERN_KINDS.has( kind ) && target ) {
			targets.push( target );
		}
	}

	return targets;
}

/**
 * Injects the ` * Baked: yes` marker into a pattern file's docblock.
 * Idempotent: a file already marked is returned unchanged.
 *
 * @param {string} content Raw pattern file content.
 * @return {string} Content with the baked marker injected.
 */
export function injectBakedHeader( content ) {
	if ( content.includes( ` * ${ BAKED_MARKER }` ) ) {
		return content;
	}

	const docblockOpen = content.match( /^<\?php\s*\n\/\*\*\s*\n/ );

	if ( ! docblockOpen ) {
		return content;
	}

	const insertAt = docblockOpen[ 0 ].length;

	return (
		content.slice( 0, insertAt ) +
		` * ${ BAKED_MARKER }\n` +
		content.slice( insertAt )
	);
}

/**
 * Determines whether an overlay object is empty (no captured settings,
 * styles, or fonts) per the SPEC-016 §2.2 empty-state rule.
 *
 * @param {Object|null} overlay Parsed config/user-styles.json content.
 * @return {boolean} True when the overlay carries no user data.
 */
export function isOverlayEmpty( overlay ) {
	if ( ! overlay || typeof overlay !== 'object' ) {
		return true;
	}

	const hasEntries = ( value ) =>
		Boolean( value ) &&
		typeof value === 'object' &&
		Object.keys( value ).length > 0;

	const fonts = overlay.fonts || {};

	return (
		! hasEntries( overlay.settings ) &&
		! hasEntries( overlay.styles ) &&
		! hasEntries( fonts.themeFamilies ) &&
		! hasEntries( fonts.customFamilies )
	);
}

/**
 * Collects baked-pattern targets from every run manifest in the state
 * directory. Marker injection is idempotent, so targets from older runs are
 * harmless — and an `all` bake writes multiple manifests (templates'
 * runtime_pattern rows land in a different manifest than the patterns run).
 *
 * @param {string} root     Theme root (or any base) containing .wp-theme-control/.
 * @param {string} stateDir State directory (default .wp-theme-control).
 * @return {string[]} Union of pattern targets across manifests.
 */
function readAllManifestTargets( root, stateDir = STATE_DIR_DEFAULT ) {
	const runsDir = path.join( root, stateDir, 'runs' );

	if ( ! fs.existsSync( runsDir ) ) {
		return [];
	}

	const targets = new Set();

	for ( const entry of fs.readdirSync( runsDir ) ) {
		const manifestPath = path.join( runsDir, entry, 'manifest.tsv' );

		if ( ! fs.existsSync( manifestPath ) ) {
			continue;
		}

		for ( const target of parseManifestTargets(
			fs.readFileSync( manifestPath, 'utf8' )
		) ) {
			targets.add( target );
		}
	}

	return [ ...targets ];
}

/**
 * Applies the WP Rig post-bake layer after a successful patterns/templates/
 * all bake: injects the Baked header into written pattern files and prunes
 * an empty overlay.
 *
 * @param {string}   root      Theme root.
 * @param {string[]} scopes    Scopes that just ran successfully.
 * @param {Object}   [options] { manifestContent, spawnless (testing) }.
 * @return {string[]} Injected file paths.
 */
export function runPostBakeLayer( root, scopes, options = {} ) {
	const injected = [];
	const touchesPatternTargets =
		scopes.includes( 'patterns' ) ||
		scopes.includes( 'templates' ) ||
		scopes.includes( 'all' );

	if ( touchesPatternTargets ) {
		const manifestContent = options.manifestContent;
		const targets = manifestContent
			? parseManifestTargets( manifestContent )
			: readAllManifestTargets( root );

		for ( const target of targets ) {
			if ( ! fs.existsSync( target ) ) {
				continue;
			}

			const original = fs.readFileSync( target, 'utf8' );
			const updated = injectBakedHeader( original );

			if ( updated !== original ) {
				fs.writeFileSync( target, updated );
				injected.push( target );
			}
		}
	}

	// Empty-state rule (SPEC-016 §2.2): a bake that captured neither style
	// nor font changes deletes the overlay instead of leaving an empty file.
	const stylesOrFonts =
		scopes.includes( 'styles' ) ||
		scopes.includes( 'fonts' ) ||
		scopes.includes( 'all' );

	if ( stylesOrFonts ) {
		const overlayPath = path.join( root, OVERLAY_RELATIVE_PATH );

		if ( fs.existsSync( overlayPath ) ) {
			const overlay = JSON.parse(
				fs.readFileSync( overlayPath, 'utf8' )
			);

			if ( isOverlayEmpty( overlay ) ) {
				fs.rmSync( overlayPath );
				logger.info(
					`No baked style or font changes — removed empty ${ OVERLAY_RELATIVE_PATH }.`
				);
			}
		}
	}

	return injected;
}

/**
 * Prints the classic-paradigm guidance message (SPEC-015 §6).
 *
 * @return {string} The guidance message.
 */
export function classicGateMessage() {
	return (
		'rig:bake is a block-theme workflow (tag: block-based). ' +
		'Switch themeType to "universal" or "block-based" in config/config.json ' +
		'to bake Site Editor changes into the theme.'
	);
}

/**
 * Runs one bake scope.
 *
 * @param {string} [scope]   Bake scope (default 'all').
 * @param {Object} [options] { passthrough: string[], spawnFn, root }.
 * @return {Promise<number>} Process exit code (0 success, 1 failure).
 */
export async function bakeSync( scope = 'all', options = {} ) {
	const passthrough = options.passthrough || [];
	const root = options.root || themeRoot;
	const spawnFn = options.spawnFn || spawn;

	if ( ! isFeatureEnabled( 'block-based' ) ) {
		logger.error( classicGateMessage() );
		return 1;
	}

	const explicitPath = extractExplicitPath( passthrough );
	const wpRoot = explicitPath || findWpRoot( process.cwd() );

	if ( ! wpRoot ) {
		logger.error(
			'Could not find a WordPress install (no wp-settings.php above the ' +
				'current directory). Run inside a WordPress install or pass ' +
				'--path=/path/to/wordpress.'
		);
		return 1;
	}

	const toolPath = path.join( root, 'bin', 'wp-theme-control', 'index.js' );

	if ( ! fs.existsSync( toolPath ) ) {
		logger.error(
			`The bake tool is missing: ${ path.relative( root, toolPath ) }. ` +
				'See docs/block-based-theme.md for the expected layout.'
		);
		return 1;
	}

	const args = [ toolPath, resolveBakeScope( scope ), ...passthrough ];

	if ( ! explicitPath ) {
		args.push( `--path=${ wpRoot }` );
	}

	const exitCode = await new Promise( ( resolve ) => {
		const child = spawnFn( process.execPath, args, {
			cwd: root,
			stdio: 'inherit',
		} );
		child.on( 'exit', ( code ) => resolve( code ?? 1 ) );
		child.on( 'error', () => resolve( 1 ) );
	} );

	if ( exitCode !== 0 ) {
		return exitCode;
	}

	if ( passthrough.includes( '--dry-run' ) ) {
		return 0;
	}

	const appliedScopes = scope === 'all' ? [ 'all' ] : [ scope ];
	runPostBakeLayer( root, appliedScopes );

	return 0;
}
