<?php
/**
 * Blocks Component: auto-register blocks from assets/blocks
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Blocks;

use WP_Rig\WP_Rig\Component_Interface;

class Component implements Component_Interface {
	public function get_slug(): string {
		return 'blocks';
	}

	public function initialize() {
		add_action( 'init', array( $this, 'register_blocks' ) );
	}

	/**
	 * Scan assets/blocks/* and register each block.
	 */
	public function register_blocks() {
		$theme_dir = get_template_directory();
		$blocks_dir = trailingslashit( $theme_dir ) . 'assets/blocks';
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log( '[WP Rig Blocks] init registrar at ' . $blocks_dir );
		}
		if ( ! is_dir( $blocks_dir ) ) {
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				error_log( '[WP Rig Blocks] blocks dir missing' );
			}
			return;
		}
		$dirs = glob( $blocks_dir . '/*', GLOB_ONLYDIR );
		if ( empty( $dirs ) ) {
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				error_log( '[WP Rig Blocks] no block directories found' );
			}
			return;
		}
		foreach ( $dirs as $dir ) {
			$block_json = $dir . '/block.json';
			if ( ! file_exists( $block_json ) ) {
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
					error_log( '[WP Rig Blocks] skipping (no block.json): ' . $dir );
				}
				continue;
			}
			// Include render.php if present for dynamic blocks.
			$render_php = $dir . '/render.php';
			if ( file_exists( $render_php ) ) {
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
					error_log( '[WP Rig Blocks] including render.php: ' . $render_php );
				}
				require_once $render_php;
			}
			// Let WP parse block.json and register assets relative to the directory.
			try {
				register_block_type( $dir );
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
					error_log( '[WP Rig Blocks] registered: ' . $dir );
				}
			} catch ( \Throwable $e ) {
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
					error_log( '[WP Rig Blocks] failed to register ' . $dir . ' :: ' . $e->getMessage() );
				}
			}
		}
	}
}
