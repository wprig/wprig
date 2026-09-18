import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadTokens } from './tokens.js';
import { importDtcg } from '../lib/dtcg.js';

const themeRoot = path.resolve(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'../..'
);
const tokensPath = path.join( themeRoot, 'config', 'tokens.json' );

/**
 * Deep-merges plain objects (arrays and scalars replace).
 *
 * @param {Object} target Base object.
 * @param {Object} source Overrides.
 * @return {Object} Merged copy.
 */
function mergePlain( target, source ) {
	const out = { ...( target || {} ) };
	for ( const [ key, value ] of Object.entries( source || {} ) ) {
		if (
			value &&
			typeof value === 'object' &&
			! Array.isArray( value ) &&
			out[ key ] &&
			typeof out[ key ] === 'object' &&
			! Array.isArray( out[ key ] )
		) {
			out[ key ] = mergePlain( out[ key ], value );
		} else {
			out[ key ] = value;
		}
	}
	return out;
}

/**
 * Imports a DTCG document into config/tokens.json (merge or replace).
 *
 * @param {Object} [argv] Flags { from, mode, apply }.
 * @return {Promise<Object>} { merged, unmapped }.
 */
export async function runImport( argv = {} ) {
	if ( ! argv.from ) {
		throw new Error( 'rig:tokens:import requires --from <file>' );
	}

	const dtcg = await fs.readJson( argv.from );
	const { primitives, semantic, unmapped } = importDtcg( dtcg );
	const mode = argv.mode || 'merge';
	const current = loadTokens( await fs.readJson( tokensPath ) );

	const merged =
		mode === 'replace'
			? { ...current, primitives, semantic }
			: {
					...current,
					primitives: mergePlain( current.primitives, primitives ),
					semantic: mergePlain( current.semantic, semantic ),
			  };

	loadTokens( merged ); // fail fast on an invalid result

	if ( unmapped.length ) {
		// eslint-disable-next-line no-console
		console.warn(
			`[tokens:import] ${
				unmapped.length
			} unmapped token(s): ${ unmapped.join( ', ' ) }`
		);
	}

	if ( argv.apply ) {
		await fs.writeJson( tokensPath, merged, { spaces: 2 } );
		console.log( '[tokens:import] tokens.json updated.' );
	} else {
		console.log( '[tokens:import] dry-run — pass --apply to write.' );
	}

	return { merged, unmapped };
}

const invokedDirectly =
	process.argv[ 1 ] &&
	path.resolve( process.argv[ 1 ] ) ===
		path.resolve( fileURLToPath( import.meta.url ) );

if ( invokedDirectly ) {
	const argv = process.argv.slice( 2 );
	const fromIndex = argv.indexOf( '--from' );
	const modeIndex = argv.indexOf( '--mode' );
	runImport( {
		from: fromIndex >= 0 ? argv[ fromIndex + 1 ] : undefined,
		mode: modeIndex >= 0 ? argv[ modeIndex + 1 ] : 'merge',
		apply: argv.includes( '--apply' ),
	} ).catch( ( error ) => {
		console.error( error.message );
		process.exit( 1 );
	} );
}
