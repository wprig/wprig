# Changelog

## 3.5.0
- **WP 7.1 theme.json v3 (G1):** `theme.json` upgraded to v3 / 7.1 schema — added `settings.viewport` (mobile 480px / tablet 782px), explicit `settings.blockVisibility` (`allowEditing: true`), and layout sizes derived from tokens. `scripts/tasks/tokens.js` is now the **sole** `theme.json` writer (pure `buildThemeJson()`); `node/editorSupport.js` delegates to it. Pseudo-state styling enabled (hover/focus/active). Props @robruiz
- **Viewport-driven breakpoints (G2):** all 7 `@custom-media` aliases now derive from `settings.viewport` values (480/782px) via `config/tokens.json.breakpoints`; `--mobile-breakpoint` is 782px and the JS em→px conversion is removed. One breakpoint scale for every paradigm — the editor and frontend agree. Props @robruiz
- **Interactive (pseudo-state) styles (G3):** link hover/focus/active/visited states migrated into `theme.json styles.elements.link` (conflict-audited vs buttons/forms/nav); `_links.css` trimmed to focus/outline affordances only; fixed an invalid `foreground` → `text` palette slug in the body text color. Props @robruiz
- **Editor iframe verification (G4):** `add_editor_style` CSS confirmed rendering in WP 7.1's fully iframed canvas. The `global-styles-css-custom-properties-inline-css … added to the iframe incorrectly` console notice is a confirmed **WP core quirk** (handle is core-generated; disabling theme editor styles does not remove it) — styles apply correctly; monitoring core. Props @robruiz
- **Block-based CSS surface:** new `assets/css/src/_blocks-based.css` (gated to universal/block-based via `dev.styles.preloadBlockBased` + `isFeatureEnabled('block-based')`) ships a solid starter baseline for FSE core blocks — Navigation block desktop + mobile-toggle alignment, Theme Part spacing, Query Loop defaults. Never loads in classic themes. Props @robruiz
- **Block Patterns registry (`inc/Block_Patterns`, block-based):** config-seeded, filterable pattern categories (`wprig_block_pattern_categories`) + registration of installed components' bundled `patterns/` dirs via a `wprig_block_patterns` filter (local equivalent of the absent core `register_block_patterns_from_directory`). Theme `patterns/` auto-registration untouched. Companion tooling: `rig:pattern` scaffolding with i18n-aware headers + new `lint:patterns` validator (metadata + block-markup checks) added to `ai:check`; `lint:blocks` fixed and reused via a shared schema validator. Props @robruiz
- **Paradigm foundation (Track A):** single-source-of-truth paradigm system — `config/paradigms.json`, JS/PHP helpers, generic component gating (`Paradigm_Component_Trait`, `PARADIGM` consts), fail-fast validation, jest + PHPUnit coverage. Block features are strictly gated out of the classic core. Props @robruiz
- **Block Visibility alignment (G8):** WP Rig's responsive nav now shares the `settings.viewport` scale with core's block-visibility (`wp-block-hidden-*`) media queries — hamburger hides at 481px, nav collapses at 782px. Guidance documented: use block-visibility for content blocks; keep Navigation/theme parts theme-managed to avoid double-toggling. Props @robruiz
- **Accepted behavior changes (WP 7.1 breakpoint adoption):** classic themes' responsive layout shifts to the 480/782px scale — sidebar appears at 783px (was 960), gallery columns switch at 481px (was 640), the nav hamburger hides at 481px (was 600), and the JS nav-collapse boundary is 782px (was 880). Media queries no longer scale with root font size (em→px, matching WP-native behavior). Regenerating `theme.json` from tokens changes the block editor palette to the token values (single source of truth). Props @robruiz

