import fse from 'fs-extra';
import path from 'node:path';
import readline from 'node:readline';
import { blocksRoot, parseName, pathExists } from '../lib/block-utils.js';

/**
 * Removes a block from assets/blocks.
 *
 * @param {string} name Block name <namespace>/<slug> or <slug>
 */
export default async function removeBlock( name ) {
	const { slug } = parseName( name );
	const dir = path.join( blocksRoot, slug );

	if ( ! pathExists( dir ) ) {
		console.error( `Block not found: ${ dir }` );
		process.exit( 1 );
	}

	const rl = readline.createInterface( {
		input: process.stdin,
		output: process.stdout,
	} );

	const question = ( q ) => new Promise( ( res ) => rl.question( q, res ) );
	const ans = (
		await question(
			`Are you sure you want to delete assets/blocks/${ slug }? (y/N): `
		)
	)
		.trim()
		.toLowerCase();

	rl.close();

	if ( ans !== 'y' && ans !== 'yes' ) {
		console.log( 'Aborted.' );
		return;
	}

	await fse.remove( dir );
	console.log( `Removed assets/blocks/${ slug }` );
}
