# CLI Commands & Scripts Reference

WP Rig includes Node/Bun, Composer, and WP CLI scripts to improve the developer experience.

## NPM/Bun Scripts

Use `npm run <command>` (or `bun run <command>`):

### Development & Build

- `dev`: Watch source files and rebuild on changes with BrowserSync.
- `dev:modern`: Vite-like development experience without BrowserSync.
- `build`: One-time build of source files without watching.
- `build:css` / `build:js`: Build only CSS (Lightning CSS) or JS/TS (esbuild).
- `build:blocks`: Build all blocks in `assets/blocks/`.
- `build:phpcs`: Build and run PHPCS.
- `bundle`: Generate production-ready theme (minified assets, string replacement, translations, WebP + AVIF images).
- `bundle:wporg`: Production bundle prepped for WordPress.org submission.

### Initialization & Setup

- `rig-init`: Install npm + Composer deps and run the interactive theme initializer (paradigm choice, BrowserSync, etc.).
- `rig-init:bun`: Same with `bun install`.
- `setup-child`: `rig-init` + `childify` in one command.
- `block-based`: Convert the theme toward a strictly block-based (FSE) setup (`node scripts/convert-to-block-theme.js`).
- `theme:enable-blocks`: Enable block compilation (`enableBlocks: true`).
- `generateCert`: Generate local SSL certificates.
- `get-dev-url`: Print the resolved dev URL.

### Quality & Linting

- `lint:js`: ESLint on `assets/js/src/**`.
- `lint:css`: Stylelint on `assets/css/src/**` — enforces the C1 budget (nesting ≤ 3, specificity `(0,4,1)`, no `!important`, `var()`-required, no descending-specificity).
- `fix:css`: Auto-fix stylelint violations.
- `lint:blocks`: Validate Gutenberg block markup in `templates/` + `parts/` against the active core block schemas (`node scripts/tasks/validateBlocks.js`).
- `lint:patterns`: Validate block patterns (metadata + markup) in `patterns/` and component `patterns/` dirs.
- `ai:check`: Full pre-flight gate — `test:e2e` + `test:e2e:screenshot` + `lint:blocks` + `lint:patterns` + `lint:css` + `lint:js`.

### WordPress Blocks

- `block:new <namespace>/<slug>`: Scaffold a static block via `@wordpress/create-block` (WP Rig templates, `apiVersion: 3`). Options: `--title`, `-d/--dynamic`, `--ts`, `--php` / `--architecture php` (PHP-only block with `supports.autoRegister`), `--category`, `--icon`, `--description`, `--keywords`, `--no-style`, `--no-editor-style`, `--view`.
- `block:new:dynamic`: Shortcut for a dynamic (`render.php`) block.
- `block:list` / `block:remove` / `block:promote-plugin`: Manage theme blocks.
- `block:schema`: Fetch the active WP block schemas from the local site (WP-CLI bridge) into `artifacts/blocks-schema.json`.
- `block:compile <ir.json>`: Compile a block IR payload to perfect Gutenberg markup via the WP-CLI bridge.
- `block:compile`/`theme:settings`: Bridge actions for schema/settings/compile (`node scripts/tasks/wpCliBridge.js`).

### Component Registry

- `rig:list`: List all installed theme components (bundled vs registry) with versions.
- `rig:search [keyword]`: Discover performance-optimized components from the WP Rig community.
- `rig:add [slug]`: Download + install a component into `inc/`; registers it in `inc/components-manifest.json` and integrates assets.
- `rig:update [slug]`: Pull framework-level component updates while preserving local customizations.
- `rig:remove [slug]`: Remove a component and its manifest registration.
- `rig:test-component [slug]`: Pre-flight check (manifest, files, security) before sharing.
- `rig:check [slug]`: Lightweight component structure/manifest audit.
- `rig:prepare [slug]`: Package a component for submission via GitHub PR.
- `rig:pattern`: Scaffold a new block pattern with i18n-aware headers + config-seeded categories.
- `rig:localize`: Generate the `.pot` translation file in `languages/`.
- `rig:compare`: Compare installed components against registry versions.
- `rig:tokens`: Regenerate `theme.json` + CSS variables + `@custom-media` from `config/tokens.json`.
- `create-rig-component "Name" [--templating] [--tests]`: Scaffold a new theme component.

### Testing

- `test:e2e`: Full Playwright suite (chromium + firefox + webkit; default 4 workers).
- `test:e2e:spatial`: Spatial & visual regression agents — deterministic `boundingBox()` geometry checks.
- `test:e2e:spatial:watch`: Same, headed watch mode.
- `test:e2e:nav:watch` (+ `:mobile` / `:desktop`): Visual navigation watch suites.
- `test:e2e:mobile-nav` (+ `:watch`): 5-level deep mobile navigation tests.
- `test:e2e:screenshot`: Capture/update regression screenshots.
- `test:e2e:ui` / `test:e2e:debug` / `test:e2e:codegen`: Interactive Playwright tooling.
- `test:scripts`: Jest unit tests for build tooling.
- `test:prod-build`: Full production-bundle verification (setup → bundle → jest → teardown).
- `inspect`: Semantic layout + sibling-proximity inspector (`--url`, `--selector`, `--viewport`, `--screenshot`).

### Theme Review Audits

- `audit:metadata`, `audit:banned-files`, `audit:plugin-territory`, `audit:security-patterns`, `audit:remote-resources`, `audit:theme-check`, `audit:i18n`, `audit:theme-json`, `audit:html-templates`, `audit:theme-review`: WordPress.org-style theme review checks.

## Composer Scripts

Use `composer <command>`:

- **Testing**: `test:unit` (PHPUnit unit) · `test:integration` (PHPUnit integration) · `test:all` (unit + integration + PHPStan).
- **Quality Assurance**: `phpstan` (+ `phpstan:baseline`) · `phpcs-dev` / `run-phpcs` · `phpcbf-dev` / `run-phpcbf` · `fix` (Rector + PHP-CS-Fixer + PHPCBF).
- **Environment**: `setup-wp-tests` · `install-codestandards`.

## WP CLI Commands

Custom WP Rig commands (requires [WP-CLI](https://wp-cli.org/)):

- `wp rig test-setup`: Sets up the Theme Unit Test environment.
- `wp rig import-test-data`: Imports the official WordPress Theme Unit Test Data.

The Gutenberg WP-CLI bridge (`node scripts/tasks/wpCliBridge.js`) auto-detects Local/Studio environments and routes `wp eval-file` for `schema`, `settings`, and `compile` actions.
