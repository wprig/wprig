<?php
/**
 * WP_Rig\WP_Rig\Icons\Component class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Icons;

use WP_Rig\WP_Rig\Component_Interface;
use WP_Rig\WP_Rig\Templating_Component_Interface;
use function WP_Rig\WP_Rig\wp_rig;
use function apply_filters;
use function esc_attr;

/**
 * Class for managing icons.
 *
 * Exposes template tags:
 * * `wp_rig()->wprig_icon( string $name, array $args = array() )`
 */
class Component implements Component_Interface, Templating_Component_Interface {

	/**
	 * Gets the unique identifier for the theme component.
	 *
	 * @return string Component slug.
	 */
	public function get_slug(): string {
		return 'icons';
	}

	/**
	 * Adds the action and filter hooks to integrate with WordPress.
	 */
	public function initialize() {
	}

	/**
	 * Gets template tags to expose as methods on the Template_Tags class instance, accessible through `wp_rig()`.
	 *
	 * @return array Associative array of $method_name => $callback_info pairs.
	 */
	public function template_tags(): array {
		return array(
			'wprig_icon' => array( $this, 'wprig_icon' ),
		);
	}

	/**
	 * Returns the SVG markup for a given icon.
	 *
	 * @param string $name Icon name (filename without extension).
	 * @param array  $args Optional. Arguments to modify the SVG output.
	 * @return string SVG markup, or empty string if not found.
	 */
	public function wprig_icon( string $name, array $args = array() ): string {
		$args = array_merge(
			array(
				'class'       => '',
				'aria_hidden' => true,
				'aria_label'  => '',
			),
			$args
		);

		// Ensure we have the .svg extension.
		if ( ! str_ends_with( $name, '.svg' ) ) {
			$name .= '.svg';
		}

		$icon_content = wp_rig()->get_theme_asset( $name, 'icons', true );

		if ( ! $icon_content ) {
			return '';
		}

		// Simple attribute injection.
		// If the SVG already has a class, we might want to append to it, but for simplicity we'll just prepend our classes.
		if ( ! empty( $args['class'] ) ) {
			$icon_content = preg_replace( '/<svg([^>]+)class="([^"]+)"/', '<svg$1class="' . esc_attr( $args['class'] ) . ' $2"', $icon_content );
			if ( ! str_contains( $icon_content, 'class="' ) ) {
				$icon_content = str_replace( '<svg', '<svg class="' . esc_attr( $args['class'] ) . '"', $icon_content );
			}
		}

		if ( $args['aria_hidden'] && ! str_contains( $icon_content, 'aria-hidden="' ) ) {
			$icon_content = str_replace( '<svg', '<svg aria-hidden="true"', $icon_content );
		}

		if ( ! empty( $args['aria_label'] ) && ! str_contains( $icon_content, 'aria-label="' ) ) {
			$icon_content = str_replace( '<svg', '<svg aria-label="' . esc_attr( $args['aria_label'] ) . '"', $icon_content );
		}

		/**
		 * Filters the icon SVG markup.
		 *
		 * @param string $icon_content The SVG markup.
		 * @param string $name         The icon name.
		 * @param array  $args         The arguments passed to the icon.
		 */
		return apply_filters( 'wp_rig_icon', $icon_content, $name, $args );
	}
}
