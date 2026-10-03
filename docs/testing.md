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

The suite runs across **chromium**, **firefox**, and **webkit** projects. Total workers default to 4 (CI: 1) so the local WordPress harness isn't overwhelmed — on heavily loaded local stacks, WebKit page loads can exceed the 30s default timeout under higher parallelism. Two WebKit-specific notes are handled in the specs themselves: synthetic `Tab` doesn't reach clipped skip-links (explicit `focus()` is used on webkit), and the desktop watch-mode visual-nav suite skips the deepest 5-level flyout hover chain (see `visual-navigation.spec.ts`).

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
3. **Navigation (`navigation.spec.ts`)**: Tests basic site navigation functionality and ARIA attribute changes.
4. **Visual Navigation Suite (`visual-navigation.spec.ts`)**: Automated visual test suite covering ALL navigation (desktop top-level hovering, submenus, keyboard traversal, dynamic viewport transitions, and mobile menu toggles) with visual pacing and element highlighting.
5. **Mobile Navigation Suite (`mobile-navigation.spec.ts`)**: Comprehensive testing for WP Rig's mobile navigation system across multiple viewports, 5-level deep nested submenus, positioning, and developer lock modes.

### Visual Automated Navigation Testing

The Visual Navigation test suite (`tests/e2e/specs/visual-navigation.spec.ts`) provides a visual automated watch mode for **all** theme navigation (both Desktop and Mobile):

#### What You Will See When Watching
- **Desktop Navigation & Hovering**: Pops open a new browser window, highlights and hovers over all top-level menu items, and traverses through deep nested dropdowns (L1 through L5) with visual pauses.
- **Keyboard Traversal**: Highlights elements as keyboard `Tab` focus moves through navigation items.
- **Dynamic Viewport Transitions**: Resizes the browser smoothly from Desktop (`1280x800`) to Tablet (`768x1024`) to Phablet (`412x915`) to Small Mobile (`375x667`), showing the responsive navigation layout adapt.
- **Mobile Menu & Deep Submenu Interactions**: Clicks the mobile hamburger toggle, expands 5-level deep submenus step-by-step, tests Developer Lock Mode (`Alt + Click`), and closes the menu.

#### How to Run Visual Watch Mode
To launch the headed browser and watch the automated navigation test execute with visual pacing across all viewports (or explicitly locked to Mobile or Desktop):

```bash
# Run full visual watch suite (Desktop + Mobile)
npm run test:e2e:nav:watch

# Launch visual watch test directly in Mobile mode (375x750 viewport)
npm run test:e2e:nav:watch:mobile

# Launch visual watch test in Desktop mode (1280x800 viewport)
npm run test:e2e:nav:watch:desktop
```

You can also control mobile execution on the fly via the `MOBILE=1` environment variable or Playwright test filters:
```bash
MOBILE=1 npm run test:e2e:nav:watch
# or filter by tag
npm run test:e2e:nav:watch -- -g @mobile
```

You can adjust the speed of the visual pauses using the `SLOWMO` environment variable (in milliseconds):
```bash
SLOWMO=1200 npm run test:e2e:nav:watch
```

### Spatial & Visual Regression Testing (Part A)

The Spatial & Visual Regression suite (`tests/e2e/specs/spatial-layout.spec.ts`)
provides deterministic geometric layout checks built on Playwright
`boundingBox()`. Unlike pixel snapshots, it reasons about geometry (overlap /
bounds / containment), so it is **environment-independent** — immune to font,
OS, and antialiasing variance — and runs anywhere the frontend renders.

Geometry helpers live in `tests/e2e/utils/spatial.ts`:

- `assertNoHorizontalOverflow` — the document/body `scrollWidth` must not exceed
  the viewport width (catches overflowing tables, images, and long tokens).
- `assertRegionsDoNotOverlap` — structural regions (header / main / sidebar /
  footer) must not collide. Resolved paradigm-agnostically: the same selector
  lists serve classic markup (`.site-header`, `.site-main`, `.widget-area`,
  `.site-footer`) and block-based markup (`.wp-site-blocks` template-part
  groups).
- `assertSiblingsDoNotOverlap` — direct block children of `.entry-content`
  stack cleanly without colliding.
- `isWithinViewport` / `isHorizontallyWithinViewport` / `isContainedWithin` —
  containment primitives for custom assertions.

Every assertion takes a pixel `tolerance` (default `2`) so hairline borders and
shadows never register as collisions.

The suite runs six page audits (home, single post, theme-unit-test stress page,
archive, search, 404) across four viewports that track the WP 7.1
`settings.viewport` scale — small mobile `375`, mobile `480`, tablet `782`,
desktop `1280` — plus a mobile-menu-open audit that asserts the opened menu
stays on-screen without introducing horizontal scroll.

```bash
npm run test:e2e:spatial       # headless (all installed browser projects)
npm run test:e2e:spatial:watch # headed, watch a component live
```

### Mobile Navigation Testing

The Mobile Navigation test suite (`tests/e2e/specs/mobile-navigation.spec.ts`) is designed to validate complex navigation structures in both Classic theme and Gutenberg Block navigation modes.

#### Key Features Tested
- **Multi-Viewport Responsiveness**: Validates hamburger toggle visibility and container state across Small Mobile (375x667), Phablet (412x915), Tablet (768x1024), and Desktop (1280x800).
- **Injected 5-Level Deep Submenus**: Uses self-contained DOM fixtures to dynamically inject 5-level deep nested submenus (`L1` through `L5`) for deterministic testing regardless of local WordPress database content.
- **Bounding Box & Containment Assertions**: Verifies expanded submenus remain properly bounded within the viewport.
- **Collision Observer (`.open-left`)**: Tests automatic repositioning when submenus approach the right screen boundary.
- **Menu States & Developer Lock Mode**: Verifies active menu classes (`.current-menu-item`, `.current-menu-ancestor`), keyboard traversal, and `Alt + Click` developer menu locking (`body.mobile-menu-locked`).

#### Running Mobile Navigation Tests

1. **Headless Execution (Background / CI)**:
   Runs all mobile navigation tests silently in the background:
   ```bash
   npm run test:e2e:mobile-nav
   ```

2. **Visual Watch Mode (Live Headed Browser)**:
   Launches a live Chromium browser window so you can watch Playwright execute each interaction step-by-step in real time:
   ```bash
   npm run test:e2e:mobile-nav:watch
   ```

3. **Running Specific Viewport or Test Scenarios**:
   You can pass Playwright filter flags directly to the npm script:
   ```bash
   # Run only viewport responsiveness tests in watch mode
   npm run test:e2e:mobile-nav:watch -- -g "Multiple Viewport Scenarios"

   # Run only 5-level deep submenu tests
   npm run test:e2e:mobile-nav -- -g "Deeply Nested Submenus"
   ```

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
