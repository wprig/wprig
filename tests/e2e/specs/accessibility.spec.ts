import { test, expect } from '../fixtures';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility & Core Interaction', () => {
	test('Home page should be accessible', async ({ page }) => {
		await page.goto('/');
		const accessibilityScanResults = await new AxeBuilder({
			page,
		}).analyze();
		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test('Single post should be accessible', async ({ page }) => {
		await page.goto('/hello-world/');
		const accessibilityScanResults = await new AxeBuilder({
			page,
		}).analyze();
		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test('Search page should be accessible', async ({ page }) => {
		await page.goto('/?s=hello');
		const accessibilityScanResults = await new AxeBuilder({
			page,
		}).analyze();
		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test('404 page should be accessible', async ({ page }) => {
		await page.goto('/this-page-does-not-exist-12345');
		await expect(page.locator('body')).toHaveClass(/error404/);
		const accessibilityScanResults = await new AxeBuilder({
			page,
		}).analyze();
		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test('Archive page should be accessible', async ({ page }) => {
		await page.goto('/?post_type=post');
		const accessibilityScanResults = await new AxeBuilder({
			page,
		}).analyze();
		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test('Skip link works correctly', async ({ page }, testInfo) => {
		await page.goto('/');

		const skipLink = page
			.locator('.skip-link, a[href^="#wp--skip-link--target"], a.screen-reader-text[href^="#"]')
			.first();
		await expect(skipLink).toBeAttached();

		const href = await skipLink.getAttribute('href');
		if (href && href.startsWith('#')) {
			const targetId = href.replace('#', '');
			const target = page.locator(`id=${targetId}`);
			await expect(target).toBeAttached();
		}

		if (testInfo.project.name === 'webkit') {
			// WebKit's synthetic Tab does not reach clipped (screen-reader-text)
			// links, so keyboard-tab assertion is skipped; explicit focus still
			// works and confirms the link is focusable.
			await skipLink.focus();
			await expect(skipLink).toBeFocused();
			return;
		}

		// Tab to first focusable element
		await page.keyboard.press('Tab');

		const focusedElement = page.locator('*:focus');
		await expect(focusedElement).toBeVisible();
		await expect(focusedElement).toHaveText(/Skip to content/i);
	});

	test('Focus outline is visible', async ({ page }, testInfo) => {
		await page.goto('/');

		const skipLink = page
			.locator('.skip-link, a[href^="#wp--skip-link--target"], a.screen-reader-text[href^="#"]')
			.first();
		await expect(skipLink).toBeAttached();

		if (testInfo.project.name === 'webkit') {
			// Same WebKit Tab quirk as above: focus the skip link directly.
			await skipLink.focus();
		} else {
			// Focus on the first link
			await page.keyboard.press('Tab');
		}
		const focusedElement = page.locator('*:focus');

		// Ensure it has some form of outline or distinct background
		const outline = await focusedElement.evaluate(
			(el) => window.getComputedStyle(el).outlineStyle
		);
		const boxShadow = await focusedElement.evaluate(
			(el) => window.getComputedStyle(el).boxShadow
		);

		const hasVisibleFocus = outline !== 'none' || boxShadow !== 'none';

		// We expect the theme to provide a visible focus state
		expect(hasVisibleFocus).toBeTruthy();
	});
});
