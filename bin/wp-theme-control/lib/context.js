/**
 * wp-theme-control (Node port) — shared context and safety primitives.
 *
 * Node migration of upstream bacoords/wp-theme-control (Bash + WP-CLI),
 * pinned upstream SHA 0820d96567a912320df7b1cdc102605376a69edf. The port
 * preserves the upstream contract: manifest-first writes with sha256
 * verification, per-run staging/backups, safe-slug guards, theme-target
 * enforcement, and the same WP-CLI eval payloads.
 *
 * WP Rig fork notes (SPEC-016): the fonts/styles scopes write the
 * config/user-styles.json overlay instead of theme.json; see fonts.js and
 * styles.js.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawnSync } from 'child_process';

export const MANIFEST_HEADER = 'kind\trecord_id\tslug\ttarget\tsha256\n';
export const OVERLAY_RELATIVE_PATH = path.join( 'config', 'user-styles.json' );
export const OVERLAY_COMMENT =
	'Baked by rig:bake from Site Editor Global Styles. Merged over tokens by ' +
	'buildThemeJson(). Do not hand-edit while the DB copy still exists — ' +
	're-bake or edit in the editor.';

/**
 * Thrown for any refused operation (upstream wpctl_die semantics).
 */
export class BakeError extends Error {}

export function die( message ) {
	throw new BakeError( message );
}

export function info( message ) {
	// eslint-disable-next-line no-console
	console.log( `wp-theme-control: ${ message }` );
}

export function warn( message ) {
	// eslint-disable-next-line no-console
	console.warn( `wp-theme-control: warning: ${ message }` );
}

/**
 * Parses the common option set shared by every scope.
 *
 * @param {string[]} argv Raw scope arguments.
 * @return {{wpGlobalArgs: string[], stateDir: string, dryRun: boolean, clean: boolean, force: boolean, rest: string[]}} Parsed options.
 */
export function parseCommonArgs( argv = [] ) {
	const parsed = {
		wpGlobalArgs: [],
		stateDir: path.join( process.cwd(), '.wp-theme-control' ),
		dryRun: false,
		clean: false,
		force: false,
		rest: [],
	};

	for ( const arg of argv ) {
		if (
			arg.startsWith( '--path=' ) ||
			arg.startsWith( '--url=' ) ||
			arg.startsWith( '--user=' )
		) {
			parsed.wpGlobalArgs.push( arg );
		} else if ( arg.startsWith( '--state-dir=' ) ) {
			const value = arg.slice( '--state-dir='.length );
			if ( ! value ) {
				die( '--state-dir cannot be empty' );
			}
			parsed.stateDir = value;
		} else if ( arg === '--dry-run' ) {
			parsed.dryRun = true;
		} else if ( arg === '--clean' ) {
			parsed.clean = true;
		} else if ( arg === '--force' ) {
			parsed.force = true;
		} else {
			parsed.rest.push( arg );
		}
	}

	return parsed;
}

/**
 * Runs a WP-CLI command and returns the raw result instead of dying on
 * failure (graceful-degradation paths, e.g. the template export fallback).
 *
 * @param {Object}   ctx  Loaded context.
 * @param {string[]} args WP-CLI subcommand + arguments.
 * @return {{ok: boolean, status: number|null, stdout: string, stderr: string}} Result.
 */
export function wpTry( ctx, args ) {
	const result = spawnSync( 'wp', [ ...ctx.globalArgs, ...args ], {
		encoding: 'utf8',
		env: process.env,
	} );

	if ( result.error ) {
		return {
			ok: false,
			status: null,
			stdout: '',
			stderr: result.error.message,
		};
	}

	return {
		ok: result.status === 0,
		status: result.status,
		stdout: result.stdout ?? '',
		stderr: result.stderr ?? '',
	};
}

/**
 * Runs a WP-CLI command. Global args (--path/--url/--user) come first,
 * mirroring the upstream wp_cmd helper.
 *
 * @param {Object}   ctx    Loaded context.
 * @param {string[]} args   WP-CLI subcommand + arguments.
 * @param {Object}   [opts] { capture, env } — capture stdout instead of
 *                          inheriting; env entries merged into the child env.
 * @return {string} Stdout (captured mode) or ''.
 */
