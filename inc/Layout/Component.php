<?php
/**
 * WP_Rig\WP_Rig\Layout\Component class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Layout;

use WP_Rig\WP_Rig\Component_Interface;
use WP_Rig\WP_Rig\Asset_Provider;
use function add_action;
use function register_block_style;
use function apply_filters;
use function __;

/**
 * Class for managing modern layout patterns.
 *
 * This component provides support for common modern layout patterns like
 * floating navigation shells and bento grid structures.
 */
class Component implements Component_Interface, Asset_Provider {

	/**
	 * Gets the unique identifier for the theme component.
	 *
	 * @return string Component slug.
	 */
	public function get_slug(): string {
		return 'layout';
	}

	/**
	 * Adds the action and filter hooks to integrate with WordPress.
	 */
	public function initialize() {
		add_action( 'init', array( $this, 'action_register_layout_styles' ) );
	}

	/**
	 * Gets the asset manifest for the theme component.
	 *
	 * @return array Asset manifest.
	 */
	public function get_asset_manifest(): array {
		return array(
			'styles' => array(
				'wp-rig-layout' => array(
					'file'   => 'layout.css',
					'global' => true,
				),
			),
		);
	}

	/**
	 * Registers layout-related block styles.
	 */
	public function action_register_layout_styles() {
		$layout_styles = $this->get_layout_styles();

		foreach ( $layout_styles as $block_name => $styles ) {
			foreach ( $styles as $style_properties ) {
				register_block_style( $block_name, $style_properties );
			}
		}
	}

	/**
	 * Returns the layout styles to be registered.
	 *
	 * @return array Associative array of $block_name => $styles pairs.
	 */
	protected function get_layout_styles(): array {
		$layout_styles = array(
			'core/group'   => array(
				array(
					'name'  => 'bento-grid',
					'label' => __( 'Bento Grid', 'wp-rig' ),
				),
				array(
					'name'  => 'floating-nav-shell',
					'label' => __( 'Floating Nav Shell', 'wp-rig' ),
				),
			),
			'core/columns' => array(
				array(
					'name'  => 'optimus-layout',
					'label' => __( 'Optimus Layout', 'wp-rig' ),
				),
			),
		);

		/**
		 * Filters the layout styles to be registered.
		 *
		 * @param array $layout_styles Associative array of $block_name => $styles pairs.
		 */
		return apply_filters( 'wp_rig_layout_styles', $layout_styles );
	}
}
