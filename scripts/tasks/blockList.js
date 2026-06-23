import fs from 'node:fs';
import path from 'node:path';
import {
	blocksRoot,
	ensureBlocksRoot,
	pathExists,
} from '../lib/block-utils.js';

/**
 * Lists all blocks found in assets/blocks.
 */
export default function listBlocks() {
	ensureBlocksRoot();
	const entries = fs
		.readdirSync( blocksRoot, { withFileTypes: true } )
		.filter( ( d ) => d.isDirectory() )
		.map( ( d ) => path.join( blocksRoot, d.name, 'block.json' ) )
		.filter( ( p ) => pathExists( p ) );

	if ( ! entries.length ) {
		console.log( 'No blocks found under assets/blocks.' );
		return;
	}

	entries.forEach( ( p ) => {
		try {
			const data = JSON.parse( fs.readFileSync( p, 'utf8' ) );
			console.log(
				`- ${ data.name || 'unnamed' } (${ path.dirname( p ) })`
			);
		} catch {
			// skip invalid
		}
	} );
}
