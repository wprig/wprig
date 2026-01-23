import { test, expect } from '../fixtures';

test.describe( 'Smoke Tests', () => {
	test.beforeEach( async ( { page } ) => {
		await page.goto( '/' );
	} );

	test( 'Homepage should load with site title and navigation', async ( {
		page,
	} ) => {
		// Check for site title - usually in a class like .site-title or within the header
		const siteTitle = page.locator( '.site-title' ).first();
		await expect( siteTitle ).toBeAttached();
		// If it's hidden, it might be screen-reader-text, which is fine for smoke test
		// but let's at least check it exists in the DOM.

		// Check for navigation menu
		const navigation = page.locator( '#site-navigation, .main-navigation' ).first();
		await expect( navigation ).toBeVisible();
	} );

	test( 'Homepage visual regression', async ( { page } ) => {
		await expect( page ).toHaveScreenshot( 'homepage.png', {
			fullPage: true,
		} );
	} );
} );
