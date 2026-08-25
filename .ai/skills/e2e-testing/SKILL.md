---
description: Guide for writing and running Playwright E2E tests for WP Rig theme components to ensure reliability and accessibility.
globs: tests/e2e/**/*, playwright.config.ts
---

# Playwright E2E Testing in WP Rig

WP Rig uses Playwright for End-to-End (E2E) testing, following WordPress Core testing standards. This skill is vital for automated verification of UI components, accessibility, and visual regressions.

## Key Commands

Use the following NPM scripts for E2E testing:

- `npm run test:e2e`: Runs all E2E tests.
- `npm run test:e2e:nav:watch`: Runs full visual navigation watch test suite in headed browser mode.
- `npm run test:e2e:nav:watch:mobile`: Launches visual watch test directly in mobile viewport mode.
- `npm run test:e2e:nav:watch:desktop`: Launches visual watch test directly in desktop viewport mode.
- `npm run test:e2e:mobile-nav`: Runs 5-level deep mobile navigation tests in headless background mode.
- `npm run test:e2e:mobile-nav:watch`: Runs 5-level deep mobile navigation tests in live headed watch mode.
- `npm run test:e2e:spatial`: Runs the Spatial & Visual Regression suite (Part A) — deterministic `boundingBox()` geometry checks (no horizontal overflow, no region overlap, content-sibling collisions, viewport containment).
- `npm run test:e2e:spatial:watch`: Same suite in live headed watch mode.
- `npm run test:e2e:ui`: Opens the Playwright UI for interactive testing and debugging.
- `npm run test:e2e:debug`: Runs tests in debug mode, stepping through each action.
- `npm run test:e2e:codegen`: Opens the Playwright Codegen tool to record new tests by interacting with the browser.
- `npm run test:e2e:screenshot`: Takes screenshots for regression testing of specific pages or elements.

## Configuration

The default base URL is `http://localhost:8888`. You can override it by setting the `WP_BASE_URL` environment variable:

```bash
export WP_BASE_URL="http://wprig.test"
npm run test:e2e
```

## Writing E2E Tests

### Test Structure
- **`tests/e2e/specs/`**: Place all `.spec.ts` files here.
- **`tests/e2e/fixtures/`**: Custom Playwright fixtures.
- **`tests/e2e/utils/`**: Theme-specific helper functions.

### Example: Smoke Test
A basic test should verify core theme elements.

```typescript
import { test, expect } from '@playwright/test';

test.describe('Theme Smoke Test', () => {
    test('homepage loads and has header', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#masthead')).toBeVisible();
        await expect(page.locator('.site-title')).not.toBeEmpty();
    });
});
```

### Accessibility Testing
WP Rig uses `@axe-core/playwright` for accessibility audits.

```typescript
import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test('accessibility audit', async ({ page }) => {
    await page.goto('/404');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
});
```

## Visual Regression (Screenshots)

Use `test:e2e:screenshot` to capture and compare UI states.

- `SCREENSHOT_URL`: The relative URL (default: `/`).
- `SCREENSHOT_SELECTOR`: CSS selector for a specific element.
- `SCREENSHOT_NAME`: Filename (default: `screenshot.png`).

```bash
SCREENSHOT_URL="/contact" SCREENSHOT_NAME="contact-page.png" npm run test:e2e:screenshot
```

## Spatial & Visual Regression (Part A — geometry)

Pixel snapshots compare against the environment they were recorded in; the
spatial suite (`tests/e2e/specs/spatial-layout.spec.ts`, helpers in
`tests/e2e/utils/spatial.ts`) instead asserts **geometry** via `boundingBox()`,
so it is environment-independent and catches the classic responsive bugs:

- **No horizontal overflow** — `scrollWidth` never exceeds the viewport
  (overflowing tables, images, unbroken tokens).
- **Regions don't overlap** — structural regions (header / main / sidebar /
  footer) never collide; selector lists are paradigm-agnostic so the same suite
  serves classic and block-based themes.
- **Content siblings don't collide** — direct children of `.entry-content`
  stack cleanly.
- **Viewport containment** — opened mobile menus and content containers stay
  on-screen.

All assertions take a pixel `tolerance` (default `2`). Viewports track
`settings.viewport` (mobile 480 / tablet 782) plus 375 and 1280. Prefer
`npm run test:e2e:spatial` during rapid layout prototyping — it is deterministic
and ~3s across pages on a live site.

## Agentic Iteration (Ralph Loop)

Use E2E tests to create a fast feedback loop:
1.  **Define**: Identify the UI component or flow to change.
2.  **Record**: Use `npm run test:e2e:codegen` to quickly generate a test for the current state.
3.  **Implement**: Make your code changes.
4.  **Verify**: Run the E2E test to confirm the change works as expected.
5.  **Refine**: If it fails, use `npm run test:e2e:ui` to debug visually and fix.

## Best Practices

- **Use Locators**: Prefer `page.locator()` over `$` for stability.
- **WordPress Utils**: Leverage `@wordpress/e2e-test-utils-playwright` for dashboard interactions and login.
- **Clean State**: Ensure tests don't depend on each other's side effects.
- **Visuals**: Check `test-results/` and `playwright-report/` for failure artifacts (actual vs expected screenshots).
