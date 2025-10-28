<?php
/**
 * Defines the Component class, which implements functionality for registering and managing blocks
 * within the WordPress Rig framework. The class scans a specific directory for block definitions,
 * registers the blocks with WordPress, and provides utility methods related to block processing.
 *
 * Implements Component_Interface and Templating_Component_Interface.
 *
 * @package WP_Rig\WP_Rig
 */

namespace WP_Rig\WP_Rig\Blocks;

use WP_Rig\WP_Rig\Component_Interface;
use WP_Rig\WP_Rig\Templating_Component_Interface;


/**
 * Defines the Component class, responsible for managing and registering blocks within the WordPress Rig framework.
 *
 * This class implements Component_Interface and Templating_Component_Interface. It provides functionality
 * for scanning the block directories, registering blocks with WordPress, and defining utility methods
 * related to block attributes and rendering.
 */
class Component implements Component_Interface, Templating_Component_Interface {

	/**
	 * Retrieve the slug identifying the component or module.
	 *
	 * @return string The slug, typically used as an identifier.
	 */
	public function get_slug(): string {
		return 'blocks';
	}

	/**
	 * Initializes the block registration process by hooking into the WordPress initialization action.
	 *
	 * @return void
	 */
	public function initialize(): void {
		add_action( 'init', array( $this, 'register_blocks' ) );
	}


	/**
	 * Registers custom blocks from a specified directory.
	 *
	 * This function scans the specified blocks directory, identifies block directories,
	 * and registers each block by loading its `block.json` configuration and associated scripts.
	 * Debug messages are logged if the blocks directory is missing, empty, or if individual
	 * block directories fail validation or registration.
	 *
	 * @return void No return value.
	 */
	public function register_blocks(): void {
		$theme_dir  = get_template_directory();
		$theme_uri  = get_template_directory_uri();
		$blocks_dir = trailingslashit( $theme_dir ) . 'assets/blocks';
		$blocks_uri = trailingslashit( $theme_uri ) . 'assets/blocks';

		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			// Log block registrar initialization.
			do_action( 'wp_rig_log', '[WP Rig Blocks] init registrar at ' . $blocks_dir );
		}
		if ( ! is_dir( $blocks_dir ) ) {
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				// Log missing blocks directory.
				do_action( 'wp_rig_log', '[WP Rig Blocks] blocks dir missing' );
			}
			return;
		}
		$dirs = glob( $blocks_dir . '/*', GLOB_ONLYDIR );
		if ( empty( $dirs ) ) {
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				// Log when no block directories are found.
				do_action( 'wp_rig_log', '[WP Rig Blocks] no block directories found' );
			}
			return;
		}

		foreach ( $dirs as $dir ) {
			$block_json = $dir . '/block.json';
			if ( ! file_exists( $block_json ) ) {
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					// Log skipped block due to missing block.json.
					do_action( 'wp_rig_log', '[WP Rig Blocks] skipping (no block.json): ' . $dir );
				}
				continue;
			}

			// Get the block name from the directory name.
			$block_name = basename( $dir );

			// Register block scripts directly.
			$src_dir = $dir . '/src';
			if ( file_exists( $src_dir ) ) {
				$editor_js = $src_dir . '/index.js';
				if ( file_exists( $editor_js ) ) {
					// Register unminified script for development.
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
				// Register the block using WordPress core function.
				register_block_type( $dir );
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					// Log successful block registration.
					do_action( 'wp_rig_log', '[WP Rig Blocks] registered: ' . $dir );
				}
			} catch ( \Throwable $e ) {
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					// Log block registration failure.
					do_action( 'wp_rig_log', '[WP Rig Blocks] failed to register ' . $dir . ' :: ' . $e->getMessage() );
				}
			}
		}
	}

	/**
	 * Retrieves an array of template tags and their corresponding callbacks.
	 *
	 * This method returns an associative array where keys are template tag names,
	 * and values are the corresponding callbacks mapped to the current class methods.
	 * These tags provide specific functionalities for use within templates.
	 *
	 * @return array An associative array of template tag names and their callbacks.
	 */
	public function template_tags(): array {
		return array(
			'block_get_type'           => array( $this, 'block_get_type' ),
			'block_get_title'          => array( $this, 'block_get_title' ),
			'sanitize_classes'         => array( $this, 'sanitize_classes' ),
			'block_wrapper_attributes' => array( $this, 'block_wrapper_attributes' ),
		);
	}

	/**
	 * Retrieves the block type for a given block.
	 *
	 * This function determines the type of a given block by checking its block type property,
	 * or by looking up the block type registry using the block's name. If the block is invalid
	 * or its type cannot be determined, it returns null.
	 *
	 * @param mixed $block The block instance, typically a \WP_Block object.
	 *                     It can also be another type, but must contain block
	 *                     type or a valid name property to resolve the type.
	 *
	 * @return \WP_Block_Type|null The block type object if found, or null if the block type cannot
	 *                             be determined or is invalid.
	 */
	public function block_get_type( mixed $block ): ?\WP_Block_Type {
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

	/**
	 * Retrieves the title of a given block.
	 *
	 * This method attempts to get the block title by first checking the block type.
	 * If the block type has a defined title, it returns the decoded title.
	 * If no title is found, it falls back to generating a title based on the block's name.
	 *
	 * @param mixed $block The block object or data to evaluate. Typically, it can be an instance
	 *                      of \WP_Block or an associated block type.
	 *
	 * @return string The title of the block. If the title cannot be determined, an empty string is returned.
	 */
	public function block_get_title( mixed $block ): string {
		$block_type = $this->block_get_type( $block );
		if ( $block_type instanceof \WP_Block_Type && ! empty( $block_type->title ) && is_string( $block_type->title ) ) {
			// Ensure the title is properly decoded.
			return html_entity_decode( $block_type->title, ENT_QUOTES, 'UTF-8' );
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

	/**
	 * Sanitizes an array of CSS class names.
	 *
	 * This method processes a list of class names, removes empty or null values,
	 * splits strings with multiple class names, trims and sanitizes each individual class name,
	 * and ensures uniqueness in the final output.
	 *
	 * @param array $classes An array of class names to sanitize. Each element can be a single class name
	 *                       or a space-separated string of multiple class names.
	 *
	 * @return string A sanitized, space-separated string of unique class names.
	 */
	public function sanitize_classes( array $classes ): string {
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

	/**
	 * Generates block wrapper attributes including classes.
	 *
	 * This method returns the necessary attributes for a block wrapper element.
	 * It uses `get_block_wrapper_attributes()` if available to provide standardized attributes.
	 * If the function is not available, a fallback is used to dynamically generate
	 * class attributes based on provided extra classes and block attributes.
	 *
	 * @param array $extra_classes Optional. Additional classes to include in the block wrapper. Default is an empty array.
	 * @param array $attributes Optional. Attributes associated with the block, such as className. Default is an empty array.
	 *
	 * @return string The generated block wrapper attributes including the necessary classes.
	 */
	public function block_wrapper_attributes( array $extra_classes = array(), array $attributes = array() ): string {
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
