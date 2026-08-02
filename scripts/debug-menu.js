import { chromium } from 'playwright';
import * as fs from 'fs';

async function run() {
	const browser = await chromium.launch({ headless: true });
	const page = await browser.newPage();
	await page.setViewportSize({ width: 375, height: 667 });

	console.log('Navigating to http://wprig.test:8888 ...');
	try {
		await page.goto('http://wprig.test:8888', { timeout: 30000 });
	} catch (err) {
		console.error('Navigation failed, trying localhost:8888...', err);
		await page.goto('http://localhost:8888', { timeout: 30000 });
	}

	await page.waitForLoadState('networkidle');

	// Find any responsive container open buttons or standard menu toggles
	const toggle = page.locator('.menu-toggle, .wp-block-navigation__responsive-container-open, button[aria-label*="Menu"], button[aria-label*="menu"]').first();
	const count = await toggle.count();
	console.log(`Found ${count} menu toggle(s).`);

	if (count > 0) {
		console.log('Clicking the mobile menu toggle...');
		await toggle.click();
		await page.waitForTimeout(1000); // wait for transitions
	} else {
		console.log('Warning: No menu toggle found! Dumping body to check...');
	}

	// Capture screenshot
	fs.mkdirSync('artifacts', { recursive: true });
	await page.screenshot({ path: 'artifacts/mobile-menu-debug.png' });
	console.log('Screenshot saved to artifacts/mobile-menu-debug.png');

	// Dump DOM of the body
	const bodyHTML = await page.locator('body').first().innerHTML();
	fs.writeFileSync('artifacts/mobile-menu-dom.html', bodyHTML);
	console.log('DOM dump saved to artifacts/mobile-menu-dom.html');

	await browser.close();
}

run().catch(console.error);
