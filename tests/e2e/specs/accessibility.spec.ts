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

	test('Skip link works correctly', async ({ page }) => {
		await page.goto('/');

		// Tab to first focusable element
		await page.keyboard.press('Tab');

		const focusedElement = page.locator('*:focus');
		await expect(focusedElement).toBeVisible();

		// Typically the first link is the skip link
		const href = await focusedElement.getAttribute('href');
		if (href && href.startsWith('#')) {
			const targetId = href.replace('#', '');
			const target = page.locator(`id=${targetId}`);
			await expect(target).toBeAttached();
		}
	});

	test('Focus outline is visible', async ({ page }) => {
		await page.goto('/');

		// Focus on the first link
		await page.keyboard.press('Tab');
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
