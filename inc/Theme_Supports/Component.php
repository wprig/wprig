<?php
/**
 * WP_Rig\WP_Rig\Theme_Supports\Component class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Theme_Supports;

use WP_Rig\WP_Rig\Component_Interface;
use function add_action;
/**
 * Class for managing Customizer integration.
 */
class Component implements Component_Interface {


	public $features = array( 'editor-styles', 'wp-block-styles' );

	/**
	 * Gets the unique identifier for the theme component.
	 *
	 * @return string Component slug.
	 */
	public function get_slug() : string {
		return 'block_editor';
	}

	/**
	 * Adds the action and filter hooks to integrate with WordPress.
	 */
	public function initialize() {
		$this->hooks();
	}

	/**
	 * Setup all hooks for the class.
	 */
	private function hooks() {
		add_action( 'after_setup_theme', array( $this, 'wp_rig_add_theme_supports' ) );
	}

	public function wp_rig_add_theme_supports() {

		foreach ( $this->features as $feature ) {
			add_theme_support( $feature );
		}

	}

}
