import { test, expect } from '../fixtures';
import AxeBuilder from '@axe-core/playwright';

test.describe( 'Theme Unit Test Validation', () => {
	// Test the "Markup: HTML Tags and Formatting" page specifically
	test( 'should render HTML tags correctly and pass a11y', async ( {
		page,
	} ) => {
		await page.goto( '/markup-html-tags-and-formatting/' );

		// Ensure the page actually loaded the test data
		await expect( page.locator( 'h1' ) ).toContainText(
			'Markup: HTML Tags and Formatting'
		);

		// Check for common breaking elements like overflowing code blocks or images
		const content = page.locator( '.entry-content' );
		await expect( content ).toBeVisible();

		// Accessibility audit
		const accessibilityScanResults = await new AxeBuilder( {
			page,
		} ).analyze();
		expect( accessibilityScanResults.violations ).toEqual( [] );
	} );

	test( 'should handle pagination on the blog index', async ( { page } ) => {
		await page.goto( '/' );
		const nextLink = page.locator( '.nav-previous, .next' );
		await expect( nextLink ).toBeVisible();
	} );
} );
