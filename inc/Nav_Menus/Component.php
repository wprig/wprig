<?php
/**
 * WP_Rig\WP_Rig\Nav_Menus\Component class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Nav_Menus;

use WP_Rig\WP_Rig\Component_Interface;
use WP_Rig\WP_Rig\Templating_Component_Interface;
use WP_Post;
use function add_action;
use function add_filter;
use function register_nav_menus;
use function esc_html__;
use function has_nav_menu;
use function wp_nav_menu;

/**
 * Class for managing navigation menus.
 *
 * Exposes template tags:
 * * `wp_rig()->is_primary_nav_menu_active()`
 * * `wp_rig()->display_primary_nav_menu( array $args = array() )`
 */
class Component implements Component_Interface, Templating_Component_Interface {

	const PRIMARY_NAV_MENU_SLUG = 'primary';

	/**
	 * All theme settings - from JSON file.
	 *
	 * @var $theme_settings array
	 */
	public $theme_settings;

	/**
	 * Gets the unique identifier for the theme component.
	 *
	 * @return string Component slug.
	 */
	public function get_slug() : string {
		return 'nav_menus';
	}

	/**
	 * Adds the action and filter hooks to integrate with WordPress.
	 */
	public function initialize() {
		$this->get_theme_settings_config();
		$this->hooks();
	}

	/**
	 * Setup all hooks for the class.
	 */
	public function hooks() {
		add_action( 'after_setup_theme', array( $this, 'action_register_nav_menus' ) );
		add_filter( 'walker_nav_menu_start_el', array( $this, 'filter_primary_nav_menu_dropdown_symbol' ), 10, 4 );
		add_filter( 'wp_rig_menu_toggle_button', array( $this, 'customize_mobile_menu_toggle' ) );
		add_filter( 'wp_rig_site_navigation_classes', array( $this, 'customize_mobile_menu_nav_classes' ) );
	}

	/**
	 * Gets template tags to expose as methods on the Template_Tags class instance, accessible through `wp_rig()`.
	 *
	 * @return array Associative array of $method_name => $callback_info pairs. Each $callback_info must either be
	 *               a callable or an array with key 'callable'. This approach is used to reserve the possibility of
	 *               adding support for further arguments in the future.
	 */
	public function template_tags() : array {
		return array(
			'is_primary_nav_menu_active' => array( $this, 'is_primary_nav_menu_active' ),
			'display_primary_nav_menu'   => array( $this, 'display_primary_nav_menu' ),
		);
	}

	/**
	 * Retrieves the theme settings from the JSON file and stores them in class-level variable.
	 */
	private function get_theme_settings_config() {
		$theme_settings_json  = file_get_contents( get_theme_file_path() . '/inc/EZ_Customizer/themeCustomizeSettings.json' );
		$this->theme_settings = apply_filters( 'wp_rig_customizer_settings', json_decode( $theme_settings_json, FILE_USE_INCLUDE_PATH ) );
	}

	/**
	 * Registers the navigation menus.
	 */
	public function action_register_nav_menus() {
		register_nav_menus(
			array(
				static::PRIMARY_NAV_MENU_SLUG => esc_html__( 'Primary', 'wp-rig' ),
			)
		);
	}

	/**
	 * Adds a dropdown symbol to nav menu items with children.
	 *
	 * Adds the dropdown markup after the menu link element,
	 * before the submenu.
	 *
	 * Javascript converts the symbol to a toggle button.
	 *
	 * @TODO:
	 * - This doesn't work for the page menu because it
	 *   doesn't have a similar filter. So the dropdown symbol
	 *   is only being added for page menus if JS is enabled.
	 *   Create a ticket to add to core?
	 *
	 * @param string  $item_output The menu item's starting HTML output.
	 * @param WP_Post $item        Menu item data object.
	 * @param int     $depth       Depth of menu item. Used for padding.
	 * @param object  $args        An object of wp_nav_menu() arguments.
	 * @return string Modified nav menu HTML.
	 */
	public function filter_primary_nav_menu_dropdown_symbol( string $item_output, WP_Post $item, int $depth, $args ) : string {

		// Only for our primary menu location.
		if ( empty( $args->theme_location ) || static::PRIMARY_NAV_MENU_SLUG !== $args->theme_location ) {
			return $item_output;
		}

		// Add the dropdown for items that have children.
		if ( ! empty( $item->classes ) && in_array( 'menu-item-has-children', $item->classes ) ) {
			return $item_output . '<span class="dropdown"><i class="dropdown-symbol"></i></span>';
		}

		return $item_output;
	}

	/**
	 * Checks whether the primary navigation menu is active.
	 *
	 * @return bool True if the primary navigation menu is active, false otherwise.
	 */
	public function is_primary_nav_menu_active() : bool {
		return (bool) has_nav_menu( static::PRIMARY_NAV_MENU_SLUG );
	}

	/**
	 * Displays the primary navigation menu.
	 *
	 * @param array $args Optional. Array of arguments. See `wp_nav_menu()` documentation for a list of supported
	 *                    arguments.
	 */
	public function display_primary_nav_menu( array $args = array() ) {
		if ( ! isset( $args['container'] ) ) {
			$args['container'] = '';
		}

		$args['theme_location'] = static::PRIMARY_NAV_MENU_SLUG;

		wp_nav_menu( $args );
	}

	/**
	 * Displays the primary navigation menu.
	 *
	 * @return string Mobile Nav Toggle HTML.
	 */
	public function customize_mobile_menu_toggle() {
		return '<button class="menu-toggle icon" aria-label="' . esc_html__( 'Open menu', 'wp-rig' ) . '" aria-controls="primary-menu" aria-expanded="false">
					' . file_get_contents( get_theme_file_path() . '/assets/svg/menu-icon.svg' ) . '
					' . file_get_contents( get_theme_file_path() . '/assets/svg/close-icon.svg' ) . '
					</button>';
	}

	/**
	 * Displays the primary navigation menu.
	 *
	 * @return string Mobile Nav Toggle classes.
	 */
	public function customize_mobile_menu_nav_classes() {
		return esc_html__( 'main-navigation nav--toggle-sub nav--toggle-small icon-nav', 'wp-rig' );
	}
}
