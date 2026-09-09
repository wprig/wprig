#!/usr/bin/env node
/**
 * wp-theme-control (Node port)
 *
 * Node migration of bacoords/wp-theme-control (Bash + WP-CLI), pinned
 * upstream SHA 0820d96567a912320df7b1cdc102605376a69edf. Bakes Site Editor
 * database changes into the active block theme with manifest-first,
 * hash-verified safety.
 *
 * WP Rig fork (SPEC-016): fonts/styles write the config/user-styles.json
 * overlay instead of theme.json.
 *
 * Usage: wp-theme-control <command> [options]
 *
 * Commands:
 *   plan                 Read-only inventory and collision report
 *   fonts                Persist Font Library fonts into the overlay
 *   templates            Export custom templates and template parts
 *   styles               Capture user Global Styles into the overlay
 *   patterns             Export unsynced user-created patterns
 *   clean <manifest>     Clean database records from an export manifest
 *   all                  Run fonts, templates, styles, and patterns
 *
 * Common options:
 *   --path=<path>         WordPress root passed to WP-CLI
 *   --url=<url>           Site URL passed to WP-CLI
 *   --user=<user>         WordPress user passed to WP-CLI
 *   --state-dir=<path>    Persistent manifest and backup directory
 *   --dry-run             Report without writing files or records
 *   --clean               Clean each successful export immediately
 *   --force               Allow a documented safe override
 */

import {
	BakeError,
	info,
	parseCommonArgs,
	loadContext,
} from './lib/context.js';
import { runPlan } from './lib/plan.js';
import { runFonts } from './lib/fonts.js';
import { runTemplates } from './lib/templates.js';
import { runStyles } from './lib/styles.js';
import { runPatterns } from './lib/patterns.js';
import { runClean } from './lib/clean.js';

const SCOPES = [
	'plan',
	'fonts',
	'templates',
	'styles',
	'patterns',
	'clean',
	'all',
];

function usage() {
	info( 'usage: node bin/wp-theme-control/index.js <command> [options]' );
}

const [ command, ...rest ] = process.argv.slice( 2 );

if (
	! command ||
	command === 'help' ||
	command === '-h' ||
	command === '--help'
) {
	usage();
	process.exit( command ? 0 : 1 );
}

if ( ! SCOPES.includes( command ) ) {
	process.stderr.write(
		`wp-theme-control: error: unknown command: ${ command }\n`
	);
	usage();
	process.exit( 1 );
}

if ( command !== 'clean' && rest.includes( '--help' ) ) {
	usage();
	process.exit( 0 );
}

const parsed = parseCommonArgs( rest );

try {
	const ctx = loadContext( parsed );

	switch ( command ) {
		case 'plan':
			runPlan( ctx );
			break;
		case 'fonts':
			runFonts( ctx );
			break;
		case 'templates':
			runTemplates( ctx );
			break;
		case 'styles':
			runStyles( ctx, { fontsReady: false } );
			break;
		case 'patterns':
			runPatterns( ctx );
			break;
		case 'clean':
			runClean( ctx, parsed.rest[ 0 ] );
			break;
		case 'all':
			// Upstream invariant: fonts → templates → styles → patterns, so
			// the styles run sees font bookkeeping already persisted.
			runFonts( ctx );
			runTemplates( ctx );
			runStyles( ctx, { fontsReady: true } );
			runPatterns( ctx );
			break;
		default:
			break;
	}
} catch ( error ) {
	if ( error instanceof BakeError ) {
		process.stderr.write( `wp-theme-control: error: ${ error.message }\n` );
		process.exit( 1 );
	}
	throw error;
}
