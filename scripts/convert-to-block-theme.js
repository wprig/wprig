#!/usr/bin/env node
/**
 * Convert WP Rig Base_Support component to strictly block-based (FSE) setup.
 */
import convertToBlockTheme from './tasks/convertToBlockTheme.js';

function parseArgs( argv ) {
	const flags = new Set();
	for ( const arg of argv.slice( 2 ) ) {
		if (
			arg === '--dry-run' ||
			arg === '--prune-html5' ||
			arg === '--drop-title-tag'
		) {
			flags.add( arg );
		}
	}
	return {
		dryRun: flags.has( '--dry-run' ),
		pruneHtml5: flags.has( '--prune-html5' ),
		dropTitleTag: flags.has( '--drop-title-tag' ),
	};
}

const args = parseArgs( process.argv );

convertToBlockTheme( args ).catch( ( error ) => {
	console.error( 'Error converting to block theme:', error );
	process.exit( 1 );
} );
