# Implementation Plan: WordPress 7.0 PHP-Only Block Support in WP Rig

This document outlines the architecture, design, and implementation strategy for integrating WordPress 7.0 PHP-only custom block support into WP Rig. This feature sits alongside the traditional React-based block scaffolding to offer developers a zero-JS alternative for custom blocks.

---

## 1. Executive Summary

WordPress 7.0 introduced native support for custom blocks developed completely in PHP, removing the requirement for JavaScript, React, and build tools for basic custom blocks. This is achieved using the `"autoRegister": true` block support flag, which instructs WordPress to automatically register the block on the client side and generate Inspector controls (sidebar settings) based on the block's `attributes` schema in `block.json`.

To accommodate this development standard in WP Rig, we have added:
1. **CLI Flag Support:** Extended `block:new` to support `--architecture php` and `--php`.
2. **Specialized Scaffolding Path:** A zero-build scaffolding pipeline that bypasses React and `@wordpress/create-block`.
3. **Optimized Block Bundler:** Upgraded the Esbuild-based `buildAllBlocks` task to recognize and gracefully skip PHP-only blocks, preventing generic build warnings.
4. **Developer Guardrails:** Mandated in the core Gutenberg Block Skill and Project Rules that AI agents must present this architecture option to developers rather than assuming a React-based setup.

---

## 2. Technical Architecture & System Impact

```
                          ┌──────────────────────────┐
                          │    npm run block:new     │
                          └─────────────┬────────────┘
                                        │
                         Is --architecture=php or --php?
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼ Yes                                   ▼ No (Default)
          ┌───────────────────┐                   ┌───────────────────┐
          │  PHP-Only Block   │                   │    React Block    │
          │  (No JS / Build)  │                   │  (Standard Build) │
          └─────────┬─────────┘                   └─────────┬─────────┘
                    │                                       │
        Generates:  │                           Runs:       │
        - block.json (autoRegister)                         │  - @wordpress/create-block
        - render.php                                        │  - Full JS build files
        - style/editor.css                                  ▼
                    │                             ┌───────────────────┐
                    │                             │ npm run build:js  │
                    │                             │  (Compiles block) │
                    │                             └─────────┬─────────┘
                    ▼                                       │
          ┌───────────────────┐                             │
          │   buildAllBlocks  │◄────────────────────────────┘
          │   (Bypasses PHP)  │
          └───────────────────┘
```

### 2.1 Directory Layouts

#### Traditional React-based Block (`assets/blocks/<slug>/`)
- `block.json`: Metadata, handles asset registration via build scripts.
- `src/index.js` & `src/edit.js`: React editor entry and render templates.
- `build/index.js`: Compiled build artifact.
- `style.css` & `editor.css`: CSS source styles.

#### PHP-Only Block (`assets/blocks/<slug>/`)
- `block.json`: Holds metadata, standard attribute definitions, and `"supports": { "autoRegister": true }`.
- `render.php`: Handles both the editor canvas preview and frontend markup.
- `style.css`: Frontend block styles.
- `editor.css`: Editor-only block styles.

---

## 3. Implementation Details

### 3.1 CLI Arguments (`scripts/blocks.js`)
The `block:new` Commander task has been expanded with two new options:
* `--architecture <architecture>`: Define block architecture (`react` or `php`). Defaults to `react`.
* `--php`: High-level shortcut representing `--architecture=php`.

```javascript
program
	.command( 'block:new' )
	.argument( '<name>', 'Block name <namespace>/<slug> or <slug>' )
	// ... existing options ...
	.option(
		'--architecture <architecture>',
		'Block architecture ("react" or "php")',
		'react'
	)
	.option(
		'--php',
		'Create a PHP-only block (equivalent to --architecture=php)'
	)
	.action( ( name, opts ) => {
		checkBlocksEnabled();
		if ( opts.php ) {
			opts.architecture = 'php';
		}
		cmdNew( name, opts ).catch( ( e ) => {
			console.error( e?.message || e );
			process.exitCode = 1;
		} );
	} );
```

### 3.2 Scaffolding Logic (`scripts/tasks/blockNew.js`)
If `options.architecture === 'php'`, the CLI skips `@wordpress/create-block` execution and directly invokes custom file generator helpers.

