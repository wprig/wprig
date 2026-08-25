import { test, expect } from '../fixtures';

test.describe( 'Smoke Tests', () => {
	test.beforeEach( async ( { page } ) => {
		await page.goto( '/' );
	} );

	test( 'Homepage should load with site title and navigation', async ( {
		page,
	} ) => {
		// Paradigm-agnostic: classic renders `.site-title`, block themes render
		// `.wp-block-site-title`.
		const siteTitle = page
			.locator( '.site-title, .wp-block-site-title' )
			.first();
		await expect( siteTitle ).toBeAttached();

		// Navigation renders as `.main-navigation` (classic) or
		// `.wp-block-navigation` (block theme).
		const navigation = page
			.locator(
				'#site-navigation, .main-navigation, .wp-block-navigation'
			)
			.first();
		await expect( navigation ).toBeVisible();
	} );

	test( 'Homepage visual regression', async ( { page } ) => {
		await expect( page ).toHaveScreenshot( 'homepage.png', {
			fullPage: true,
		} );
	} );
} );
