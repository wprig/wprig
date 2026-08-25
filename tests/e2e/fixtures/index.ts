/**
 * Test fixtures for E2E specs.
 *
 * Re-exports Playwright's base `test`/`expect`. Historically this re-exported
 * `@wordpress/e2e-test-utils-playwright` so specs could opt into WP-specific
 * fixtures (Admin, Editor, RequestUtils, PageUtils). That package's CommonJS
 * output crashes Playwright's module loader on Node 24 ("Unexpected module
 * status 3"), and no shipped spec consumes those fixtures — every spec only
 * uses `page` + `expect` from the base. Keep the base import here so specs
 * don't need to change; import WP utilities directly from the package only if
 * a future spec genuinely needs them.
 */
import { test, expect } from '@playwright/test';

export { test, expect };
