import stylelint from 'stylelint';
import { loadTokenInventory } from '../../lib/token-inventory.js';

export const ruleName = 'wprig/no-hardcoded-colors';

export const messages = stylelint.utils.ruleMessages( ruleName, {
	rejected: ( literal, token ) =>
		`Unexpected hardcoded color "${ literal }"; it matches ${ token }. Use var(${ token }) instead (SPEC-017 §13).`,
} );

const meta = {
	url: 'https://github.com/wprig/wprig',
};

let cachedValueMap = null;

/**
 * Normalizes a hex color to lowercase 6-digit form.
 *
 * @param {string} value CSS color literal.
 * @return {string|null} Normalized hex, or null when not a hex color.
 */
function normalizeHex( value ) {
	const match = String( value )
		.trim()
		.toLowerCase()
		.match( /^#([0-9a-f]{3}|[0-9a-f]{6})$/ );
	if ( ! match ) {
		return null;
	}

	let hex = match[ 1 ];
	if ( hex.length === 3 ) {
		hex = hex
			.split( '' )
			.map( ( c ) => c + c )
			.join( '' );
	}
	return `#${ hex }`;
}

/**
 * Maps token color values -> the first canonical token name, for messages.
 *
 * @return {Map<string, string>} value -> token name.
 */
function tokenValueMap() {
	if ( cachedValueMap ) {
		return cachedValueMap;
	}

	cachedValueMap = new Map();
	try {
		const inventory = loadTokenInventory( process.cwd() );
		for ( const [ name, value ] of Object.entries(
			inventory.values || {}
		) ) {
			const hex = normalizeHex( value );
			if ( hex && ! cachedValueMap.has( hex ) ) {
				cachedValueMap.set( hex, name );
			}
		}
	} catch ( error ) {
		// No inventory -> nothing to enforce.
	}

	return cachedValueMap;
}

/**
 * @param {boolean} primary
 * @return {Function} Stylelint rule.
 */
const rule = ( primary ) => ( root, result ) => {
	const validOptions = stylelint.utils.validateOptions( result, ruleName, {
		actual: primary,
	} );

	if ( ! validOptions || ! primary ) {
		return;
	}

	const valueMap = tokenValueMap();

	root.walkDecls( ( decl ) => {
		const literals = ( decl.value || '' ).match( /#[0-9a-fA-F]{3,6}/g );
		if ( ! literals ) {
			return;
		}

		for ( const literal of literals ) {
			const hex = normalizeHex( literal );
			const token = hex ? valueMap.get( hex ) : null;

			if ( token ) {
				stylelint.utils.report( {
					message: messages.rejected( literal, token ),
					node: decl,
					result,
					ruleName,
				} );
			}
		}
	} );
};

rule.ruleName = ruleName;
rule.messages = messages;
rule.meta = meta;

export default stylelint.createPlugin( ruleName, rule );
