/**
 * wp-theme-control (Node port) — clean scope.
 *
 * Deletes only database records whose exported files still match the
 * manifest sha256 (hash-verified safety). Refuses on hash drift, wrong post
 * type, or no-longer-unsynced patterns; --force bypasses the hash check
 * only.
 *
 * WP Rig fork note (SPEC-016 §2.3): the `user_styles_overlay` kind removes
 * config/user-styles.json (path-checked, never hash-checked — the overlay
 * is cumulative state both forks write) and font asset files are retained.
 */

import fs from 'fs';
import path from 'path';
import {
	assertThemeTarget,
	die,
	info,
	sha256File,
	wp,
	wpEval,
	GLOBAL_STYLES_RESET_EVAL,
	GLOBAL_STYLES_FONTS_RESET_EVAL,
	OVERLAY_RELATIVE_PATH,
} from './context.js';

/**
 * Runs the clean scope against a manifest.
 *
 * @param {Object} ctx          Loaded context (with parsed args).
 * @param {string} manifestPath Manifest TSV path.
 */
export function runClean( ctx, manifestPath ) {
	if ( ! manifestPath ) {
		die( 'clean requires a manifest path' );
	}
	if ( ! fs.existsSync( manifestPath ) ) {
		die( `manifest not found: ${ manifestPath }` );
	}

	const rows = fs
		.readFileSync( manifestPath, 'utf8' )
		.split( '\n' )
		.filter( ( line ) => line )
		.slice( 1 );

	let cleaned = 0;

	for ( const line of rows ) {
		const [ kind, recordId, slug, target, expectedHash ] =
			line.split( '\t' );

		if ( ! kind ) {
			continue;
		}
		if ( ! /^\d+$/.test( recordId ) ) {
			die( `invalid record ID in manifest: ${ recordId }` );
		}
		assertThemeTarget( ctx, target );

		// RIG FORK: the overlay is handled early — path-checked, never
		// hash-checked (a later run legitimately rewrites it), and already-
		// removed is fine (idempotent).
		if ( kind === 'user_styles_overlay' ) {
			if ( target !== path.join( ctx.themeDir, OVERLAY_RELATIVE_PATH ) ) {
				die( `unexpected overlay target: ${ target }` );
			}
			if ( ctx.dryRun ) {
				info( `would remove the user styles overlay ${ target }` );
			} else {
				fs.rmSync( target, { force: true } );
				info( 'removed user styles overlay (if present)' );
			}
			continue;
		}

		// RIG FORK: wp_global_styles / wp_global_styles_fonts rows exist to
		// carry the DB-reset record; their manifest target is theme.json,
		// which rig:tokens legitimately regenerates between bake and clean.
		// The record-ID verification below is the real safety, so these kinds
		// skip both the file-missing and hash checks.
		const isDbResetRow =
			kind === 'wp_global_styles' || kind === 'wp_global_styles_fonts';

		if ( ! isDbResetRow && ! fs.existsSync( target ) ) {
			die( `exported file is missing; refusing cleanup: ${ target }` );
		}
		if (
			! isDbResetRow &&
			ctx.force !== true &&
			sha256File( target ) !== expectedHash
		) {
			die(
				`exported file changed after export; refusing cleanup: ${ target }`
			);
		}

		if ( ctx.dryRun ) {
			info( `would clean ${ kind } record ${ recordId } (${ slug })` );
			continue;
		}

		switch ( kind ) {
			case 'font_asset':
				info( `verified font asset ${ target }` );
				continue;
			case 'runtime_pattern':
				info( `verified runtime pattern ${ target }` );
				continue;
			case 'wp_template':
			case 'wp_template_part': {
				const actualType = wp(
					ctx,
					[ 'post', 'get', recordId, '--field=post_type' ],
					{ capture: true }
				).trim();
				if ( actualType !== kind ) {
					die(
						`record ${ recordId } is ${ actualType }, expected ${ kind }`
					);
				}
				wp( ctx, [ 'post', 'delete', recordId, '--force' ], {
					capture: true,
				} );
				break;
			}
			case 'wp_block': {
				const actualType = wp(
					ctx,
					[ 'post', 'get', recordId, '--field=post_type' ],
					{ capture: true }
				).trim();
				if ( actualType !== 'wp_block' ) {
					die(
						`record ${ recordId } is ${ actualType }, expected wp_block`
					);
				}
				// Upstream tolerates a missing meta key (empty result → not
				// unsynced → refusal below); mirror that instead of dying on
				// the wp call itself.
				let syncStatus = '';
				try {
					syncStatus = wp(
						ctx,
						[
							'post',
							'meta',
							'get',
							recordId,
							'wp_pattern_sync_status',
						],
						{ capture: true }
					).trim();
				} catch ( error ) {
					syncStatus = '';
				}
				if ( syncStatus !== 'unsynced' ) {
					die(
						`pattern ${ recordId } is no longer unsynced; refusing cleanup`
					);
				}
				wp( ctx, [ 'post', 'delete', recordId, '--force' ], {
					capture: true,
				} );
				break;
			}
			case 'wp_global_styles': {
				const currentId = wpEval(
					ctx,
					'echo (int) WP_Theme_JSON_Resolver::get_user_global_styles_post_id();'
				).trim();
				if ( currentId !== recordId ) {
					die(
						`active theme Global Styles post changed (expected ${ recordId }, found ${ currentId })`
					);
				}
				wpEval( ctx, GLOBAL_STYLES_RESET_EVAL );
				break;
			}
			case 'wp_global_styles_fonts': {
				const currentId = wpEval(
					ctx,
					'echo (int) WP_Theme_JSON_Resolver::get_user_global_styles_post_id();'
				).trim();
				if ( currentId !== recordId ) {
					die(
						`active theme Global Styles post changed (expected ${ recordId }, found ${ currentId })`
					);
				}
				wpEval( ctx, GLOBAL_STYLES_FONTS_RESET_EVAL );
				break;
			}
			default:
				die( `unsupported manifest kind: ${ kind }` );
		}

		cleaned += 1;
		info( `cleaned ${ kind } record ${ recordId }` );
	}

	if ( ctx.dryRun ) {
		info( 'dry run complete; no database records changed' );
	} else {
		wp( ctx, [ 'cache', 'flush' ], { capture: true } );
		info( `cleaned ${ cleaned } database record(s)` );
	}
}
