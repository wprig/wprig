#!/usr/bin/env node

/**
 * WP Rig Component Creation Wrapper
 *
 * This is a wrapper script that forwards arguments to create-rig-component.mjs
 * without requiring double dashes. It's used to improve the developer experience
 * when creating new components.
 *
 * Usage: node create-component-wrapper.js "Component Name" [options]
 *
 * @package
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const mainScriptPath = path.join( __dirname, 'create-rig-component.mjs' );

// Get all arguments
const args = process.argv.slice( 2 );

// Forward arguments to the main script
const child = spawn( 'node', [ mainScriptPath, ...args ], {
	stdio: 'inherit',
} );

child.on( 'close', ( code ) => {
	process.exit( code );
} );
