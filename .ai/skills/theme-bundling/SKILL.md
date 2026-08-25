---
description: Guide to ensuring new root-level folders (like WooCommerce template overrides) are included in the bundled theme.
globs: config/config.json, config/config.default.json, woocommerce/**/*, tribe-events/**/*, buddypress/**/*, edd/**/*, **/template-overrides/**/*
---

# Theme Bundling & Root Folders

This skill ensures that any new root-level folders added to the WP Rig theme are properly included in the production bundle.

## Configuration & Export

Before modifying the theme structure or preparing a bundle, you **MUST** reference the `config/config.json`.

*   **Export Rules:** If you add a new root-level directory for assets or plugin overrides (e.g., `woocommerce/`), you **MUST** add it to `export.filesToCopy` to ensure it is included in the production bundle.

## Reasoning

WP Rig's build system uses a combination of specialized tasks (`phpTask`, `images`, `fonts`, `buildJS`, `buildCSS`) and a manual file-copying task (`prodPrep`).

- **Specialized Tasks**: These tasks automatically handle specific file types in specific locations (e.g., `.php` files anywhere in the theme, except for excluded directories like `node_modules` and `vendor`). The `images` task optimizes `assets/images/src` and emits WebP + AVIF from JPEG/PNG sources.
- **prodPrep Task**: This task manually copies files and folders specified in the `export.filesToCopy` property of the theme's configuration. It is used for files that are not handled by specialized tasks or for folders that need to be explicitly included in the bundle.

When you add a new root-level folder to the theme (especially for plugin template overrides like `woocommerce/` or `tribe-events/`), it is **mandatory** to add it to the `export.filesToCopy` array in `config/config.json`.

### Why this is necessary:

1. **Inclusion of Non-PHP Files**: While `phpTask` will automatically find and process `.php` files in your new folder, it will ignore other file types (e.g., `.css`, `.js`, `.json`, `.svg`, `.txt`). Adding the folder to `filesToCopy` ensures that *all* files within it are included in the bundle.
2. **Explicit Intent**: Adding the folder to the configuration explicitly signals that it is a required part of the theme's production bundle.
3. **Directory Structure Preservation**: The `prodPrep` task ensures that the directory structure of the specified folders is accurately preserved in the bundled theme.

## Decision Tree: Should I add this folder to `config.json`?

When a new root-level folder is added, ask the following:

1. **Is it a standard WP Rig core folder?** (e.g., `inc`, `assets`, `template-parts`, `languages`)
   - **No**: Proceed to the next question.
   - **Yes**: These are already handled by existing tasks. No action needed.

2. **Is it an excluded/development-only folder?** (e.g., `node_modules`, `vendor`, `tests`, `bin`, `scripts`, `artifacts`, `optional`, `wp-cli`, `childify_backup`)
   - **No**: Proceed to the next question.
   - **Yes**: Do not add to `config.json`. These should never be bundled.

3. **Is it a plugin template override folder?** (e.g., `woocommerce`, `tribe-events`, `buddypress`, `edd`)
   - **Yes**: **Add to `config.json`**. These must be included in the bundle for the theme to function correctly with those plugins.

4. **Does the folder contain non-PHP files that are required in production?**
   - **Yes**: **Add to `config.json`**.

## How to add a folder to `config.json`

If the folder is `woocommerce`, you should add it to the `export.filesToCopy` array in `config/config.json`.

### Example `config/config.json`:

```json
{
  "theme": {
    "enableBlocks": true
  },
  "export": {
    "filesToCopy": [
      "woocommerce/**/*"
    ]
  }
}
```

*Note: Use the glob pattern `folder-name/**/*` to ensure all files and subdirectories are included.*

## Verification

After adding a folder to `config.json`:

1. Run the bundle command: `npm run bundle`
2. Verify that the new folder and its contents exist in the production theme directory (usually located at `../{theme-slug}`).