export function wp( ctx, args, opts = {} ) {
	const env = opts.env ? { ...process.env, ...opts.env } : process.env;
	const result = spawnSync(
		'wp',
		[ ...ctx.globalArgs, ...args ],
		opts.capture ? { encoding: 'utf8', env } : { stdio: 'inherit', env }
	);

	if ( result.error ) {
		die( `failed to run wp: ${ result.error.message }` );
	}

	if ( result.status !== 0 ) {
		if ( opts.capture && result.stderr ) {
			process.stderr.write( result.stderr );
		}
		die( `wp command failed: wp ${ args.join( ' ' ) }` );
	}

	return opts.capture ? result.stdout : '';
}

/**
 * Runs a PHP snippet through WP-CLI eval and returns stdout.
 *
 * @param {Object} ctx  Loaded context.
 * @param {string} code PHP code.
 * @return {string} Eval stdout.
 */
export function wpEval( ctx, code ) {
	return wp( ctx, [ 'eval', code ], { capture: true } );
}

const IS_BLOCK_THEME_EVAL =
	'if ( ! wp_is_block_theme() ) { fwrite( STDERR, "The active theme is not a block theme.\\n" ); exit( 1 ); }';

/**
 * Loads the shared context: verifies the site + block theme, and resolves
 * the active theme slug and directory.
 *
 * @param {Object} parsed Parsed common args (parseCommonArgs output).
 * @return {Object} Context { globalArgs, stateDir, dryRun, clean, force, rest, themeSlug, themeDir }.
 */
export function loadContext( parsed ) {
	const ctx = {
		globalArgs: parsed.wpGlobalArgs,
		stateDir: parsed.stateDir,
		dryRun: parsed.dryRun,
		clean: parsed.clean,
		force: parsed.force,
		rest: parsed.rest,
		runDir: '',
		manifest: '',
	};

	wp( ctx, [ 'core', 'is-installed' ], { capture: true } );

	const blockThemeCheck = spawnSync(
		'wp',
		[ ...ctx.globalArgs, 'eval', IS_BLOCK_THEME_EVAL ],
		{ encoding: 'utf8', env: process.env }
	);
	if ( blockThemeCheck.status !== 0 ) {
		die( 'the active theme is not a block theme' );
	}

	ctx.themeSlug = wp( ctx, [ 'option', 'get', 'stylesheet' ], {
		capture: true,
	} ).trim();
	ctx.themeDir = wpEval( ctx, 'echo get_stylesheet_directory();' ).trim();

	if ( ! ctx.themeSlug ) {
		die( 'could not resolve the active theme stylesheet' );
	}
	if ( ! fs.existsSync( ctx.themeDir ) ) {
		die( `active theme directory does not exist: ${ ctx.themeDir }` );
	}
	if ( ! path.isAbsolute( ctx.themeDir ) ) {
		die(
			`WordPress returned a non-absolute theme directory: ${ ctx.themeDir }`
		);
	}

	return ctx;
}

/**
 * Creates a per-run staging + backup directory and a fresh manifest.
 *
 * @param {Object} ctx   Context.
 * @param {string} label Run label (scope name).
 */
export function createRun( ctx, label ) {
	const stamp = new Date()
		.toISOString()
		.replace( /[-:]/g, '' )
		.replace( /\.\d+Z$/, 'Z' );
	ctx.runDir = path.join(
		ctx.stateDir,
		'runs',
		`${ stamp }-${ label }-${ process.pid }`
	);
	fs.mkdirSync( path.join( ctx.runDir, 'staging' ), { recursive: true } );
	fs.mkdirSync( path.join( ctx.runDir, 'backups' ), { recursive: true } );
	ctx.manifest = path.join( ctx.runDir, 'manifest.tsv' );
	fs.writeFileSync( ctx.manifest, MANIFEST_HEADER );
}

/**
 * Appends a row to the run manifest with the sha256 of the written target.
 *
 * @param {Object} ctx      Context with an open run.
 * @param {string} kind     Manifest kind.
 * @param {string} recordId DB record id.
 * @param {string} slug     Slug.
 * @param {string} target   Written file path.
 */
export function manifestAdd( ctx, kind, recordId, slug, target ) {
	const hash = sha256File( target );
	fs.appendFileSync(
		ctx.manifest,
		[ kind, recordId, slug, target, hash ].join( '\t' ) + '\n'
	);
}

