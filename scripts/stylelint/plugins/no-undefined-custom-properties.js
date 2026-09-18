import stylelint from 'stylelint';
import { loadTokenInventory } from '../../lib/token-inventory.js';

export const ruleName = 'wprig/no-undefined-custom-properties';

export const messages = stylelint.utils.ruleMessages( ruleName, {
	rejected: ( name ) =>
		`Unexpected undefined custom property "${ name }". Define it in config/tokens.json or _tokens.custom.css (SPEC-017 §13).`,
} );

const meta = {
	url: 'https://github.com/wprig/wprig',
};

// Third-party / runtime namespaces we never own.
const ALLOWED_PREFIXES = [ '--wp--', '--lightningcss-', '--tw-' ];

let cachedInventory = null;

/**
 * Loads (and caches) the token inventory for the current theme root.
 *
 * @return {Set<string>} Known custom-property names.
 */
function knownNames() {
	if ( ! cachedInventory ) {
		try {
			cachedInventory = new Set(
				loadTokenInventory( process.cwd() ).names
			);
		} catch ( error ) {
			cachedInventory = new Set();
		}
	}
	return cachedInventory;
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

	const known = knownNames();

	// Names declared anywhere in the file being linted (local definitions).
	const local = new Set();
	root.walkDecls( ( decl ) => {
		if ( decl.prop.startsWith( '--' ) ) {
			local.add( decl.prop );
		}
	} );

	root.walkDecls( ( decl ) => {
		const value = decl.value || '';
		const pattern = /var\(\s*(--[\w-]+)/g;
		let match;

		while ( ( match = pattern.exec( value ) ) !== null ) {
			const name = match[ 1 ];

			if (
				known.has( name ) ||
				local.has( name ) ||
				ALLOWED_PREFIXES.some( ( prefix ) => name.startsWith( prefix ) )
			) {
				continue;
			}

			stylelint.utils.report( {
				message: messages.rejected( name ),
				node: decl,
				result,
				ruleName,
			} );
		}
	} );
};

rule.ruleName = ruleName;
rule.messages = messages;
rule.meta = meta;

export default stylelint.createPlugin( ruleName, rule );
