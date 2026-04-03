import { test, expect } from '@playwright/test';

test.describe( 'WP Rig Performance Optimizations', () => {
	test.beforeEach( async ( { page } ) => {
		await page.goto( '/' );
	} );

	test( 'Critical CSS is inlined in the head', async ( { page } ) => {
		const criticalStyle = await page.locator(
			'style#wprig-critical-test-critical-css'
		);
		await expect( criticalStyle ).toBeAttached();
		const content = await criticalStyle.innerHTML();
		expect( content ).toContain( '.test-critical' );
	} );

	test( 'Delayed scripts do not load until interaction', async ( {
		page,
	} ) => {
		// Assert that the script has data-src and not src yet.
		const delayedScript = await page.locator(
			'script[data-rig-strategy="delay"]'
		);
		await expect( delayedScript ).toBeAttached();
		const src = await delayedScript.getAttribute( 'src' );
		expect( src ).toBeNull();
		const dataSrc = await delayedScript.getAttribute( 'data-src' );
		expect( dataSrc ).toContain( 'test-delayed.min.js' );

		// Simulate interaction.
		await page.mouse.move( 100, 100 );
		await page.mouse.wheel( 0, 100 );

		// Assert that src is now restored.
		await expect( delayedScript ).toHaveAttribute( 'src', dataSrc! );
	} );

	test( 'Resource hints for preloading are present', async ( { page } ) => {
		const preloadLink = await page.locator(
			'link[rel="preload"]#test-preload-preload'
		);
		await expect( preloadLink ).toBeAttached();
		await expect( preloadLink ).toHaveAttribute( 'as', 'style' );
		await expect( preloadLink ).toHaveAttribute(
			'href',
			/test-preload\.min\.css/
		);
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