export function sha256File( filePath ) {
	return crypto
		.createHash( 'sha256' )
		.update( fs.readFileSync( filePath ) )
		.digest( 'hex' );
}

/**
 * Refuses to write outside the active theme directory.
 *
 * @param {Object} ctx    Context.
 * @param {string} target Target path.
 */
export function assertThemeTarget( ctx, target ) {
	if ( ! target.startsWith( ctx.themeDir + path.sep ) ) {
		die( `refusing to write outside the active theme: ${ target }` );
	}
}

/**
 * Asserts a slug is safe to use as a file path component (upstream
 * wpctl_assert_safe_slug).
 *
 * @param {string} slug Slug returned by WordPress.
 */
export function assertSafeSlug( slug ) {
	if (
		! slug ||
		! /^[a-z0-9][a-z0-9._-]*$/.test( slug ) ||
		slug.startsWith( '.' ) ||
		slug.includes( '..' )
	) {
		die( `unsafe slug returned by WordPress: ${ slug }` );
	}
}

/**
 * Installs a staged file into the theme: backs up any existing target into
 * the run's backups directory, then copies atomically.
 *
 * @param {Object} ctx    Context with an open run.
 * @param {string} source Staged source path.
 * @param {string} target Theme target path.
 */
export function installFile( ctx, source, target ) {
	assertThemeTarget( ctx, target );
	const relative = path.relative( ctx.themeDir, target );

	if ( fs.existsSync( target ) ) {
		const backup = path.join( ctx.runDir, 'backups', relative );
		fs.mkdirSync( path.dirname( backup ), { recursive: true } );
		fs.copyFileSync( target, backup );
	}

	fs.mkdirSync( path.dirname( target ), { recursive: true } );
	const tempTarget = `${ target }.wp-theme-control.${ process.pid }`;
	fs.copyFileSync( source, tempTarget );
	fs.renameSync( tempTarget, target );
}

/**
 * Prints the run summary (upstream wpctl_finish_run).
 *
 * @param {Object} ctx Context with an open run.
 */
export function finishRun( ctx ) {
	const count =
		fs
			.readFileSync( ctx.manifest, 'utf8' )
			.split( '\n' )
			.filter( ( line ) => line ).length - 1;
	info( `wrote ${ count } artifact(s)` );
	info( `manifest: ${ ctx.manifest }` );
	info( `backups: ${ path.join( ctx.runDir, 'backups' ) }` );
}

/**
 * Shared eval payloads (verbatim behavior with upstream common.sh).
 */

export const TEMPLATE_INVENTORY_EVAL = `
$result = array();
foreach ( array( "wp_template", "wp_template_part" ) as $type ) {
	foreach ( get_block_templates( array(), $type ) as $template ) {
		if ( "custom" !== $template->source ) {
			continue;
		}
		$result[] = array(
			"type"  => $type,
			"id"    => $template->id,
			"wp_id" => (int) $template->wp_id,
			"slug"  => $template->slug,
			"title" => $template->title,
		);
	}
}
echo wp_json_encode( $result );`;

export const THEME_FOLDERS_EVAL = `
$folders = function_exists( "get_block_theme_folders" ) ? get_block_theme_folders( get_stylesheet() ) : array();
echo wp_json_encode( array(
	"wp_template"      => isset( $folders["theme"] ) ? $folders["theme"] : "templates",
	"wp_template_part" => isset( $folders["templateParts"] ) ? $folders["templateParts"] : "parts",
) );`;

export const GLOBAL_STYLES_STATUS_EVAL = `
$id = (int) WP_Theme_JSON_Resolver::get_user_global_styles_post_id();
$raw = $id ? json_decode( get_post_field( "post_content", $id ), true ) : array();
$style_raw = $raw;
unset( $style_raw["settings"]["typography"]["fontFamilies"] );
if ( empty( $style_raw["settings"]["typography"] ) ) {
	unset( $style_raw["settings"]["typography"] );
}
echo wp_json_encode( array(
	"id"                => $id,
	"has_changes"       => ! empty( $raw["settings"] ) || ! empty( $raw["styles"] ),
	"has_style_changes" => ! empty( $style_raw["settings"] ) || ! empty( $style_raw["styles"] ),
) );`;

