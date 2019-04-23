<?php
/**
 * WP_Rig\WP_Rig\Custom_Background\Component class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Custom_Background;

use WP_Rig\WP_Rig\Component_Interface;
use function add_action;
use function add_theme_support;
use function apply_filters;

/**
 * Class for adding custom background support.
 */
class Component implements Component_Interface {

	/**
	 * Gets the unique identifier for the theme component.
	 *
	 * @return string Component slug.
	 */
	public function get_slug() : string {
		return 'custom_background';
	}

	/**
	 * Adds the action and filter hooks to integrate with WordPress.
	 */
	public function initialize() {
		add_action( 'after_setup_theme', [ $this, 'action_add_custom_background_support' ] );
	}

	/**
	 * Adds support for the Custom Background feature.
	 */
	public function action_add_custom_background_support() {
		add_theme_support(
			'custom-background',
			apply_filters(
				'wp_rig_custom_background_args',
				[
					'default-color' => 'ffffff',
					'default-image' => '',
				]
			)
		);
	}
}
