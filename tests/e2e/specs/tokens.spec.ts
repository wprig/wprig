import { test, expect } from '@playwright/test';

/**
 * Design tokens — runtime contract (SPEC-017).
 *
 * Binding-agnostic: works for `independent` and `wp-preset` themes. Verifies
 * the generated custom properties are actually served and resolve on :root,
 * that the breakpoint token matches the WP 7.1 viewport scale, and that the
 * legacy alias layer (removed after the codemod) is not emitted.
 */

const readVars = ( page: import('@playwright/test').Page, vars: string[] ) =>
	page.evaluate( ( names ) => {
		const cs = getComputedStyle( document.documentElement );
		const out: Record< string, string > = {};
		for ( const name of names ) {
			out[ name ] = cs.getPropertyValue( name ).trim();
		}
		return out;
	}, vars );

test.describe( 'Design tokens (runtime)', () => {
	test.beforeEach( async ( { page } ) => {
		await page.goto( '/' );
	} );

	test( 'canonical token custom properties resolve on :root', async ( {
		page,
	} ) => {
		const vars = await readVars( page, [
			'--color-surface',
			'--color-text',
			'--layout-content',
			'--breakpoint-tablet',
		] );

		expect( vars[ '--color-surface' ] ).not.toBe( '' );
		expect( vars[ '--color-text' ] ).not.toBe( '' );
		expect( vars[ '--layout-content' ] ).not.toBe( '' );
		expect( vars[ '--breakpoint-tablet' ] ).toMatch( /\d/ );
	} );

	test( 'breakpoint token matches the 782px viewport scale', async ( {
		page,
	} ) => {
		const vars = await readVars( page, [ '--breakpoint-tablet' ] );
		expect( parseFloat( vars[ '--breakpoint-tablet' ] ) ).toBe( 782 );
	} );

	test( 'legacy alias layer is not emitted (codemod complete)', async ( {
		page,
	} ) => {
		const vars = await readVars( page, [
			'--mobile-breakpoint',
			'--content-width',
			'--global-font-color',
		] );

		expect( vars[ '--mobile-breakpoint' ] ).toBe( '' );
		expect( vars[ '--content-width' ] ).toBe( '' );
		expect( vars[ '--global-font-color' ] ).toBe( '' );
	} );

	test( 'color-scheme is declared', async ( { page } ) => {
		const scheme = await page.evaluate(
			() => getComputedStyle( document.documentElement ).colorScheme
		);
		expect( scheme ).toMatch( /light|dark/ );
	} );
} );
