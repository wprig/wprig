/**
 * wp-theme-control (Node port) — runtime URL rewriting.
 *
 * Local absolute URLs in DB block content are rewritten to runtime PHP
 * expressions (theme assets → uploads → site base order, host-independent
 * for theme paths so Studio imported domains are covered). Content that
 * already contains PHP syntax is refused. The transformation itself runs in
 * PHP via WP-CLI eval so parse_blocks()/serialize_blocks() semantics are
 * byte-identical with upstream.
 */

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { die } from './context.js';

// PHP payload. Single-quoted PHP strings are used for the regexes so the
// backslash escapes survive WP-CLI argument passing unchanged; PCRE resolves
// \s, \x27, and \"-free classes at match time.
const RUNTIME_URLS_EVAL = `
/* WP_THEME_CONTROL_RUNTIME_URLS */
$input_path = getenv( "WPCTL_RUNTIME_INPUT" );
$output_path = getenv( "WPCTL_RUNTIME_OUTPUT" );
$report_path = getenv( "WPCTL_RUNTIME_REPORT" );
$content = file_get_contents( $input_path );
if ( false === $content ) {
	fwrite( STDERR, 'Could not read the staged block content.' . PHP_EOL );
	exit( 1 );
}
if ( false !== strpos( $content, '<?' ) || preg_match( '/<script\\s+language\\s*=\\s*["\\']?php/i', $content ) ) {
	fwrite( STDERR, 'Database block content contains executable PHP syntax; refusing runtime URL injection.' . PHP_EOL );
	exit( 1 );
}

$upload_data = wp_get_upload_dir();
$theme_uri = untrailingslashit( get_stylesheet_directory_uri() );
$theme_path = wp_parse_url( $theme_uri, PHP_URL_PATH );
$site_base = untrailingslashit( home_url() );
$upload_base = isset( $upload_data['baseurl'] ) ? untrailingslashit( $upload_data['baseurl'] ) : '';
$tokens = array(
	'theme'   => '__WP_THEME_CONTROL_THEME_BASE_6f7c8b__',
	'uploads' => '__WP_THEME_CONTROL_UPLOADS_BASE_6f7c8b__',
	'home'    => '__WP_THEME_CONTROL_HOME_BASE_6f7c8b__',
);
foreach ( $tokens as $token ) {
	if ( false !== strpos( $content, $token ) ) {
		fwrite( STDERR, 'Database block content contains a reserved runtime URL token.' . PHP_EOL );
		exit( 1 );
	}
}

$counts = array( 'theme' => 0, 'uploads' => 0, 'home' => 0 );
if ( is_string( $theme_path ) && '' !== $theme_path ) {
	$theme_pattern = '~https?://[^/\\s"\\x27<>?#]+' . preg_quote( untrailingslashit( $theme_path ), '~' ) . '(?=' . chr( 36 ) . '|[/?#])~';
	$content = preg_replace( $theme_pattern, $tokens['theme'], $content, -1, $theme_replacements );
	if ( null === $content ) {
		fwrite( STDERR, 'Theme asset URL matching failed.' . PHP_EOL );
		exit( 1 );
	}
	$counts['theme'] += $theme_replacements;
}
$bases = array(
	'uploads' => $upload_base,
	'home'    => $site_base,
);
foreach ( $bases as $kind => $base ) {
	if ( '' === $base ) {
		continue;
	}
	$variants = array_values( array_unique( array(
		$base,
		set_url_scheme( $base, 'http' ),
		set_url_scheme( $base, 'https' ),
	) ) );
	foreach ( $variants as $variant ) {
		$pattern = '~(?<![A-Za-z0-9+.-])' . preg_quote( $variant, '~' ) . '(?=' . chr( 36 ) . '|[/?#])~';
		$content = preg_replace( $pattern, $tokens[ $kind ], $content, -1, $replacements );
		if ( null === $content ) {
			fwrite( STDERR, 'Runtime URL matching failed.' . PHP_EOL );
			exit( 1 );
		}
		$counts[ $kind ] += $replacements;
	}
}

if ( function_exists( 'parse_blocks' ) && function_exists( 'serialize_blocks' ) ) {
	$content = serialize_blocks( parse_blocks( $content ) );
}

$content = str_replace(
	array( $tokens['theme'], $tokens['uploads'], $tokens['home'] ),
	array(
		"<?php echo esc_url( get_stylesheet_directory_uri() ); ?>",
		"<?php echo esc_url( wp_get_upload_dir()[\\"baseurl\\"] ); ?>",
		"<?php echo esc_url( home_url() ); ?>",
	),
	$content
);
$total = $counts['theme'] + $counts['uploads'] + $counts['home'];
if ( false === file_put_contents( $output_path, $content ) ) {
	fwrite( STDERR, 'Could not write the runtime URL output.' . PHP_EOL );
	exit( 1 );
}
if ( false === file_put_contents( $report_path, wp_json_encode( array(
	'changed' => 0 < $total,
	'total'   => $total,
	'theme'   => $counts['theme'],
	'home'    => $counts['home'],
	'uploads' => $counts['uploads'],
) ) ) ) {
	fwrite( STDERR, 'Could not write the runtime URL report.' . PHP_EOL );
	exit( 1 );
}`;

