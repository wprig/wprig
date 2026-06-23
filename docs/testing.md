# Testing in WP Rig

WP Rig uses Playwright for End-to-End (E2E) testing, following WordPress Core testing standards.

## End-to-End Testing (Playwright)

### Prerequisites

Ensure your local development environment is running. By default, tests expect the site to be available at `http://localhost:8888`.

### Configuration

You can override the default base URL by setting the `WP_BASE_URL` environment variable.

```bash
export WP_BASE_URL="http://wprig.test"
npm run test:e2e
```

### Running Tests

- `npm run test:e2e`: Runs all E2E tests.
- `npm run test:e2e:ui`: Opens the Playwright UI for interactive testing and debugging.
- `npm run test:e2e:debug`: Runs tests in debug mode, stepping through each action.
- `npm run test:e2e:codegen`: Opens the Playwright Codegen tool to record new tests by interacting with the browser.
- `npm run test:e2e:screenshot`: Takes screenshots for regression testing of specific pages or elements.

### Default Tests

WP Rig comes with several default tests:

1. **Smoke Tests (`smoke.spec.ts`)**: Verifies the homepage loads, site title is visible, and navigation exists. Includes visual regression testing.
2. **Accessibility (`accessibility.spec.ts`)**: Runs automated accessibility audits using `axe-core` on key pages (404, Archive).
3. **Navigation (`navigation.spec.ts`)**: Tests mobile menu functionality and ARIA attribute changes.

### Regression Screenshot Testing

You can take screenshots of specific pages or elements for manual review or regression testing using the `test:e2e:screenshot` command. This tool is configured to automatically create or update snapshots without failing the test, making it ideal for "at will" captures.

Environment variables for configuration:

- `SCREENSHOT_URL`: The relative URL to navigate to (default: `/`).
- `SCREENSHOT_SELECTOR`: Optional CSS selector to screenshot a specific element instead of the full page.
- `SCREENSHOT_NAME`: The name of the screenshot file (default: `screenshot.png`).

Example usage:

```bash
# Screenshot a specific page
SCREENSHOT_URL="/about" SCREENSHOT_NAME="about-page.png" npm run test:e2e:screenshot

# Screenshot a specific element
SCREENSHOT_URL="/" SCREENSHOT_SELECTOR="#masthead" SCREENSHOT_NAME="header.png" npm run test:e2e:screenshot
```

### Finding Screenshots

After running `test:e2e:screenshot`, snapshots are saved in:
`tests/e2e/specs/screenshot.spec.ts-snapshots/`

Playwright appends the browser and platform to the filename (e.g., `homepage-chromium-darwin.png`).

If a test fails, visual comparisons and failure screenshots can be found in:
- `test-results/`: Contains folders for each failed test with actual, expected, and diff images.
- `playwright-report/`: Use `npx playwright show-report` to view a detailed HTML report of all tests and their artifacts.

### Tips for Coding Agents

When using the screenshot tool:
1.  **Discovery**: Always check `package.json` for `test:e2e:*` scripts to see available testing tools.
2.  **Verification**: After generating a screenshot, verify its existence in `tests/e2e/specs/screenshot.spec.ts-snapshots/`.
3.  **Iteration**: Use `SCREENSHOT_SELECTOR` to focus on specific UI components you are modifying to ensure no regressions.
4.  **Base URL**: If the site is not on `http://localhost:8888`, set `WP_BASE_URL` before running tests.

### Adding New Tests

New tests should be added to `tests/e2e/specs/`. You can use the `test:e2e:codegen` tool to help generate test code:

```bash
npm run test:e2e:codegen
```

This will open a browser window and a code generator. As you interact with the site, Playwright will generate the corresponding test code.

## Static Analysis (PHPStan)

WP Rig uses [PHPStan](https://phpstan.org/) for static analysis and type checking. This ensures that the PHP code is robust, follows type safety principles, and is free of common bugs.

### Running Analysis

- `composer phpstan`: Runs the PHPStan analysis.
- `composer phpstan:baseline`: Regenerates the error baseline.

### Configuration

The configuration is located in `phpstan.neon.dist`. WP Rig starts at a baseline level (Level 0) and includes a `phpstan-baseline.neon` file to manage existing technical debt.

### Increasing the Analysis Level

To improve the code quality, you can incrementally increase the `level` parameter in `phpstan.neon.dist`. The goal is to eventually reach Level 9 for complete type coverage.

When increasing the level:
1. Update `level` in `phpstan.neon.dist`.
2. Run `composer phpstan`.
3. Fix any new errors that appear.
4. If there are too many errors to fix at once, you can update the baseline using `composer phpstan:baseline`.
