<?php
/**
 * WP_Rig\WP_Rig\Post_Thumbnails\Component class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Post_Thumbnails;

use WP_Rig\WP_Rig\Component_Interface;
use function add_action;
use function add_theme_support;
use function add_image_size;

/**
 * Class for managing post thumbnail support.
 *
 * @link https://developer.wordpress.org/themes/functionality/featured-images-post-thumbnails/
 */
class Component implements Component_Interface {

	/**
	 * Gets the unique identifier for the theme component.
	 *
	 * @return string Component slug.
	 */
	public function get_slug() : string {
		return 'post_thumbnails';
	}

	/**
	 * Adds the action and filter hooks to integrate with WordPress.
	 */
	public function initialize() {
		add_action( 'after_setup_theme', [ $this, 'action_add_post_thumbnail_support' ] );
		add_action( 'after_setup_theme', [ $this, 'action_add_image_sizes' ] );
	}

	/**
	 * Adds support for post thumbnails.
	 */
	public function action_add_post_thumbnail_support() {
		add_theme_support( 'post-thumbnails' );
	}

	/**
	 * Adds custom image sizes.
	 */
	public function action_add_image_sizes() {
		add_image_size( 'wp-rig-featured', 720, 480, true );
	}
}