/**
 * Rewrites runtime URLs in the input file, writing the transformed content
 * and a JSON report ({ changed, total, theme, home, uploads }).
 *
 * @param {Object} ctx        Loaded context.
 * @param {string} inputPath  Input file.
 * @param {string} outputPath Rewritten output file.
 * @param {string} reportPath JSON report output.
 */
export function rewriteRuntimeUrls( ctx, inputPath, outputPath, reportPath ) {
	if ( ! fs.existsSync( inputPath ) ) {
		die( `runtime URL input not found: ${ inputPath }` );
	}

	const result = spawnSync(
		'wp',
		[ ...ctx.globalArgs, 'eval', RUNTIME_URLS_EVAL ],
		{
			encoding: 'utf8',
			env: {
				...process.env,
				WPCTL_RUNTIME_INPUT: inputPath,
				WPCTL_RUNTIME_OUTPUT: outputPath,
				WPCTL_RUNTIME_REPORT: reportPath,
			},
		}
	);

	if ( result.status !== 0 ) {
		die(
			`runtime URL transformer failed: ${
				( result.stderr || '' ).trim() || 'unknown wp eval failure'
			}`
		);
	}

	if ( ! fs.existsSync( outputPath ) ) {
		die( 'runtime URL transformer produced no output' );
	}
	if ( ! fs.existsSync( reportPath ) ) {
		die( 'runtime URL transformer produced no report' );
	}

	const report = JSON.parse( fs.readFileSync( reportPath, 'utf8' ) );
	if (
		! (
			typeof report.total === 'number' &&
			report.total >= 0 &&
			report.theme >= 0 &&
			report.home >= 0 &&
			report.uploads >= 0
		)
	) {
		die( 'runtime URL transformer produced an invalid report' );
	}
}

/**
 * Runs the rewrite gate against the input and returns the report. The
 * rewritten output is discarded (report-only use, e.g. the styles overlay
 * gate).
 *
 * @param {Object} ctx        Loaded context.
 * @param {string} inputPath  Input file (not modified).
 * @param {string} scratchDir Writable scratch directory.
 * @return {{changed: boolean, total: number, theme: number, home: number, uploads: number}} Report.
 */
export function probeRuntimeUrls( ctx, inputPath, scratchDir ) {
	const outputPath = path.join( scratchDir, 'probe-output' );
	const reportPath = path.join( scratchDir, 'probe-report.json' );
	rewriteRuntimeUrls( ctx, inputPath, outputPath, reportPath );
	const report = JSON.parse( fs.readFileSync( reportPath, 'utf8' ) );
	fs.rmSync( outputPath, { force: true } );
	return report;
}
