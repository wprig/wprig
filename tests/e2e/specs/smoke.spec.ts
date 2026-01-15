import { test, expect } from '../fixtures';

test.describe( 'Smoke Tests', () => {
	test.beforeEach( async ( { page } ) => {
		await page.goto( '/' );
	} );

	test( 'Homepage should load with site title and navigation', async ( {
		page,
	} ) => {
		// Check for site title - usually in a class like .site-title or within the header
		const siteTitle = page.locator( '.site-title, .site-branding' );
		await expect( siteTitle ).toBeVisible();

		// Check for navigation menu
		const navigation = page.locator( '#site-navigation, .main-navigation' );
		await expect( navigation ).toBeVisible();
	} );

	test( 'Homepage visual regression', async ( { page } ) => {
		await expect( page ).toHaveScreenshot( 'homepage.png', {
			fullPage: true,
		} );
	} );
} );
