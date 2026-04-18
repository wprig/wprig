#!/usr/bin/env node
/**
 * Modern development server for WP Rig.
 */
import runDevModern from './tasks/devModern.js';

runDevModern().catch( ( error ) => {
	console.error( '[wprig] Dev server error:', error );
	process.exit( 1 );
} );
