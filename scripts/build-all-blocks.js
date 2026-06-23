#!/usr/bin/env node

/**
 * Script to build all blocks in the assets/blocks directory using esbuild directly.
 */
import buildAllBlocks from './tasks/buildAllBlocks.js';

// Check if we're in watch mode
const isWatchMode = process.argv.includes( '--watch' );

buildAllBlocks( isWatchMode ).catch( ( error ) => {
	console.error( 'Error building blocks:', error.message );
	process.exit( 1 );
} );
