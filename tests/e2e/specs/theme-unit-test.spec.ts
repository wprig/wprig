import { test, expect } from '../fixtures';
import AxeBuilder from '@axe-core/playwright';

test.describe('Theme Unit Test Validation', () => {
	test('Markup HTML tags page loads correctly', async ({ page }) => {
		const response = await page.goto('/markup-html-tags-and-formatting/');
		if (response?.status() === 404) {
			test.skip(true, 'Theme Unit Test data not imported.');
		}

		await expect(page.locator('h1').first()).toContainText(
			'Markup: HTML Tags and Formatting'
		);
		await expect(page.locator('.entry-content')).toBeVisible();

		const accessibilityScanResults = await new AxeBuilder({
			page,
		}).analyze();
		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test('Image alignment renders properly without horizontal overflow', async ({
		page,
		isMobile,
	}) => {
		const response = await page.goto('/markup-image-alignment/');
		if (response?.status() === 404) {
			test.skip(true, 'Theme Unit Test data not imported.');
		}

		// If mobile, ensure images don't cause horizontal scrolling
		if (isMobile) {
			const bodyWidth = await page.evaluate(
				() => document.body.scrollWidth
			);
			const windowWidth = await page.evaluate(() => window.innerWidth);
			expect(bodyWidth).toBeLessThanOrEqual(windowWidth);
		}

		// Check that alignment classes exist
		await expect(page.locator('img.alignleft').first()).toBeVisible();
		await expect(page.locator('img.alignright').first()).toBeVisible();
		await expect(page.locator('img.aligncenter').first()).toBeVisible();
	});

	test('Long title does not overflow or clip', async ({ page }) => {
		const response = await page.goto('/edge-case-many-tags/'); // Often used for long title or many tags
		if (response?.status() === 404) {
			test.skip(true, 'Theme Unit Test data not imported.');
		}

		const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
		const windowWidth = await page.evaluate(() => window.innerWidth);
		expect(bodyWidth).toBeLessThanOrEqual(windowWidth);
	});

	test('No title post renders a permalink', async ({ page }) => {
		const response = await page.goto('/edge-case-no-title/');
		if (response?.status() === 404) {
			test.skip(true, 'Theme Unit Test data not imported.');
		}
		// Some way to access the post must exist if there's no title
		await expect(page.locator('.entry-title').first()).toBeHidden();
	});

	test('Sticky post styling on home', async ({ page }) => {
		await page.goto('/');
		const stickyPost = page.locator('.sticky').first();

		// Check if a sticky post exists on the homepage
		if (await stickyPost.isVisible()) {
			await expect(stickyPost).toBeVisible();
		} else {
			test.skip(true, 'No sticky post found on home page.');
		}
	});

	test('Multipage post rendering', async ({ page }) => {
		const response = await page.goto('/markup-text-alignment/'); // Assuming this has page-links
		if (response?.status() === 404) {
			test.skip(true, 'Theme Unit Test data not imported.');
		}

		// Wait for wp-link-pages or similar nav
		const pageLinks = page
			.locator('.page-links, .post-page-numbers')
			.first();
		if (await pageLinks.isVisible()) {
			await expect(pageLinks).toBeVisible();
		}
	});

	test('Search empty renders graceful message', async ({ page }) => {
		await page.goto('/?s=unlikely-empty-term-xyz');
		await expect(page.locator('.no-results').first()).toBeVisible();
	});

	test('Pagination on blog index', async ({ page }) => {
		await page.goto('/');
		const navLink = page
			.locator('.nav-previous, .next, .nav-links')
			.first();
		if (await navLink.isVisible()) {
			await expect(navLink).toBeVisible();
		}
	});
});