export const FONT_SETTINGS_EVAL = `
$resolver = class_exists( "WP_Theme_JSON_Resolver_Gutenberg" ) ? "WP_Theme_JSON_Resolver_Gutenberg" : "WP_Theme_JSON_Resolver";
$settings = $resolver::get_user_data()->get_settings();
$font_dir = wp_get_font_dir();
echo wp_json_encode( array(
	"id"       => (int) WP_Theme_JSON_Resolver::get_user_global_styles_post_id(),
	"theme"    => isset( $settings["typography"]["fontFamilies"]["theme"] ) ? $settings["typography"]["fontFamilies"]["theme"] : null,
	"custom"   => isset( $settings["typography"]["fontFamilies"]["custom"] ) ? $settings["typography"]["fontFamilies"]["custom"] : null,
	"font_dir" => array( "path" => $font_dir["path"], "url" => $font_dir["url"] ),
) );`;

export const CAPTURE_USER_STYLES_EVAL = `
$resolver = class_exists( "WP_Theme_JSON_Resolver_Gutenberg" ) ? "WP_Theme_JSON_Resolver_Gutenberg" : "WP_Theme_JSON_Resolver";
$user_data = $resolver::get_user_data()->get_raw_data();
unset( $user_data["isGlobalStylesUserThemeJSON"] );
unset( $user_data["version"] );
unset( $user_data[ chr( 36 ) . "schema" ] );
unset( $user_data["settings"]["viewport"] );
unset( $user_data["settings"]["blockVisibility"] );
unset( $user_data["settings"]["typography"]["fontFamilies"] );
if ( isset( $user_data["settings"]["typography"] ) && empty( $user_data["settings"]["typography"] ) ) {
	unset( $user_data["settings"]["typography"] );
}
echo wp_json_encode( $user_data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );`;

export const CLEAR_PATTERN_CACHE_EVAL = `
$theme = wp_get_theme();
if ( method_exists( $theme, "delete_pattern_cache" ) ) {
	$theme->delete_pattern_cache();
}`;

export const GLOBAL_STYLES_RESET_EVAL = `
$id = (int) WP_Theme_JSON_Resolver::get_user_global_styles_post_id();
$controller = new WP_REST_Global_Styles_Controller();
$request = new WP_REST_Request( "PUT", "/wp/v2/global-styles/" );
$request->set_param( "id", $id );
$request->set_param( "settings", array() );
$request->set_param( "styles", array() );
$response = $controller->update_item( $request );
if ( is_wp_error( $response ) ) {
	fwrite( STDERR, $response->get_error_message() . "\\n" );
	exit( 1 );
}
delete_transient( "global_styles" );
delete_transient( "global_styles_" . get_stylesheet() );`;

export const GLOBAL_STYLES_FONTS_RESET_EVAL = `
$resolver = class_exists( "WP_Theme_JSON_Resolver_Gutenberg" ) ? "WP_Theme_JSON_Resolver_Gutenberg" : "WP_Theme_JSON_Resolver";
$settings = $resolver::get_user_data()->get_settings();
unset( $settings["typography"]["fontFamilies"]["theme"] );
unset( $settings["typography"]["fontFamilies"]["custom"] );
if ( empty( $settings["typography"]["fontFamilies"] ) ) {
	unset( $settings["typography"]["fontFamilies"] );
}
if ( empty( $settings["typography"] ) ) {
	unset( $settings["typography"] );
}
$id = (int) WP_Theme_JSON_Resolver::get_user_global_styles_post_id();
$controller = new WP_REST_Global_Styles_Controller();
$request = new WP_REST_Request( "PUT", "/wp/v2/global-styles/" );
$request->set_param( "id", $id );
$request->set_param( "settings", $settings );
$response = $controller->update_item( $request );
if ( is_wp_error( $response ) ) {
	fwrite( STDERR, $response->get_error_message() . "\\n" );
	exit( 1 );
}
delete_transient( "global_styles" );
delete_transient( "global_styles_" . get_stylesheet() );`;

/**
 * Raw capture payload for the styles fork (SPEC-016 §2.1).
 */
export { CAPTURE_USER_STYLES_EVAL as RAW_USER_STYLES_EVAL };
