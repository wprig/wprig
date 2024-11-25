<?php
/**
 * WP_Rig\WP_Rig\Base_Support\Component class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Options;

use WP_Rig\WP_Rig\Component_Interface;
use WP_Rig\WP_Rig\Templating_Component_Interface;
use function add_action;
use function add_filter;
use function add_theme_support;
use function is_singular;
use function pings_open;
use function esc_url;
use function get_bloginfo;
use function wp_scripts;
use function wp_get_theme;
use function get_template;

/**
 * Class for adding basic theme support, most of which is mandatory to be implemented by all themes.
 *
 * Exposes template tags:
 * * `wp_rig()->get_version()`
 * * `wp_rig()->get_asset_version( string $filepath )`
 */
class Component implements Component_Interface, Templating_Component_Interface {

	/**
	 * Gets the unique identifier for the theme component.
	 *
	 * @return string Component slug.
	 */
	public function get_slug(): string {
		return 'options';
	}

	/**
	 * Adds the action and filter hooks to integrate with WordPress.
	 */
	public function initialize() {
		add_action( 'admin_enqueue_scripts', array($this, 'theme_options_enqueue_scripts') );
		add_action( 'admin_menu', array($this, 'add_admin_menu') );
	}

	/**
	 * Gets template tags to expose as methods on the Template_Tags class instance, accessible through `wp_rig()`.
	 *
	 * @return array Associative array of $method_name => $callback_info pairs. Each $callback_info must either be
	 *               a callable or an array with key 'callable'. This approach is used to reserve the possibility of
	 *               adding support for further arguments in the future.
	 */
	public function template_tags(): array {
		return array(
		);
	}

	public function theme_options_enqueue_scripts() {
		wp_enqueue_script(
			'wp-rig-theme-settings',
			get_template_directory_uri() . '/assets/js/admin/index.min.js',
			array( 'wp-element', 'wp-components', 'wp-data' ),
			filemtime( get_template_directory() . '/assets/js/admin/index.min.js' ),
			true
		);
	}

	public function add_admin_menu() {
        add_menu_page(
            __( 'WP Rig Settings', 'wp-rig' ),
            __( 'WP Rig Settings', 'wp-rig' ),
            'manage_options',
            'wp-rig-settings',
            array( $this, 'render_settings_page' )
        );
    }

	public function render_settings_page() {
		require get_template_directory() . '/inc/Options/settings-page.php';
	}

}
