---
description: Guide for creating and managing theme-scoped Gutenberg blocks (React and PHP-only) in WP Rig.
globs: assets/blocks/**/*, inc/Blocks/Component.php, build-js.js, build-css.js
---

# Gutenberg Blocks in WP Rig

WP Rig features a built-in system for creating and managing theme-scoped Gutenberg blocks, supporting both traditional **React-based** blocks and modern **PHP-only** blocks introduced in WordPress 7.0.

---

## ⚠️ MANDATORY RULE FOR AI AGENTS
When a user requests a custom Gutenberg block, the agent **MUST** explicitly ask the user which architecture they prefer before scaffolding, unless the user has already specified it. Do not assume one architecture over another.

Present the user with these two options:
1. **React-based (Traditional):** Best for highly interactive canvas editing, complex inner blocks, and custom canvas components. Requires a build step.
2. **PHP-only (WordPress 7.0):** Best for content display, rapid prototyping, and a lightweight, zero-JS pipeline. Uses automatic inspector controls in the block sidebar and renders on the server.

---

## Configuration & Support

Before scaffolding or modifying blocks, you **MUST** reference the `config/config.json`.

*   **Check Support:** Verify that `theme.enableBlocks` is set to `true`.
*   **Action Required:** If `enableBlocks` is `false`, you cannot scaffold blocks. Instruct the user to run `npm run theme:enable-blocks` before proceeding.

---

## Scaffolding a New Block

Use the `block:new` script to create a new block. By default, blocks are created in `assets/blocks/<slug>/`.

### Traditional React-based Block
React blocks are scaffolded using `@wordpress/create-block` underneath, creating standard JavaScript/TypeScript sources that must be compiled.

```bash
npm run block:new -- <slug> --title="Block Title"
```

**Options:**
- `-d, --dynamic`: Create a dynamic block (server-side rendered via `render.php`).
- `--ts`: Use TypeScript for the block's source files (`.tsx`).
- `--view`: Add a frontend-only script (`view.js`).
- `--category <string>`: Block category (defaults to `widgets`).
- `--icon <string>`: Dashicon or SVG icon name.

*Example: Dynamic TypeScript Block*
```bash
npm run block:new -- my-hero --title="Hero Image" --dynamic --ts
```

### PHP-Only Block (WordPress 7.0+)
PHP-only blocks bypass React, JavaScript, and Node compilation entirely. They define an attribute schema in `block.json`, automatically rendering standard Inspector controls in the Editor sidebar, and render the block in the editor and frontend using `render.php`.

```bash
npm run block:new -- <slug> --title="Block Title" --php
# OR
npm run block:new -- <slug> --title="Block Title" --architecture=php
```

---

## Filesystem Layouts

### React-based Block Layout
Each block lives under `assets/blocks/<slug>/`:
- `block.json`: Metadata and asset registration.
- `src/index.(js|ts|tsx)`: Editor entry point.
- `src/edit.(js|ts|tsx)`: Block edit component.
- `style.css`: Frontend styles.
- `editor.css`: Editor-only styles.
- `render.php`: PHP template (only for dynamic blocks).
- `build/`: Compiled assets (generated automatically via `npm run build` or `npm run dev`).

### PHP-Only Block Layout
PHP-only blocks have a lightweight structure and require no compiled assets:
- `block.json`: Metadata, attributes schema, and `"supports": { "autoRegister": true }`.
- `render.php`: PHP template handles both frontend rendering and backend editor preview.
- `style.css`: Block frontend styles.
- `editor.css`: Editor-only styles (optional).

---

## Auto-Registration

WP Rig automatically discovers and registers blocks. You do **not** need to manually add PHP code to register your block if it's in the `assets/blocks` directory.

The `inc/Blocks/Component.php` class:
1. Scans `assets/blocks/*/block.json` on the `init` hook.
2. Automatically registers each directory with core `register_block_type()`.
3. If the block has no `src/index.js`, it skips editor script registration and relies fully on WordPress 7.0 client-side block generation.

---

## Block Attributes & Wrapper

Use the provided template tags for consistent block output in `render.php`:

```php
<?php
// render.php example
$wrapper_attributes = wp_rig()->block_wrapper_attributes( [ 'my-custom-class' ], $attributes );
?>
<div <?php echo $wrapper_attributes; ?>>
    <h2><?php echo esc_html( $attributes['heading'] ?? '' ); ?></h2>
</div>
```

---

## Promoting Blocks to Plugins (For Theme Directory Submission)
Themes submitted to the official WordPress.org theme directory are **not allowed** to include custom blocks. WP Rig provides a seamless promotion script to spin theme blocks out into standalone plugins:

```bash
npm run block:promote-plugin -- <slug>
```
This utility moves the block to `optional/promoted-blocks/<slug>-block/` and wraps it in a fully compliant plugin scaffold, which can then be published to the WordPress.org Plugin Directory.

---

## Verification & Iteration

To ensure your block works as expected:

1.  **Build Execution:** Run `npm run build:blocks` (or `npm run start:blocks` for watch mode) when working on React blocks. PHP-only blocks will be automatically skipped during building with a friendly message.
2.  **Frontend Rendering**: Create a test in `tests/e2e/specs/` to verify the block renders on a page.
3.  **Visual Regression**: Use `npm run test:e2e:screenshot --SCREENSHOT_SELECTOR=".wp-block-wp-rig-my-block"` to verify the block's appearance.
4.  **PHP Validation**: Run `npm run ai:check` to ensure there are no syntax or formatting errors in the PHP files.