#### `block.json` Structure
Creates an API Version 3 file with automatic registration flags and demo attributes (text inputs, color pickers, and checkboxes):
```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "wp-rig/my-block",
  "title": "My Block",
  "category": "widgets",
  "icon": "block-default",
  "description": "A custom PHP-only Gutenberg block.",
  "textdomain": "wp-rig",
  "attributes": {
    "heading": {
      "type": "string",
      "default": "Hello from PHP Block!"
    },
    "color": {
      "type": "string",
      "default": "#2271b1"
    },
    "showDescription": {
      "type": "boolean",
      "default": true
    }
  },
  "supports": {
    "autoRegister": true,
    "html": false,
    "spacing": true,
    "color": {
      "text": true,
      "background": true
    }
  },
  "render": "file:./render.php",
  "style": "file:./style.css",
  "editorStyle": "file:./editor.css"
}
```

#### `render.php` Structure
Implements type safety and utilizes WP Rig's block wrapper helpers:
```php
<?php
/**
 * PHP-only block helper script.
 *
 * Block render template.
 *
 * @package wp_rig
 */

declare( strict_types=1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use function WP_Rig\WP_Rig\wp_rig;

$attributes   = is_array( $attributes ?? null ) ? $attributes : array();
$heading      = $attributes['heading'] ?? 'Hello from PHP Block!';
$border_color = $attributes['color'] ?? '#2271b1';
$show_desc    = $attributes['showDescription'] ?? true;

// Build wrapper attributes via namespaced helper.
$wrapper_attrs = wp_rig()->block_wrapper_attributes( array(), $attributes );

?>
<div <?php echo $wrapper_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> style="border: 2px solid <?php echo esc_attr( $border_color ); ?>; padding: 20px; border-radius: 4px; margin-bottom: 20px;">
	<h3 style="color: <?php echo esc_attr( $border_color ); ?>; margin-top: 0;">
		<?php echo esc_html( $heading ); ?>
	</h3>
	<?php if ( $show_desc ) : ?>
		<p style="margin-bottom: 0;">
			<?php esc_html_e( 'This block was created using PHP-only architecture in WordPress 7.0! Its settings are auto-generated from block.json.', 'wp-rig' ); ?>
		</p>
	<?php endif; ?>
</div>
```

### 3.3 Bundler Optimization (`scripts/tasks/buildAllBlocks.js`)
Before running esbuild on each block subdirectory inside `assets/blocks/`, the task inspects `block.json`. If `"supports": { "autoRegister": true }` is detected, it logs a clean, professional notice and gracefully skips compilation:

```javascript
if ( fs.existsSync( blockJsonPath ) ) {
	try {
		const blockJson = JSON.parse( fs.readFileSync( blockJsonPath, 'utf8' ) );
		if ( blockJson?.supports?.autoRegister === true ) {
			console.log( `Block "${ block }" is a PHP-only block (autoRegister enabled). Skipping build step.` );
			continue;
		}
	} catch {
		// Fallback to entry point check
	}
}
```

---

## 4. Submission Best Practices & Directory Guidelines

The official WordPress.org Theme Directory **prohibits** custom blocks bundled directly inside themes (the "plugin territory" rule). Custom blocks must be packaged as standalone companion plugins to prevent content lock-in when themes are switched.

### How to Promote a Theme-Scoped PHP Block to a Plugin
WP Rig features a powerful companion promotion utility. Develop your PHP-only blocks comfortably in theme space for rapid prototyping, and when you are ready to prepare your theme for theme-directory submission, run:

```bash
npm run block:promote-plugin -- <slug>
```

This command automatically:
1. Copies the block folder to `optional/promoted-blocks/<slug>-block/`.
2. Wraps the folder in a complete, directory-compliant WordPress plugin file.
3. Automatically wires up the PHP `register_block_type()` initialization inside the plugin header.

You can then publish the generated plugin to the WordPress.org Plugin Directory.

---

## 5. Verification & Testing

### 5.1 Verification Checklist
* [x] **Argument Parsing:** Run `npm run block:new -- test-block --php` and verify proper execution.
* [x] **File Assertions:** Ensure that **only** `block.json`, `render.php`, `style.css`, and `editor.css` are written.
* [x] **Bundler Silence:** Run `npm run build:blocks` and confirm that PHP-only blocks do not throw missing-entry-point warnings.
* [x] **Static Type Check:** Run `composer run-script phpstan` to confirm type safety of all newly generated and updated files.
* [x] **Linting Standards:** Run `composer run-script run-phpcs` to verify WordPress PHP Coding Standards compliance.
