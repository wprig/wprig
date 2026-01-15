import { test, expect } from '../fixtures';
import AxeBuilder from '@axe-core/playwright';

test.describe( 'Accessibility', () => {
	test( '404 page should not have any automatically detectable accessibility issues', async ( {
		page,
	} ) => {
		// Go to a non-existent page to trigger 404
		await page.goto( '/this-page-does-not-exist-12345' );

		// Ensure we are actually on a 404 page (WordPress usually adds error404 class to body)
		await expect( page.locator( 'body' ) ).toHaveClass( /error404/ );

		const accessibilityScanResults = await new AxeBuilder( {
			page,
		} ).analyze();
		expect( accessibilityScanResults.violations ).toEqual( [] );
	} );

	test( 'Archive page should not have any automatically detectable accessibility issues', async ( {
		page,
	} ) => {
		// Go to the blog/archive page
		await page.goto( '/?post_type=post' );

		const accessibilityScanResults = await new AxeBuilder( {
			page,
		} ).analyze();
		expect( accessibilityScanResults.violations ).toEqual( [] );
	} );
} );
