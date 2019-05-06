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
use function wp_parse_args;
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

	/**
	 * Associative array of menu location identifiers (like a slug) and descriptive text.
	 *
	 * @var array $nav_menus
	 */
	private $nav_menus = array();

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
		$this->set_navs_menus();

		add_action( 'after_setup_theme', array( $this, 'action_register_nav_menus' ) );
		add_filter( 'walker_nav_menu_start_el', array( $this, 'filter_primary_nav_menu_dropdown_symbol' ), 10, 4 );
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
	 * Set the navs menus slugs and their description.
	 *
	 * @return void
	 */
	public function set_navs_menus() {
		$this->nav_menus = array(
			'primary' => esc_html__( 'Primary', 'wp-rig' ),
		);
	}

	/**
	 * Get the navs menus slugs and their description.
	 *
	 * @return array Associative array of menu location identifiers (like a slug) and descriptive text.
	 */
	public function get_navs_menus() : array {
		return $this->nav_menus;
	}

	/**
	 * Get the navs menus slugs.
	 *
	 * @return array Array of menu location identifiers (like a slug).
	 */
	public function get_menus_slugs() : array {
		return array_keys( $this->nav_menus );
	}

	/**
	 * Get the primary nav menu slug.
	 *
	 * @return string Primary menu location identifier (like a slug).
	 */
	public function get_primary_menu_slug() : string {
		$menus_slugs = $this->get_menus_slugs();

		return reset( $menus_slugs );
	}

	/**
	 * Registers the navigation menus.
	 */
	public function action_register_nav_menus() {
		if ( empty( $this->nav_menus ) ) {
			return;
		}

		register_nav_menus( $this->nav_menus );
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
		if ( empty( $args->theme_location ) || $this->get_primary_menu_slug() !== $args->theme_location ) {
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
		return (bool) has_nav_menu( $this->get_primary_menu_slug() );
	}

	/**
	 * Displays the primary navigation menu.
	 *
	 * @param array $args Optional. Array of arguments. See `wp_nav_menu()` documentation for a list of supported
	 *                    arguments.
	 */
	public function display_primary_nav_menu( array $args = array() ) {
		$args = wp_parse_args(
			$args,
			array(
				'container' => 'ul',
			)
		);

		$args['theme_location'] = $this->get_primary_menu_slug();

		wp_nav_menu( $args );
	}
}
