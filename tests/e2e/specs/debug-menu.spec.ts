import { test, expect } from '../fixtures';
import * as fs from 'fs';

test( 'debug mobile menu', async ( { page } ) => {
	await page.goto( '/' );

	// Force viewport to mobile size
	await page.setViewportSize( { width: 375, height: 667 } );

	// Wait for the page load
	await page.waitForLoadState( 'networkidle' );

	// Locate and click the menu toggle to open the mobile menu
	const openButton = page.locator( '.menu-toggle, .wp-block-navigation__responsive-container-open' ).first();
	await expect( openButton ).toBeVisible();
	await openButton.click();

	// Wait for any animations to settle
	await page.waitForTimeout( 1000 );

	// Capture a screenshot of the open mobile menu
	await page.screenshot( { path: 'artifacts/mobile-menu-debug.png', fullPage: false } );

	// Dump the HTML content of the navigation container
	const navHTML = await page.locator( 'body' ).first().innerHTML();
	fs.writeFileSync( 'artifacts/mobile-menu-dom.html', navHTML );

	console.log( '--- DOM DUMP COMPLETED ---' );
} );
