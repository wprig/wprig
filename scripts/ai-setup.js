/**
 * AI Setup Script for WP Rig
 *
 * This script optimizes WP Rig for agentic discoverability by adding
 * necessary configuration and instruction files for various coding agents.
 */

import { Command } from 'commander';
import setupAgents from './tasks/aiSetup.js';

const program = new Command();

program
	.name( 'wprig-ai-setup' )
	.description( 'Optimize WP Rig for AI coding agents' )
	.version( '1.0.0' )
	.option( '-a, --all', 'Optimize for all supported agents' )
	.option(
		'--agents <list>',
		'Comma-separated list of agents to optimize for'
	)
	.action( ( options ) => {
		setupAgents( options ).catch( ( error ) => {
			console.error( error );
			process.exit( 1 );
		} );
	} );

program.parse( process.argv );
