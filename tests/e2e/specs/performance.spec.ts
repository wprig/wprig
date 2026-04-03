import { test, expect } from '@playwright/test';

test.describe( 'WP Rig Performance Optimizations', () => {
	test.beforeEach( async ( { page } ) => {
		await page.goto( '/' );
	} );

	test( 'Critical header styles are inlined in the head on first visit', async ( {
		page,
	} ) => {
		const criticalStyle = await page.locator(
			'style#wprig-critical-wp-rig-header-navigation-critical-css'
		);
		await expect( criticalStyle ).toBeAttached();
		const content = await criticalStyle.innerHTML();
		// Check for some header-related CSS from _header.css or _navigation.css
		expect( content ).toContain( '.site-header' );
	} );

	test( 'Critical header styles are not inlined when cookie is present', async ( {
		context,
		page,
	} ) => {
		// Set the cookie
		await context.addCookies( [
			{
				name: 'wprig_critical_cached',
				value: 'true',
				domain: 'localhost',
				path: '/',
			},
		] );

		await page.goto( '/' );

		// Check that the inline style is NOT present
		const criticalStyle = await page.locator(
			'style#wprig-critical-wp-rig-header-navigation-critical-css'
		);
		await expect( criticalStyle ).not.toBeAttached();

		// Check that the external stylesheet IS present
		const externalStyle = await page.locator(
			'link#wp-rig-header-navigation-critical-css'
		);
		await expect( externalStyle ).toBeAttached();
	} );

	test( 'Emoji scripts and styles are removed', async ( { page } ) => {
		const emojiScript = await page.locator(
			'script:has-text("window._wpemojiSettings")'
		);
		await expect( emojiScript ).not.toBeAttached();
		const emojiStyle = await page.locator(
			'style:has-text("img.wp-smiley")'
		);
		await expect( emojiStyle ).not.toBeAttached();
	} );
} );
