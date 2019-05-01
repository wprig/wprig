<?php
/**
 * WP_Rig\WP_Rig\Icons\Component class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Icons;

use WP_Rig\WP_Rig\Component_Interface;
use function WP_Rig\WP_Rig\wp_rig;

/**
 * Class for managing SVG icons.
 */
class Component implements Component_Interface {

	const PATH = 'assets/images/icons-def.svg';

	/**
	 * Gets the unique identifier for the theme component.
	 *
	 * @return string Component slug.
	 */
	public function get_slug() : string {
		return 'icons';
	}

	/**
	 * Adds the action and filter hooks to integrate with WordPress.
	 */
	public function initialize() {

		// If there's no icon file, return early.
		if ( ! file_exists( get_template_directory() . '/' . static::PATH ) ) {
			return;
		}

		add_action( 'wp_body_open', array( $this, 'action_add_icons_to_dom' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'action_enqueue_icons_script' ) );
	}

	/**
	 * Enqueues a script that loads the icon sprite into the DOM.
	 */
	public function action_enqueue_icons_script() {

		// If the AMP plugin is active, return early.
		if ( wp_rig()->is_amp() ) {
			return;
		}

		// Enqueue the navigation script.
		wp_enqueue_script(
			'wp-rig-icons',
			get_theme_file_uri( '/assets/js/icons.min.js' ),
			array(),
			wp_rig()->get_asset_version( get_theme_file_path( '/assets/js/icons.min.js' ) ),
			false
		);
		wp_script_add_data( 'wp-rig-icons', 'async', true );
		wp_script_add_data( 'wp-rig-icons', 'precache', true );
		wp_localize_script(
			'wp-rig-icons',
			'wpRigIcons',
			array(
				'URI' => get_theme_file_uri( static::PATH ),
			)
		);
	}

	/**
	 * Adds icon sprite into the DOM.
	 */
	public function action_add_icons_to_dom() {

		// If the AMP plugin is active, icons are included into the DOM directly.
		if ( wp_rig()->is_amp() ) {
			locate_template( static::PATH, true, true );
		}
	}
}
