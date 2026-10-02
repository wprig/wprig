/**
 * Behavioral tests for the custom stylelint plugins
 * (scripts/stylelint/plugins/). Runs each rule through stylelint's
 * standalone API against the real token inventory (cwd = theme root).
 */

import stylelint from 'stylelint';
import noHardcodedColors from '../stylelint/plugins/no-hardcoded-colors.js';
import noUndefinedCustomProperties from '../stylelint/plugins/no-undefined-custom-properties.js';

async function lintWith( plugin, ruleName, css ) {
	const result = await stylelint.lint( {
		code: css,
		config: {
			plugins: [ plugin ],
			rules: {
				[ ruleName ]: true,
			},
		},
	} );

	return result.results[ 0 ].warnings.map( ( w ) => w.text );
}

describe( 'wprig/no-hardcoded-colors', () => {
	test( 'flags a hex literal that matches a token value', async () => {
		const warnings = await lintWith(
			noHardcodedColors,
			'wprig/no-hardcoded-colors',
			'a { color: #e36d60; }'
		);

		expect( warnings ).toHaveLength( 1 );
		expect( warnings[ 0 ] ).toMatch( /--color-brand-500/ );
	} );

	test( 'does not flag 8-digit hex (alpha) literals', async () => {
		// #RRGGBBAA is not a bare token value; the {3,6} scan used to match
		// its 6-digit prefix and report a false positive.
		const warnings = await lintWith(
			noHardcodedColors,
			'wprig/no-hardcoded-colors',
			'a { color: #e36d6080; }'
		);

		expect( warnings ).toHaveLength( 0 );
	} );
} );

describe( 'wprig/no-undefined-custom-properties', () => {
	test( 'flags a var() referencing an unknown custom property', async () => {
		const warnings = await lintWith(
			noUndefinedCustomProperties,
			'wprig/no-undefined-custom-properties',
			'a { color: var(--totally-undefined-var); }'
		);

		expect( warnings ).toHaveLength( 1 );
		expect( warnings[ 0 ] ).toMatch( /--totally-undefined-var/ );
	} );

	test( 'accepts token-defined and allowlisted namespaces', async () => {
		const warnings = await lintWith(
			noUndefinedCustomProperties,
			'wprig/no-undefined-custom-properties',
			'a { color: var(--color-brand-500); border-color: var(--wp--preset--color--base); }'
		);

		expect( warnings ).toHaveLength( 0 );
	} );
} );
