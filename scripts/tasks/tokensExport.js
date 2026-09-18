import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadTokens } from './tokens.js';
import { exportDtcg } from '../lib/dtcg.js';

const themeRoot = path.resolve(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'../..'
);
const tokensPath = path.join( themeRoot, 'config', 'tokens.json' );

/**
 * Exports config/tokens.json to a DTCG document.
 *
 * @param {Object} [argv] Flags { out }.
 * @return {Promise<string>} Written path.
 */
export async function runExport( argv = {} ) {
	const tokens = loadTokens( await fs.readJson( tokensPath ) );
	const out =
		argv.out || path.join( themeRoot, 'design', 'tokens.dtcg.json' );

	await fs.ensureDir( path.dirname( out ) );
	await fs.writeJson( out, exportDtcg( tokens ), { spaces: 2 } );

	console.log( `[tokens:export] wrote ${ path.relative( themeRoot, out ) }` );

	return out;
}

const invokedDirectly =
	process.argv[ 1 ] &&
	path.resolve( process.argv[ 1 ] ) ===
		path.resolve( fileURLToPath( import.meta.url ) );

if ( invokedDirectly ) {
	const argv = process.argv.slice( 2 );
	const outIndex = argv.indexOf( '--out' );
	runExport( {
		out: outIndex >= 0 ? argv[ outIndex + 1 ] : undefined,
	} ).catch( ( error ) => {
		console.error( error.message );
		process.exit( 1 );
	} );
}
