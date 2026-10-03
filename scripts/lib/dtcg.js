/**
 * W3C Design Tokens Community Group (DTCG) interchange adapter (SPEC-017 §9.2,
 * §10.7). DTCG is the import/export boundary only — the native format stays
 * config/tokens.json (v2).
 *
 * Conventions:
 * - color: `primitives.color.<hue>.<step>` <-> nested DTCG groups
 * - simple groups: layout / space / breakpoint / hue / alpha / radius
 * - font: family / size / leading
 * - semantic: each role is a DTCG color token; the dark value rides in
 *   `$extensions["com.wprig.dark"]`.
 *
 * References are resolved on export so the interchange document carries
 * concrete values.
 */
import { resolveReferences } from '../tasks/tokens.js';

const SIMPLE_GROUPS = {
	layout: 'dimension',
	space: 'dimension',
	radius: 'dimension',
	breakpoint: 'dimension',
	hue: 'number',
	alpha: 'number',
};

const DARK_EXTENSION = 'com.wprig.dark';

/**
 * Builds a DTCG leaf token.
 *
 * @param {string} type         DTCG `$type`.
 * @param {*}      value        Token value.
 * @param {Object} [extensions] Optional `$extensions`.
 * @return {Object} DTCG token.
 */
function leaf( type, value, extensions ) {
	const token = { $type: type, $value: value };
	if ( extensions ) {
		token.$extensions = extensions;
	}
	return token;
}

/**
 * Exports v2 tokens to a DTCG tree.
 *
 * @param {Object} tokens v2 tokens.
 * @return {Object} DTCG document.
 */
export function exportDtcg( tokens ) {
	const resolved = resolveReferences( tokens );
	const primitives = resolved.primitives || {};
	const out = { primitives: {}, semantic: {} };

	if ( primitives.color ) {
		out.primitives.color = {};
		for ( const [ hue, steps ] of Object.entries( primitives.color ) ) {
			out.primitives.color[ hue ] = {};
			for ( const [ step, value ] of Object.entries( steps ) ) {
				out.primitives.color[ hue ][ step ] = leaf( 'color', value );
			}
		}
	}

	for ( const [ group, type ] of Object.entries( SIMPLE_GROUPS ) ) {
		if ( ! primitives[ group ] ) {
			continue;
		}
		out.primitives[ group ] = {};
		for ( const [ slug, value ] of Object.entries( primitives[ group ] ) ) {
			out.primitives[ group ][ slug ] = leaf( type, value );
		}
	}

	if ( primitives.font ) {
		out.primitives.font = {};
		const fontTypes = {
			family: 'fontFamily',
			size: 'dimension',
			leading: 'number',
		};
		for ( const [ sub, type ] of Object.entries( fontTypes ) ) {
			if ( ! primitives.font[ sub ] ) {
				continue;
			}
			out.primitives.font[ sub ] = {};
			for ( const [ slug, value ] of Object.entries(
				primitives.font[ sub ]
			) ) {
				out.primitives.font[ sub ][ slug ] = leaf( type, value );
			}
		}
	}

	const walkSemantic = ( node, target ) => {
		for ( const [ key, value ] of Object.entries( node || {} ) ) {
			if ( value && typeof value === 'object' && 'light' in value ) {
				target[ key ] = leaf( 'color', value.light, {
					[ DARK_EXTENSION ]: value.dark,
				} );
			} else if ( value && typeof value === 'object' ) {
				target[ key ] = {};
				walkSemantic( value, target[ key ] );
			}
		}
	};
	walkSemantic( resolved.semantic, out.semantic );

	return out;
}

/**
 * True when a value is a DTCG leaf token.
 *
 * @param {*} value Candidate.
 * @return {boolean} Whether it has `$value`.
 */
function isLeaf( value ) {
	return (
		value &&
		typeof value === 'object' &&
		! Array.isArray( value ) &&
		'$value' in value
	);
}

/**
 * Imports a DTCG document into the v2 primitives/semantic shape.
 *
 * @param {Object} dtcg DTCG document.
 * @return {Object} { primitives, semantic, unmapped }.
 */
export function importDtcg( dtcg ) {
	const primitives = { color: {} };
	const semantic = {};
	const unmapped = [];

	const placePrimitive = ( path, token ) => {
		const [ head, second, third ] = path;

		if ( head === 'color' && second && third ) {
			primitives.color[ second ] = primitives.color[ second ] || {};
			primitives.color[ second ][ third ] = token.$value;
			return;
		}

		if ( head === 'font' && second && third ) {
			primitives.font = primitives.font || {};
			primitives.font[ second ] = primitives.font[ second ] || {};
			primitives.font[ second ][ third ] = token.$value;
			return;
		}

		if ( Object.prototype.hasOwnProperty.call( SIMPLE_GROUPS, head ) ) {
			primitives[ head ] = primitives[ head ] || {};
			if ( second ) {
				primitives[ head ][ second ] = token.$value;
				return;
			}
		}

		unmapped.push( path.join( '.' ) );
	};

	const placeSemantic = ( path, token ) => {
		let node = semantic;
		for ( let i = 0; i < path.length - 1; i++ ) {
			node[ path[ i ] ] = node[ path[ i ] ] || {};
			node = node[ path[ i ] ];
		}
		const key = path[ path.length - 1 ];
		node[ key ] = {
			light: token.$value,
			dark: token.$extensions?.[ DARK_EXTENSION ] ?? token.$value,
		};
	};

	const walk = ( node, path, handler ) => {
		for ( const [ key, value ] of Object.entries( node || {} ) ) {
			if ( key.startsWith( '$' ) ) {
				continue;
			}
			if ( isLeaf( value ) ) {
				handler( path.concat( key ), value );
			} else if ( value && typeof value === 'object' ) {
				walk( value, path.concat( key ), handler );
			}
		}
	};

	const structured = dtcg.primitives || dtcg.semantic;

	if ( structured ) {
		if ( dtcg.primitives ) {
			walk( dtcg.primitives, [], placePrimitive );
		}
		if ( dtcg.semantic ) {
			walk( dtcg.semantic, [], placeSemantic );
		}
	} else {
		// Generic export (e.g. Tokens Studio): treat color tokens as primitives.
		walk( dtcg, [], ( path, token ) => {
			if ( token.$type === 'color' ) {
				placePrimitive(
					path[ 0 ] === 'color' ? path : [ 'color', ...path ],
					token
				);
			} else {
				unmapped.push( path.join( '.' ) );
			}
		} );
	}

	if ( Object.keys( primitives.color ).length === 0 ) {
		delete primitives.color;
	}

	return { primitives, semantic, unmapped };
}
