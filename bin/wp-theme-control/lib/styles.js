/**
 * wp-theme-control (Node port) — styles scope (WP Rig fork, SPEC-016 §4).
 *
 * Captures the RAW user Global Styles data into the settings/styles blocks
 * of config/user-styles.json (never merged into theme.json — tokens.js is
 * the sole writer). The local-absolute-URL check is kept but report-only:
 * URLs are flagged so the developer moves that media into block markup.
 */

import fs from 'fs';
import path from 'path';
import {
	assertThemeTarget,
	createRun,
	die,
	finishRun,
	info,
	installFile,
	manifestAdd,
	warn,
	wpEval,
	GLOBAL_STYLES_STATUS_EVAL,
	RAW_USER_STYLES_EVAL,
	OVERLAY_RELATIVE_PATH,
} from './context.js';
import { probeRuntimeUrls } from './runtime-urls.js';
import { buildStylesOverlay } from './overlay.js';
import { runClean } from './clean.js';
import { runFonts } from './fonts.js';

/**
 * Runs the styles scope. `fontsReady` mirrors the upstream WPCTL_FONTS_READY
 * handoff: when styles runs standalone it first invokes the fonts scope so
 * font bookkeeping is persisted before the styles capture.
 *
 * @param {Object} ctx       Loaded context (with parsed args).
 * @param {Object} [options] { fontsReady: boolean, runFonts: Function }.
 */
export function runStyles( ctx, options = {} ) {
	if ( ! options.fontsReady ) {
		runFonts( ctx );
	}

	const status = JSON.parse( wpEval( ctx, GLOBAL_STYLES_STATUS_EVAL ) );

	if ( status.has_style_changes !== true ) {
		info( 'no user Global Styles changes found' );
		return;
	}

	const recordId = String( status.id ?? '' );

	const target = path.join( ctx.themeDir, OVERLAY_RELATIVE_PATH );

	if ( ctx.dryRun ) {
		info(
			`would capture Global Styles post ${ recordId } into ${ target }`
		);
		return;
	}

	if ( ! /^\d+$/.test( recordId ) ) {
		die( `invalid Global Styles post ID: ${ recordId }` );
	}

	createRun( ctx, 'styles' );
	const staging = path.join( ctx.runDir, 'staging' );

	const raw = wpEval( ctx, RAW_USER_STYLES_EVAL );
	let userData;
	try {
		userData = JSON.parse( raw || '{}' );
	} catch ( error ) {
		die( 'WordPress produced invalid Global Styles data' );
	}

	const existingOverlay = fs.existsSync( target )
		? JSON.parse( fs.readFileSync( target, 'utf8' ) )
		: null;

	const overlay = buildStylesOverlay( existingOverlay, {
		userData,
		recordId,
		capturedAt: new Date().toISOString().replace( /\.\d+Z$/, 'Z' ),
	} );

	const stageOverlay = path.join( staging, 'user-styles.json' );
	fs.writeFileSync( stageOverlay, JSON.stringify( overlay, null, 2 ) + '\n' );

	// Report-only runtime URL gate: local absolute URLs must never reach the
	// JSON overlay (runtime PHP cannot be stored in JSON). The raw capture is
	// kept; the developer moves that media into block markup and re-bakes.
	const report = probeRuntimeUrls( ctx, stageOverlay, staging );
	if ( report.total > 0 ) {
		warn(
			`captured Global Styles contain ${ report.total } local absolute URL(s); ` +
				'runtime PHP cannot be stored in JSON — move that media into block markup and re-bake'
		);
	}

	installFile( ctx, stageOverlay, target );
	assertThemeTarget( ctx, target );
	manifestAdd( ctx, 'user_styles_overlay', recordId, ctx.themeSlug, target );
	manifestAdd(
		ctx,
		'wp_global_styles',
		recordId,
		ctx.themeSlug,
		path.join( ctx.themeDir, 'theme.json' )
	);
	info( `captured Global Styles post ${ recordId } -> ${ target }` );
	finishRun( ctx );

	if ( ctx.clean ) {
		runClean( ctx, ctx.manifest );
	}
}
