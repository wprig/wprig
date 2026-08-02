# Spec: Leverage Block Manifest for Block Loading (Issue #936)

## 1. Problem Description
Currently, WP Rig registers blocks by dynamically scanning the `assets/blocks/` directory using `glob()` and checking files on every single page request (via the WordPress `init` hook).
This approach introduces significant filesystem I/O and runtime JSON parsing overhead, which scales linearly as more custom blocks are added.

### Goal
Implement a modern block-manifest system that leverages WordPress Core's official APIs (introduced in WP 6.7/6.8) to register all blocks using a pre-compiled, cached PHP manifest file. This avoids filesystem directory scans and JSON decoding at runtime, significantly boosting performance.

---

## 2. Solution Strategy

We will implement this in two main phases:
1. **Manifest Generation (Build Step):** Integrate `npx wp-scripts build-blocks-manifest` into the block build pipeline.
2. **Backwards-Compatible Registration (PHP):** Refactor `inc/Blocks/Component.php` and `optional/Blocks/Component.php` to use the manifest-based registration if available, falling back gracefully to the existing `glob()` loop for older WordPress versions (pre-6.7) or if the manifest is missing.

---

## 3. Detailed Technical Changes

### Step 1: Manifest Generation in build-all-blocks pipeline

We will modify `scripts/tasks/buildAllBlocks.js` to automatically compile the block manifest at the end of the block build process.

```javascript
import { execSync } from 'child_process';
...
export default async function buildAllBlocks( watch = false ) {
    ...
    // At the end of the build, or right after block discovery:
    try {
        console.log( 'Generating blocks manifest...' );
        execSync( 'npx wp-scripts build-blocks-manifest --input=assets/blocks --output=assets/blocks/blocks-manifest.php', { stdio: 'ignore' } );
        console.log( 'Block manifest generated successfully.' );
    } catch ( e ) {
        console.warn( 'Could not generate block manifest:', e.message );
    }
}
```

### Step 2: Update PHP Components with Multi-Layer Fallback

We will refactor `register_blocks()` in `inc/Blocks/Component.php` and `optional/Blocks/Component.php` to check for and load the manifest:

```php
	public function register_blocks(): void {
		$theme_dir  = get_stylesheet_directory();
		$theme_uri  = get_stylesheet_directory_uri();
		$blocks_dir = trailingslashit( $theme_dir ) . 'assets/blocks';
		$blocks_uri = trailingslashit( $theme_uri ) . 'assets/blocks';

		if ( ! is_dir( $blocks_dir ) ) {
			$theme_dir  = get_template_directory();
			$theme_uri  = get_template_directory_uri();
			$blocks_dir = trailingslashit( $theme_dir ) . 'assets/blocks';
			$blocks_uri = trailingslashit( $theme_uri ) . 'assets/blocks';
		}

		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			do_action( 'wp_rig_log', '[WP Rig Blocks] init registrar at ' . $blocks_dir );
		}

		if ( ! is_dir( $blocks_dir ) ) {
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				do_action( 'wp_rig_log', '[WP Rig Blocks] blocks dir missing' );
			}
			return;
		}

		$manifest_file = trailingslashit( $blocks_dir ) . 'blocks-manifest.php';

		// 1. Try modern WordPress 6.8+ batch registration
		if ( file_exists( $manifest_file ) && function_exists( 'wp_register_block_types_from_metadata_collection' ) ) {
			try {
				wp_register_block_types_from_metadata_collection( $blocks_dir, $manifest_file );
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					do_action( 'wp_rig_log', '[WP Rig Blocks] registered via wp_register_block_types_from_metadata_collection' );
				}
				return;
			} catch ( \Throwable $e ) {
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					do_action( 'wp_rig_log', '[WP Rig Blocks] wp_register_block_types_from_metadata_collection failed: ' . $e->getMessage() );
				}
			}
		}

		// 2. Try WordPress 6.7 metadata collection registration
		if ( file_exists( $manifest_file ) && function_exists( 'wp_register_block_metadata_collection' ) ) {
			try {
				wp_register_block_metadata_collection( $blocks_dir, $manifest_file );
				$manifest_data = require $manifest_file;
				if ( is_array( $manifest_data ) ) {
					foreach ( array_keys( $manifest_data ) as $block_folder ) {
						register_block_type_from_metadata( trailingslashit( $blocks_dir ) . $block_folder );
					}
					if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
						do_action( 'wp_rig_log', '[WP Rig Blocks] registered via wp_register_block_metadata_collection' );
					}
					return;
				}
			} catch ( \Throwable $e ) {
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					do_action( 'wp_rig_log', '[WP Rig Blocks] wp_register_block_metadata_collection failed: ' . $e->getMessage() );
				}
			}
		}

		// 3. Backward Compatibility Fallback (Pre-6.7 or if manifest is missing)
		$dirs = glob( $blocks_dir . '/*', GLOB_ONLYDIR );
		if ( array() === $dirs || false === $dirs ) {
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				do_action( 'wp_rig_log', '[WP Rig Blocks] no block directories found' );
			}
			return;
		}

		foreach ( $dirs as $dir ) {
			$block_json = $dir . '/block.json';
			if ( ! file_exists( $block_json ) ) {
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					do_action( 'wp_rig_log', '[WP Rig Blocks] skipping (no block.json): ' . $dir );
				}
				continue;
			}

			$block_name = basename( $dir );

			$src_dir = $dir . '/src';
			if ( file_exists( $src_dir ) ) {
				$editor_js = $src_dir . '/index.js';
				if ( file_exists( $editor_js ) ) {
					wp_register_script(
						"wprig-{$block_name}-editor",
						"{$blocks_uri}/{$block_name}/src/index.js",
						array(
							'wp-blocks',
							'wp-element',
							'wp-i18n',
							'wp-block-editor',
							'wp-components',
							'wp-server-side-render',
						),
						filemtime( $editor_js ),
						true
					);
				}
			}

			try {
				register_block_type( $dir );
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					do_action( 'wp_rig_log', '[WP Rig Blocks] registered: ' . $dir );
				}
			} catch ( \Throwable $e ) {
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					do_action( 'wp_rig_log', '[WP Rig Blocks] failed to register ' . $dir . ' :: ' . $e->getMessage() );
				}
			}
		}
	}
```

---

## 4. Verification & Testing Plan

### 1. Automated Tests
We will add a PHP unit test suite specifically for checking that the block manifest-based registration functions correctly, that fallbacks work, and that exceptions are logged or caught properly.
We can add tests in `tests/phpunit/inc/Blocks/ComponentTest.php` (if it exists, or create it) to verify that blocks are registered successfully via the manifest.

### 2. Manual Testing & Demo
1. Run `npm run build:blocks` or `npm run build`. This should generate `assets/blocks/blocks-manifest.php`.
2. Inspect the generated file and verify all active blocks (`hero`, `icon`, `test-block`) are included in the array.
3. In a WordPress environment with debug enabled (or with simulated WordPress functions), verify that block loading resolves via the manifest pathway rather than the fallback pathway.
4. Demo script/steps provided at the end of implementation.
