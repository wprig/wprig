---
description: Guide for using npm scripts in WP Rig to manage builds, development, testing, and registry tooling.
globs: package.json, scripts/**/*.js, node/**/*.js
---

# WP Rig npm scripts

This guide describes how to use the npm scripts defined in WP Rig's `package.json` for development, building, testing, and maintenance. Run any of these with `npm run <name>` (or `bun run <name>`).

## Core Development & Build

*   `npm run dev`: Primary development workflow — builds all assets and watches for changes (BrowserSync).
*   `npm run dev:modern`: Vite-like dev experience without BrowserSync.
*   `npm run build`: One-time build of all CSS, JS, and block assets.
*   `npm run build:css`: Builds CSS with `build-css.js` (Lightning CSS).
*   `npm run build:js`: Builds JS/TS with `build-js.js` (esbuild).
*   `npm run build:blocks`: Builds all blocks in `assets/blocks/`.
*   `npm run bundle`: Creates a production-ready theme (WebP + AVIF images, string replacement, translations) in the parent directory.
*   `npm run bundle:wporg`: Production bundle prepped for WordPress.org.
*   `npm run bundle:phpcs`: Bundle that also runs PHPCS.

## Initialization & Setup

*   `npm run rig-init`: Installs npm + Composer deps and runs the interactive initializer (paradigm choice, BrowserSync). Use for first setup.
*   `npm run rig-init:bun`: Same, using `bun install`.
*   `npm run setup-child`: `rig-init` + `childify`.
*   `npm run block-based`: Convert toward a strictly block-based (FSE) setup.
*   `npm run theme:enable-blocks`: Enable block compilation (`enableBlocks: true`).
*   `npm run generateCert`: Generate local SSL certificates.

## Quality & Linting

*   `npm run lint:css`: Stylelint on `assets/css/src/` — enforces the C1 budget (nesting ≤ 3, specificity `(0,4,1)`, no `!important`, `var()`-required, no descending-specificity).
*   `npm run fix:css`: Auto-fix stylelint violations.
*   `npm run lint:js`: ESLint on `assets/js/src/`.
*   `npm run lint:blocks`: Validate Gutenberg block markup in `templates/` + `parts/` against the active core block schemas.
*   `npm run lint:patterns`: Validate block patterns (metadata + markup) in `patterns/` and component `patterns/` dirs.
*   `npm run ai:check`: Full pre-flight gate — `test:e2e` + `test:e2e:screenshot` + `lint:blocks` + `lint:patterns` + `lint:css` + `lint:js`. **Run this before submitting.**

## WordPress Blocks

*   `npm run block:new <namespace>/<slug>`: Scaffold a static block (options: `--title`, `-d/--dynamic`, `--ts`, `--php`/`--architecture php`, `--category`, `--icon`, `--view`, `--no-style`, `--no-editor-style`). All scaffolds use `apiVersion: 3`.
*   `npm run block:new:dynamic`: Create a dynamic (PHP-rendered) block.
*   `npm run block:list` / `block:remove` / `block:promote-plugin`: Manage theme blocks.
*   `npm run block:schema`: Fetch active WP block schemas from the local site into `artifacts/blocks-schema.json` (WP-CLI Gutenberg bridge).
*   `npm run block:compile <ir.json>`: Compile a block IR payload to Gutenberg markup via the bridge.
*   `npm run start:blocks`: Watch and rebuild blocks on change.

## Testing

*   `npm run test:e2e`: Full Playwright suite (chromium + firefox + webkit).
*   `npm run test:e2e:spatial`: Spatial & visual regression agents — deterministic `boundingBox()` geometry checks.
*   `npm run test:e2e:spatial:watch`: Same, headed.
*   `npm run test:e2e:nav:watch` (+ `:mobile` / `:desktop`): Visual navigation watch suites.
*   `npm run test:e2e:mobile-nav` (+ `:watch`): 5-level deep mobile navigation tests.
*   `npm run test:e2e:screenshot`: Capture/update regression screenshots.
*   `npm run test:e2e:ui` / `test:e2e:debug` / `test:e2e:codegen`: Interactive Playwright tooling.
*   `npm run test:scripts`: Jest unit tests for build tooling.
*   `npm run test:prod-build`: Full production-bundle verification.
*   `npm run inspect`: Fast semantic layout and sibling-proximity inspector (`--url`, `--selector`, `--viewport`, `--screenshot`).

## Component Registry & Utility

*   `npm run rig:list` / `rig:search` / `rig:add` / `rig:update` / `rig:remove` / `rig:test-component` / `rig:check` / `rig:prepare` / `rig:compare`: Manage OCR components (registered in `inc/components-manifest.json`).
*   `npm run rig:pattern`: Scaffold a new block pattern with i18n-aware headers + config-seeded categories.
*   `npm run rig:localize`: Generate the `.pot` translation file.
*   `npm run rig:tokens`: Regenerate `theme.json` + CSS variables + `@custom-media` from `config/tokens.json`.
*   `npm run images`: Optimize images and emit WebP + AVIF (`assets/images/`).
*   `npm run create-rig-component "Name" [--templating] [--tests]`: Scaffold a new theme component in `inc/`.
*   `npm run mcp`: Starts the Model Context Protocol server for documentation access.
*   `npm run get-dev-url`: Print the resolved dev URL.

## Theme Review Audits

*   `npm run audit:metadata` / `audit:banned-files` / `audit:plugin-territory` / `audit:security-patterns` / `audit:remote-resources` / `audit:theme-check` / `audit:i18n` / `audit:theme-json` / `audit:html-templates` / `audit:theme-review`: WordPress.org-style theme review checks.

## Best Practices for Agents

1.  **Always use `npm run dev`** when making changes to CSS or JS files to ensure they are compiled and you can see the results.
2.  **Use `npm run block:new`** instead of manually creating block folders to ensure WP Rig's block structure and `apiVersion: 3` are followed.
3.  **Run `npm run ai:check` before submitting** — it now covers E2E, screenshots, block/pattern linting, and CSS/JS linting.
4.  **Use `npm run create-rig-component`** to scaffold new PHP components in the `inc/` directory.
5.  **Use `npm run rig:pattern`** to scaffold block patterns so their headers are i18n-aware and category-wired.
