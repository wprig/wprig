#!/usr/bin/env node
/**
 * WP Rig Blocks CLI
 * - block:new <namespace>/<slug> [options]
 * - block:list
 * - block:remove <namespace>/<slug>
 * - block:promote-plugin <namespace>/<slug>
 *
 * Works under Node and Bun (bun run). Uses @wordpress/create-block with --no-plugin
 * to scaffold into assets/blocks/<slug>, then adjusts to WP Rig conventions.
 */
import { Command } from 'commander';
import { checkBlocksEnabled } from './lib/block-utils.js';

// Task imports
import cmdNew from './tasks/blockNew.js';
import listBlocks from './tasks/blockList.js';
import removeBlock from './tasks/blockRemove.js';
import promotePlugin from './tasks/blockPromote.js';

const program = new Command();

program
	.name( 'wprig-blocks' )
	.description( 'WP Rig theme-scoped blocks CLI' )
	.version( '0.1.0' );

program
	.command( 'block:new' )
	.argument( '<name>', 'Block name <namespace>/<slug> or <slug>' )
	.option( '--title <title>', 'Human title' )
	.option( '-d, --dynamic', 'Create dynamic block with render.php' )
	.option( '--ts', 'Use TypeScript template' )
	.option( '--category <category>', 'Block category', 'widgets' )
	.option( '--icon <icon>', 'Dashicon or SVG' )
	.option( '--description <description>', 'Block description' )
	.option( '--keywords <csv>', 'Comma-separated keywords' )
	.option( '--no-style', 'Do not generate style.css or wire style' )
	.option(
		'--no-editor-style',
		'Do not generate editor.css or wire editorStyle'
	)
	.option(
		'--view',
		'Generate separate frontend script loaded on frontend only'
	)
	.action( ( name, opts ) => {
		checkBlocksEnabled();
		cmdNew( name, opts ).catch( ( e ) => {
			console.error( e?.message || e );
			process.exitCode = 1;
		} );
	} );

program.command( 'block:list' ).action( () => {
	try {
		listBlocks();
	} catch ( e ) {
		console.error( e?.message || e );
		process.exitCode = 1;
	}
} );

program
	.command( 'block:remove' )
	.argument( '<name>', 'Block name <namespace>/<slug> or <slug>' )
	.action( ( name ) => {
		removeBlock( name ).catch( ( e ) => {
			console.error( e?.message || e );
			process.exitCode = 1;
		} );
	} );

program
	.command( 'block:promote-plugin' )
	.argument( '<name>', 'Block name <namespace>/<slug> or <slug>' )
	.action( ( name ) => {
		promotePlugin( name ).catch( ( e ) => {
			console.error( e?.message || e );
			process.exitCode = 1;
		} );
	} );

program.parse( process.argv );
