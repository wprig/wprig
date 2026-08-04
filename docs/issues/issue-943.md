# Issue #943: Production Bundle Stale and Inconsistently Renamed Gutenberg Block Assets

## Overview

A critical issue was identified where the production bundle (generated via `npm run bundle`) could contain outdated (stale) block compiled assets or mismatched block identifiers and CSS classes if theme-scoped Gutenberg blocks are enabled.

---

## The Problems

### 1. Stale Block Assets
* **Root Cause:** In the production bundling pipeline (`scripts/tasks/bundle.js`), the `prodPrep` task was executed *before* `buildBlocks()`.
* **Behavior:** `prodPrep` copies export files from the development directory (including `assets/blocks/`) to the production bundle directory. Since block building happened *after* this copy, the production directory received the block assets compiled during the previous manual block build, and any recent source changes were omitted from the bundle.

### 2. Mismatched & Broken Block Renaming
* **Root Cause:** The production bundler uses string replacements (`prodStringReplace`) to rename all occurrences of the default theme slug `wp-rig` to the user's custom production slug (e.g., `my-custom-theme`). This replacement was applied across `.js`, `.css`, and `.php` files, but NOT `.json` files (specifically `block.json`).
* **Behavior:** 
  * In CSS, selector classes like `.wp-block-wp-rig-myblock` were renamed to `.wp-block-my-custom-theme-myblock`.
  * In PHP and JS, registration names like `wp-rig/myblock` were renamed to `my-custom-theme/myblock`.
  * However, `block.json` files still declared block names under the original `wp-rig/myblock` namespace.
  * This created severe mismatches: WordPress expects CSS classes based on the block's `block.json` definition, leading to missing frontend styles (as the actual frontend class rendered as `wp-block-wp-rig-myblock` but the style was compiled as `wp-block-my-custom-theme-myblock`). In addition, the block failed to register/render correctly in the editor.

---

## The Fixes

### 1. Correct Bundler Task Sequence (`scripts/tasks/bundle.js`)
We reordered the bundling sequence in `scripts/tasks/bundle.js` so that `buildBlocks()` is called at the very beginning of the pipeline:
* This compiles block assets within the local `assets/blocks/` development directory *before* copying happens.
* When `prodPrep` runs, it copies the freshly built blocks into the production theme.
* **Safety Enhancement:** Added a defensive check `fs.existsSync( paths.blocks.srcDir )` to ensure `buildBlocks()` is only executed if the block source directory exists, avoiding empty warnings or failures on themes with Gutenberg blocks disabled.

### 2. Protect Block Namespace and CSS Identifiers (`scripts/lib/utils.js`)
We modified `getReplacements()` in `scripts/lib/utils.js` to construct a specialized, safe regular expression for the theme `slug` (`wp-rig`) replacement.
* **The Protected Regex:**
  `(?<!wp-block-)wp-rig(?!/)`
  * **Negative Lookbehind `(?<!wp-block-)`**: Prevents replacing `wp-rig` when it is part of a standard block CSS class (e.g., `.wp-block-wp-rig-myblock` stays unchanged).
  * **Negative Lookahead `(?!/)`**: Prevents replacing `wp-rig` when it serves as the block registration namespace (e.g., `wp-rig/myblock` stays unchanged).
* **Benefit:** Block registration names and CSS selectors remain consistently registered as `wp-rig` across the bundle, maintaining perfect parity with `block.json` files, preventing layout/editor breakage, and keeping full backward compatibility with any blocks stored in current databases.

---

## Verification & Testing

* **Unit Testing:** A targeted unit test was added to `scripts/tests/utils.test.js` using Jest. This test validates that standard references (such as text domains or functions) are correctly replaced, whereas block-related strings (like `wp-block-wp-rig-myblock` and `wp-rig/myblock`) are safely preserved.
* **Test Command:**
  ```bash
  npm run test:scripts
  ```
  All 28 script tests successfully passed.
