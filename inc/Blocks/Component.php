<?php
/**
 * Blocks Component: auto-register blocks from assets/blocks
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Blocks;

use WP_Rig\WP_Rig\Component_Interface;
use WP_Rig\WP_Rig\Templating_Component_Interface;

class Component implements Component_Interface, Templating_Component_Interface {
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
			// Do not include render.php manually; WordPress will include it at render time per block.json "render".
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

	public function template_tags(): array {
		return array(
			'block_get_type' => array( $this, 'block_get_type' ),
			'block_get_title' => array( $this, 'block_get_title' ),
			'sanitize_classes' => array( $this, 'sanitize_classes' ),
			'block_wrapper_attributes' => array( $this, 'block_wrapper_attributes' ),
		);
	}

	public function block_get_type( $block ) {
		if ( $block instanceof \WP_Block ) {
			if ( isset( $block->block_type ) && $block->block_type instanceof \WP_Block_Type ) {
				return $block->block_type;
			}
			if ( ! empty( $block->name ) && is_string( $block->name ) ) {
				$registry   = \WP_Block_Type_Registry::get_instance();
				$block_type = $registry->get_registered( $block->name );
				if ( $block_type instanceof \WP_Block_Type ) {
					return $block_type;
				}
			}
		}
		return null;
	}

	public function block_get_title( $block ) {
		$block_type = $this->block_get_type( $block );
		if ( $block_type instanceof \WP_Block_Type && ! empty( $block_type->title ) && is_string( $block_type->title ) ) {
			return $block_type->title;
		}

		if ( $block instanceof \WP_Block && ! empty( $block->name ) && is_string( $block->name ) ) {
			// Fallback: "namespace/your-block" -> "Your Block".
			$pos = strpos( $block->name, '/' );
			if ( false !== $pos ) {
				$slug = substr( $block->name, $pos + 1 );
				return ucwords( str_replace( '-', ' ', (string) $slug ) );
			}
		}

		return '';
	}

	public function sanitize_classes( array $classes ) {
		$flat = array();
		foreach ( $classes as $class ) {
			if ( '' === $class || null === $class ) {
				continue;
			}
			foreach ( preg_split( '/\s+/', (string) $class ) as $part ) {
				$part = trim( (string) $part );
				if ( '' !== $part ) {
					$flat[] = sanitize_html_class( $part );
				}
			}
		}
		$flat = array_filter( array_unique( $flat ) );
		return implode( ' ', $flat );
	}

	public function block_wrapper_attributes( array $extra_classes = array(), array $attributes = array() ) {
		$classes = $this->sanitize_classes( $extra_classes );

		if ( function_exists( 'get_block_wrapper_attributes' ) ) {
			return get_block_wrapper_attributes(
				array(
					'class' => $classes,
				)
			);
		}

		// Fallback when get_block_wrapper_attributes() isn't available.
		$fallback_classes = array(
			'wp-block',
			isset( $attributes['className'] ) ? (string) $attributes['className'] : '',
			$classes,
		);

		return sprintf(
			'class="%s"',
			esc_attr(
				trim(
					implode(
						' ',
						array_filter( $fallback_classes )
					)
				)
			)
		);
	}
}