## 3.4.2
- Added comprehensive E2E mobile and visual navigation test suites (`tests/e2e/specs/mobile-navigation.spec.ts` and `tests/e2e/specs/visual-navigation.spec.ts`) featuring multi-viewport responsiveness, 5-level deep submenu nesting, position/containment assertions, keyboard focus traversal, element highlighting, visual pacing (`SLOWMO`), and developer lock mode toggles. Includes dedicated npm scripts (`test:e2e:mobile-nav`, `test:e2e:mobile-nav:watch`, `test:e2e:nav:watch`, `test:e2e:nav:watch:mobile`, `test:e2e:nav:watch:desktop`) for CI headless background execution and headed live browser watch mode. Props @robruiz
- Improved the agentic development and local visual feedback loop by automating Playwright Chromium installation during onboarding (`npm run ai:setup`) and implementing a highly detailed, token-cheap semantic DOM layout and sibling proximity inspector utility at `.ai/tools/inspect.js`. This is coupled with a "Measurement-First" two-tier visual styling loop documented in the styles skill (`.ai/skills/styles/SKILL.md`) and verified by fully automated unit tests under `scripts/tests/inspect.test.js`. Props @robruiz
- Added a comprehensive `theme-review` agent skill and operational playbook for mimicking official WordPress.org Theme Review guidelines. Outlines distinct evaluation branches for Classic/Hybrid and Modern Block Themes (Full Site Editing / `theme.json` schemas) along with universal, strict "Accessibility-Ready" WCAG criteria. Includes detailed workflows for transitioning PHPCS to the `WPThemeReview` ruleset, setting up the `Theme Sniffer` and `Theme Check` plugins in local environments, configuring runtime diagnostics (Query Monitor, Log Deprecated Notices), and importing/testing with the official WordPress Theme Unit Test data. Props @robruiz
- Added QOL feature to navigation JS. If you hold the alt/option key while toggling mobile menu in block-based theme dev, mobile menu locks and does not close when clicking on dev tools. Props @robruiz
- Prevented submenu and sub-submenu items from overflowing the viewport (Issue #845) using an ultra-modern hybrid system combining CSS Anchor Positioning (zero-JS, zero-flicker native auto-alignment) and a highly optimized TypeScript Intersection Observer fallback for non-supporting browsers. Props @robruiz
- Resolved magic numbers in navigation logic (issue #925) by establishing `--mobile-breakpoint` as a runtime CSS custom property single source of truth (SSOT) dynamically parsed by both `global.ts` and `navigation.ts`. Props @robruiz
- Aligned other hardcoded layout breakpoints in CSS stylesheets (`_blocks.css` and `_media.css`) to use proper custom media queries (`--content-query` and `--medium-query`). Props @robruiz
- Fixed child theme bug and added child theme compatibility tests, refactor asset and translation handling, and document version management. Props @robruiz
- Aligned Prettier configuration with ESLint and EditorConfig to ensure consistent formatting across all editors. Props @robruiz
- Updated all npm and Composer dependencies to their latest versions, including WordPress packages, ESLint, Playwright, and several Composer packages. Props @robruiz
- Added `ergebnis/agent-detector` to improve AI agent environment detection. Props @robruiz
- Refactored font handling to support variable fonts and improved Google Fonts query generation. Props @robruiz
- Added Gutenberg block schema validator and automated validation workflows. Props @robruiz
- Introduced PHP-only block scaffolding support for WordPress 7.0. Props @robruiz
- Enhanced block build workflow with name/class safeguarding and prioritized processing. Props @robruiz
- Fixed various linting issues surfacing from dependency updates. Props @robruiz
- Added automated version promotion CLI command. Props @robruiz
- Leveraged pre-compiled block manifests (Issue #936) for high-performance batch block registration using modern WordPress 6.7 and 6.8 APIs, completely eliminating filesystem directory scanning and individual JSON parsing at runtime while maintaining 100% backward compatibility. Props @robruiz
- **Modern CSS enforcement pack (Track C1):** `lint:css` now fails on nesting depth > 3, selector specificity above `(0,4,1)`, `!important`, custom properties read without `var()`, and descending-specificity. The specificity budget was calibrated against the real codebase (34 over-cap selectors refactored to `:where()`/class selectors) with documented exemptions for the `screen-reader-text` `!important` pattern and `_navigation.css`'s pre-existing file-level disable. Props @robruiz
- **Modern CSS Playbook (Track C2):** rewrote the styles skill as an authoritative technique reference — Lightning CSS (correcting the stale PostCSS claim), the enforced budget, native nesting, `:is()`/`:where()` specificity control, `@layer`, custom properties, container queries, logical properties, `:has()`, and a generated custom-media reference sourced from `settings.viewport` instead of hardcoded values. Props @robruiz
- **CSS module architecture audit (Track C5):** consolidated all block-level CSS into `_blocks.css` (moved 26 `.has-*` utilities, block-image alignment, and the Search-block dark-mode rule), so `content.css`, `_media.css`, and `_forms.css` are now block-selector-free. `docs/css-architecture.md` documents each module's droppable scenario and the remaining irreducible couplings (`.wp-block-navigation` submenu integration in `_navigation.css`/`_header.css`, front-page overrides). Props @robruiz
- **Spatial & visual regression agents (Track D Part A):** deterministic geometric layout checks via Playwright `boundingBox()` — no horizontal overflow, no structural-region overlap, no content-sibling collisions, viewport containment, mobile-menu-open containment. Environment-independent (immune to font/OS pixel variance); `npm run test:e2e:spatial`. Docs in `docs/testing.md` + the e2e-testing skill. Props @robruiz
- **PHPCS reasons against WP 7.1 / PHP 8.1 (Track D):** `minimum_supported_wp_version` 4.5 → 7.1 and `testVersion` 8.0-99.0 → 8.1-99.0 in `phpcs.xml.dist`; `readme.txt`/`style.css` `Tested up to 7.1`. Props @robruiz
- **Media pipeline emits AVIF (Track D G7):** verified sharp 0.35.3 — AVIF encodes via `heif({ compression: 'av1' })` (8-bit + 10-bit/HDR-capable); HEIC/HEVC is deliberately not a target (no HEVC codec in the shipped build, Safari-only + patent-encumbered). `convertToWebP` → `convertToModernFormats` emits `.webp` + `.avif` with a graceful codec fallback; documented in `docs/architecture.md`. Props @robruiz
- **Block tooling aligned with Gutenberg 23.8 (Track D G6):** `block:new` scaffolds `apiVersion: 3` throughout (minimal/adjusted `block.json` + static templates); PHP-only blocks confirmed `supports.autoRegister`-aligned; the flawless-gutenberg-fse skill gains a "Gutenberg 23.8 / WP 7.1 Alignment" section; `theme.json` preset slugs audited kebab-cased. Props @robruiz
- **Paradigm-aware child themes (Track D):** `childify` now derives its component keep-list from the active theme type via the shared config (classic core for classic; + Editor/Blocks/Block_Patterns/Block_Styles/Icons for universal & block-based), writes `inc/components-manifest.json` through the framework-native mechanism, and never leaks `config.local.json` into a shipped child. Removes the obsolete regex-based Theme.php component stripper. Props @robruiz
- **Block markup validator validates self-closing blocks (review):** `lint:blocks` now checks self-closing template-part/void blocks (`<!-- wp:header ... /-->`), which the previous regex silently skipped — the harness template went from 1/4 to 4/4 blocks checked while still reporting PASSED. Props @robruiz
- **PHP/JS config parity (review):** `Theme::get_config()` merges `config.local.json` (matching the JS chain `default → config → local`), so PHP paradigm gating and the JS build resolve the same active theme type even when overridden locally. Props @robruiz
- **Component pattern slugs namespaced (review):** `inc/Block_Patterns` prefixes bare pattern slugs with their owning component so two components can never register colliding names. Props @robruiz
- **A11y suite is green (review):** dev toolbar `role=tablist` now contains only `role=tab` children and its warning badge passes WCAG contrast; scrollable `pre`/`code`/`table` regions get `tabindex="0"` (WCAG 2.1.1) via `inc/Accessibility`; the landmarked block starter template (`templates/index.html`) ships `<header>`/`<main>`/`<footer>` landmarks. Props @robruiz
- **E2E suite is fully runnable and green (review):** the shared fixture no longer re-exports `@wordpress/e2e-test-utils-playwright` (its CJS output crashed Playwright's loader on Node 24), specs are paradigm-agnostic, screenshot baselines are recorded for all three browsers, Firefox/WebKit Playwright builds are supported, and the worker cap keeps the Local harness responsive. `npm run ai:check` now exits 0 across chromium + firefox + webkit (134 e2e tests passing). Props @robruiz
- **`gutenberg-bridge.php` is PHPCS-clean (review):** the last remaining full-suite PHPCS error file is now 0 errors/0 warnings (`$action` → `$bridge_action`, `json_encode` → `wp_json_encode`, documented escaping exemptions, full `@param` docs). Props @robruiz

## 3.4.1
- Fixed pathing resolution error in the `npm run ai:setup` command (`scripts/tasks/aiSetup.js`) to load template files from the theme root folder instead of a non-existent `.templates/ai/` directory. Props @robruiz
- Added explicit `.gitignore` exclusions for all 12 generated local agent-specific configurations to keep the git staging index and developer pull requests clean. Props @robruiz
- Re-synchronized and updated all local agent-specific instructions in the root (like `GEMINI.md`, `CLAUDE.md`, `.cursorrules`, etc.) to match the streamlined 3.2KB compressed master guidelines file, reducing background token consumption by over 55%. Props @robruiz
- Marked onboarding as completed and updated the agent state log in `.ai/agent-state.md`. Props @robruizLook

## 3.4.0
- Enhanced configuration retrieval and asset loading logic with transient-based caching. Props @robruiz
- Improved component loading and caching in `Theme.php` for better performance and fallback handling. Props @robruiz
- Conducted codebase clean-up and refactoring across components, tests, and styles for improved maintainability. Props @robruiz
- Improved test coverage for internal scripts. Props @robruiz
- Replaced the automated `rig:submit` command with a manual `rig:prepare` workflow to simplify open-source contributions. Props @robruiz
- Fixed public registry data fetching and improved recursive dependency resolution. Props @robruiz
- Fixed and improved the block-based theme conversion script and setup during `rig-init`. Props @robruiz
- Added a new logger utility to `rig.js` for better debugging and terminal feedback. Props @robruiz
- Implemented robust path traversal protection in `rig` CLI by sanitizing all incoming manifest data (slugs, filenames, asset paths). Props @robruiz
- Refactored `npm install` logic in CLI to use `spawnSync` with argument arrays, preventing shell-based injection vulnerabilities. Props @robruiz
- Added a global `--yes` flag to all `rig` commands to facilitate automated CI/CD and agent-based workflows. Props @robruiz
- Introduced a new diagnostic command to validate local component structure, namespaces, and manifest integrity. Props @robruiz
- Updated `Theme.php` and CLI to ensure normalized component names always form valid PHP identifiers (e.g., prepending underscores to numeric starts). Props @robruiz
- Enhanced the registry CLI to provide clearer feedback during recursive dependency resolution and version conflicts. Props @robruiz
- Introduced a modular critical asset strategy for "Best of Both Worlds" loading (Cookie-based inlining). Props @robruiz
- Extracted header and navigation styles to a dedicated critical CSS file for optimized above-the-fold rendering. Props @robruiz
- Updated Asset_Provider manifest system to support custom loading strategies. Props @robruiz
- Migrated navigation scripts to use the manifest-driven performance system. Props @robruiz
- Improved overall site performance with automated critical CSS inlining and interaction-delayed JS loading. Props @robruiz
- Resolved font flashing (FOUT) by switching default `font-display` to `block` and implementing automatic preloading for localized fonts. Props @robruiz
- Integrated Fonts component into the `Asset_Provider` architecture to allow automatic inlining of localized font CSS. Props @robruiz
- Initial merge of the distributed component registry for theme features. Props @robruiz
- Refactored `inc/Theme.php` to automatically discover and register components in the `inc/` directory. Props @robruiz
- Updated scaffolding to include `manifest.json`, `SPEC.md`, and `SKILL.md` for registry readiness. Props @robruiz
- Introduced new command suite (`npm run rig:*`) for full component lifecycle management. Props @robruiz
- Updated to support OCR standards and removed legacy hardcoded registration logic. Props @robruiz
- Developed the registry WordPress plugin with GitHub API integration for `wprig.io`. Props @robruiz
- Updated CLI to support authenticated API calls via WordPress Application Passwords. Props @robruiz
- Added `inc/Registry_Config` component to the theme for automated registry discovery and filter-based setup. Props @robruiz
- Updated the registry plugin and theme to support public GitHub repositories without requiring a Personal Access Token (PAT). Props @robruiz
- Implemented multi-layer validation for component submissions, directory traversal protection in API and CLI, and added a security scanner to `rig:test-component`. Props @robruiz
- Added GitHub Action templates for automated OWASP Top 10 scanning of registry repositories. Props @robruiz
- Added `component-registry` skill in `.ai/skills/` for agentic support of the OCR. Props @robruiz

## 3.3.0
- added skills Props @robruiz
- added MCP for documentation access Props @robruiz
- added ai agent script that sets up WP Rig for specific agents Props @robruiz
- leverage screenshot capabilties for self-assessment Props @robruiz
- minor updates to composer and node deps Props @robruiz
- updates to config to explicitly declare theme type (agents reference this) Props @robruiz
- initial pass on agents.md Props @JonImmsWordpressDev

## 3.2.0
 - Added Playwright for E2E testing, including accessibility, navigation, and smoke tests. Props @robruiz
 - Added Lighthouse CI configuration for performance, accessibility, and SEO checks. Props @robruiz
 - Added PHPStan for static analysis and baseline configuration. Props @robruiz
 - Theme-level blocks are now an opt-in feature via a custom script for WP.org theme checker compatibility. Props @robruiz
 - Improved default mobile navigation and fixed mobile nav issues. Props @robruiz
 - Improved PHP type declarations and dev modern server. Props @robruiz
 - Added test data for theme testing and ensured E2E tests pass. Props @robruiz
 - Prevented CLI errors and cleaned up unused packages in package.json. Props @robruiz

## 3.1.0
 - New header and mobile nav experience. Props @robruiz
 - HMR alternative for BrowserSync added. BrowserSync will now be considered deprecated. Props @robruiz
 - Added a download local wp cli command to download google fonts to the theme fonts folder. Props @robruiz
 - Updated rig-init command now provides better DX to devs during new installs. Props @robruiz
 - Added a new command to convert WP Rig into a child theme build system. Props @robruiz
 - Added a new theme-level block authoring/development and management system. Props @robruiz
 - Added a new command to scaffold new PHP components. Props @robruiz
 - Removed Gulp from WP Rig. Processes are now replaced with custom script while
dramatically increasing build and bundle performance. Props @robruiz
 - Users can now use Bun or Node. Props @robruiz
 - Now using Github CI/CD pipeline for automated testing. Props @robruiz

## 3.0.3
 - Reorganization of the CSS source files. Props @robruiz
 - Fixed js minification and removes obsolete dev dependency. Props @robruiz
 - Fixed corruption for files during the bundle for filesToCopy files. Props @skywardpro
 - Minor accessibility improvements to navigation. Props @SinghCod3r
 - Improvements to eslint system, TS compiling, styles and js minification. Props @erdmann040
 - Improvements to asset bundling. Props @robruiz
 - Theme.json file now created when block-based conversion is run. Props @SinghCod3r
 - New relative image path generation during css transpile. Props @robruiz
 - Added new cli command to auto-generate menu items. Props @robruiz
 - Fixed initial tests. All tests should pass now on fresh install. Props @robruiz
 - Removed outdated/deprecated/unnecessary deps. Props @robruiz
 - Fixed a bug that caused Gulp to crash frequently. Props @erdmann040
 - Fixed CSS source maps; now consistent & configurable. Props @erdmann040
 - Removed package-lock.json from repo. Devs should manually add this. Props @robruiz

## 3.0.2

- Accessibility improvements - Empty main menu items (no-link parent menu items) now change to buttons instead of ) Props @robruiz
- PHPUnit upgrade and improvements Props @robruiz
- Added PHP CS Fixer and Rector to code quality checking Props @robruiz
- Added new composer fix script that runs a sequence of checks using all code quality checks Props @robruiz
- Added dark mode support to base starter theme Props @robruiz

## 3.0.1

- Updated some packages. Props @robruiz
- Improved some command line messaging. Props @robruiz
- Replaced gulp-imagemin and gulp-webp for compatibility reasons. Props @robruiz
- Now supporting Node v22+. Props @robruiz

## 3.0.0

- Complete Rewrite of Javascript and CSS build systems. Introduced esbuild and Lightning CSS. Props @robruiz
- Full Typescript support added. Props @robruiz
- Added base CSS framework for layout purposes. Props @robruiz
- Min version of PHP bumped to PHP 8. Type checking added. Props @robruiz
- React-based options/settings page framework for theme devs added. @robruiz
- Removed support for AMP Plugin. @robruiz
- Now compatible with up to PHP 8.3. Props @robruiz

## 2.3.2

- Updated WPCS to V3.1. Props @robruiz
- All WPCS errors addressed. Clean install now yields zero errors. Props @robruiz
- Updated many packages and dependencies for security and compatibility reasons. Props @robruiz
- Now compatible with up to PHP 8.1. 8.2+ remains untested but might work. Props @robruiz

## 2.3.1

- Updated WPCS to V3. Props @robruiz
- Improvements to mobile navigation, primarily collapsible sub-menus, including consideration for Gutenberg navigation
  block. Props @robruiz
- Improvements to header layout. Props @robruiz

## 2.3

- Updated all dependencies. Props @robruiz
- Added onload attribute to preload styles. Props @robruiz

## 2.2.2

- Updated navigation CSS to prevent blocking of content when mobile menu is toggled off and to have smooth transition
  from toggle-on toggled-off states. Props @Spleeding1

## 2.2.1

- Extended config file to add the ability to modify author name, author url, theme description and version for
  production. Props @dthenley
- Bumps [ajv](https://github.com/ajv-validator/ajv) from 6.10.2 to 6.12.3.
- Bumps [handlebars](https://github.com/handlebars-lang/handlebars.js) from 4.7.6 to 4.7.7.
- Change Sidebar screen reader text. see [#761](https://github.com/wprig/wprig/issues/761)
- Update blocks css to use grid css
- Added 'deps' to css files array Props @Spleeding1
- Removed call for custom.min.js from the Scripts/Component.php file. Was throwing an error before.

## 2.2.0

- Enhanced Mobile Navigation System and new default mobile nav. Props @robruiz
- Add new Javascript component for managing JS enqueues. Props @Spleeding1

## 2.1.0

- Add EZ_Customizer Component for easier customizer settings.
  See [WPRig.io](https://wprig.io/documentation/creating-custom-settings-for-your-theme-in-customize/) for details on
  how this works. Props @robruiz
- Add Read More link to Recent Posts block. See [#714](https://github.com/wprig/wprig/issues/714). Props @dthenley
- Add padding to full width block content. See [#708](https://github.com/wprig/wprig/issues/708). Props @dthenley

## 2.0.2

- Removed native lazy loading. WordPress 5.5 now handles that for us.
  See [#657](https://github.com/wprig/wprig/pull/657). Props @robruiz.
- Use long array syntax to be ready with upcoming changes in PHP Coding Standards.
  See [#557](https://github.com/wprig/wprig/pull/557). Props @benoitchantre.
- Fix indentation for nested lists, reduce specificity. See [#490](https://github.com/wprig/wprig/pull/490). Props
  @benoitchantre.
- Reduce hardcoded colors. See [#488](https://github.com/wprig/wprig/pull/488). Props @benoitchantre.
- Prevent gallery block from breaking unexpectedly if the number of images is a multiple of the number of columns.
  See [#571](https://github.com/wprig/wprig/pull/571). Props @felixarntz.
- Add support for vendor asset directories. See [#587](https://github.com/wprig/wprig/pull/587). Props @ataylorme,
  @benoitchantre.
- Ensure that left- or right-aligned child elements of the post content do not overflow the maximum content width.
  See [#568](https://github.com/wprig/wprig/pull/568). Props @felixarntz.
- Fix sub menus may be displayed under other elements. See [#523](https://github.com/wprig/wprig/pull/523). Props
  @benoitchantre.
- Fix invalid argument passed to `wp_nav_menu()`. See [#569](https://github.com/wprig/wprig/pull/569). Props
  @felixarntz.

## 2.0.1

- Fix inconsistent license references in various areas. See [#575](https://github.com/wprig/wprig/pull/575). Props
  @felixarntz.
- Add automated tests for the gulp task that builds the production theme.
  See [#579](https://github.com/wprig/wprig/pull/579). Props @ataylorme.
- Fix Travis-CI not executing nightly build jobs. See [#540](https://github.com/wprig/wprig/pull/540). Props
  @felixarntz.

## 2.0.0

- Full refactor of dev file structure. See [#133](https://github.com/wprig/wprig/pull/133). Props @ataylorme.
- Full refactor of Gulp process. See [#47](https://github.com/wprig/wprig/pull/47). Props @ataylorme.
- Full refactor of PHP codebase, leveraging PHP7 features. See [#185](https://github.com/wprig/wprig/pull/185). Props
  @felixarntz.
- Tweak template parts for more granular adjustments and overriding in child themes.
  See [#244](https://github.com/wprig/wprig/pull/244). Props @felixarntz.
- Add support for SSL certificates. See [#92](https://github.com/wprig/wprig/pull/92). Props @ataylorme.
- Fix theme slug replacement process and use `wp-rig` instead of `wprig` throughout the codebase.
  See [#93](https://github.com/wprig/wprig/pull/93). Props @felixarntz.
- Watch for theme config changes and rebuild more efficiently. See [#123](https://github.com/wprig/wprig/pull/123).
  Props @ataylorme.
- Respect PHP 7.0 and WordPress 4.5 version requirements, use `functions.php` as plain 5.2-compatible entry file.
  See [#59](https://github.com/wprig/wprig/pull/59). Props @ataylorme, @felixarntz.
- Add unit and integration tests infrastructure. See [#114](https://github.com/wprig/wprig/pull/114). Props @felixarntz.
- Add theme support for responsive embeds. See [#219](https://github.com/wprig/wprig/pull/219). Props @benoitchantre.
- Add the privacy policy link. See [#213](https://github.com/wprig/wprig/pull/213). Props @benoitchantre.
- Use `filemtime()` only in development for asset versions. See [#164](https://github.com/wprig/wprig/pull/164). Props
  @benoitchantre.
- Retrieve the theme version dynamically for asset versions in production.
  See [#176](https://github.com/wprig/wprig/pull/176), [#190](https://github.com/wprig/wprig/pull/190), [#200](https://github.com/wprig/wprig/pull/200).
  Props @benoitchantre.
- Allow disabling PHPCS in development workflow. See [#170](https://github.com/wprig/wprig/pull/170). Props @ataylorme.
- Add `500.php` and `offline.php` templates for PWA support. See [#212](https://github.com/wprig/wprig/pull/212). Props
  @felixarntz.
- Print the static `skip-link-focus-fix` script for IE11 inline instead of requiring an extra request.
  See [#139](https://github.com/wprig/wprig/pull/139). Props @westonruter.
- Add gif extension to processed image paths. See [#117](https://github.com/wprig/wprig/pull/117). Props @ataylorme.
- Add `stylelint`. See [#56](https://github.com/wprig/wprig/pull/56). Props @ataylorme.
- Update PHPCompatibility to version 9 and remove deprecated coding standards annotations.
  See [#249](https://github.com/wprig/wprig/pull/249). Props @felixarntz.
- Fix numerous CSS bugs and Gutenberg compatibility issues.
  See [#127](https://github.com/wprig/wprig/pull/127), [#173](https://github.com/wprig/wprig/pull/173), [#179](https://github.com/wprig/wprig/pull/179), [#188](https://github.com/wprig/wprig/pull/188), [#193](https://github.com/wprig/wprig/pull/193), [#196](https://github.com/wprig/wprig/pull/196), [#197](https://github.com/wprig/wprig/pull/197), [#202](https://github.com/wprig/wprig/pull/202), [#206](https://github.com/wprig/wprig/pull/206), [#299](https://github.com/wprig/wprig/pull/299).
  Props @benoitchantre, @mor10, @jdelia.
- Add abstracted theme config file. See [#233](https://github.com/wprig/wprig/pull/233). Props @Shelob9.
- Add theme screenshot file. See [#263](https://github.com/wprig/wprig/pull/263). Props @bamadesigner.
- Ensure `content.css` stylesheet always loads when needed. See [#141](https://github.com/wprig/wprig/pull/141). Props
  @bamadesigner.
- Replace `require-uncached` with `import-fresh`. [`require-uncached`](https://www.npmjs.com/package/require-uncached)
  has been deprecated in favor of [`import-fresh`](https://www.npmjs.com/package/import-fresh).
  See [#296](https://github.com/wprig/wprig/pull/296). Props @ataylorme.
- Upgrade WordPress coding standards to 2.0. See [#288](https://github.com/wprig/wprig/pull/295). Props @ataylorme,
  @benoitchantre.
- Use pure CSS files for CSS custom properties and media queries
  `/assets/css/src/_custom-properties.css` for custom properties.
  `/assets/css/src/_custom-media.css` for custom media queries.
  See [#281](https://github.com/wprig/wprig/pull/281). Props @mor10.
- Use `.browserslistrc` for browser support definitions. See [#227](https://github.com/wprig/wprig/pull/227). Props
  @ataylorme.
- Allow adjusting the mechanism for how stylesheets are loaded, for better compatibility with contexts like AMP or
  Customizer. See [#319](https://github.com/wprig/wprig/pull/319). Props @felixarntz.
- Add a `run-phpcbf` to Composer scripts. See [#360](https://github.com/wprig/wprig/pull/360). Props @ataylorme.
- Replaces `install` with `rig-init` in the `scripts` section of `package.json` in order to decouple `npm install`
  and `composer install`. Added a new `npm run rig-init` command to run both `npm install` and `composer install` with
  one command. `npm install` now only installs NPM packages. See [#357](https://github.com/wprig/wprig/pull/357). Props
  @ataylorme.
- Remove Sass support to fully rely on PostCSS. See [#425](https://github.com/wprig/wprig/pull/425). Props @ataylorme.
- Add theme support for latest `service_worker` integrations. See [#506](https://github.com/wprig/wprig/pull/506). Props
  @felixarntz.

## 1.0.5

- Do not initialize menus until DOM is loaded. See [#140](https://github.com/wprig/wprig/pull/140). Props @bamadesigner.
- Fix PHPCodeSniffer issues and violations. Props @mor10, @felixarntz.
- Fix incorrect grammar in comment. See [#151](https://github.com/wprig/wprig/pull/151). Props @ecotechie.

## 1.0.4

- Update CSS (front and editor styles) to meet current Gutenberg recommendations as of October 1, 2018. Props mor10.
- Enable default block styles by default in functions.php. Props mor10.
- Add readme.txt file as per [Theme Handbook](https://developer.wordpress.org/themes/release/writing-documentation/).
  Props mor10.

## 1.0.3

- Add Gutenberg editor-font-sizes. Props @atanas-angelov-dev
- Improve conditional logic in wprig_add_body_style(). Props @iliman
- Update WordPress Coding Standards to 1.0.0. Props @mor10

## 1.0.2

- Updated theme support for Gutenberg color palette with a single array attribute. Props @webmandesign
- `./verbose/` folder no longer holds PHP files. Resolves duplicate functionality as described
  in [#51](https://github.com/wprig/wprig/issues/51).
- Update Composer dependencies to latest versions (and to remove update nag).
- Use slug for naming language file and ZIP bundle. Props @felixarntz.
- Fixed bug with is_amp_endpoint() being called too soon. Props @iliman.

## 1.0.1

- PHP process updated to run conditionally on theme name and theme slug rename and on first run. Props @hellofromtonya.
- Introduce guard clause to simplify wprig_is_amp() condition around wprig_scripts(). Props @Tabrisrp.
- Remove extraneous variable \$post_count from index.php. Props @Soean.

## Initial release

- cssnext replaced with postcss-preset-env. No change in functionality. Props @mor10
- Separate theme name and theme slug in `themeConfig.js`. Props @felixarntz.
