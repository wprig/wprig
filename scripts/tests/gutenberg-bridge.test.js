/**
 * Regression tests for scripts/lib/gutenberg-bridge.php.
 *
 * The bridge is a standalone WP-CLI eval-file script. Outside WordPress
 * (ABSPATH undefined) it must exit 1 with a JSON error payload on stdout —
 * not a PHP fatal (wp_json_encode() is unavailable when WP is not loaded).
 *
 * Skipped when PHP is not on PATH (e.g. CI runners without PHP).
 */

import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const bridgePath = path.resolve( __dirname, '../lib/gutenberg-bridge.php' );

function phpAvailable() {
	const result = spawnSync( 'php', [ '-v' ], { encoding: 'utf8' } );
	return result.status === 0;
}

const describeIfPhp = phpAvailable() ? describe : describe.skip;

describeIfPhp( 'gutenberg-bridge.php outside WordPress context', () => {
	it( 'exits 1 with a JSON error payload instead of a PHP fatal', () => {
		const result = spawnSync( 'php', [ bridgePath ], {
			encoding: 'utf8',
		} );

		expect( result.status ).toBe( 1 );
		expect( result.stderr ).not.toMatch( /Fatal error/i );

		const payload = JSON.parse( result.stdout );
		expect( payload ).toHaveProperty( 'error' );
		expect( payload.error ).toMatch( /WordPress context/i );
	} );
} );
