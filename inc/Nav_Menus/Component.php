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
	public function get_slug(): string {
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
		add_filter( 'render_block_core/navigation', array( $this, 'add_nav_class_to_navigation_block' ), 10, 3 );
		add_filter( 'walker_nav_menu_start_el', array( $this, 'modify_menu_items_for_accessibility' ), 10, 4 );
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
			'is_primary_nav_menu_active' => array( $this, 'is_primary_nav_menu_active' ),
			'display_primary_nav_menu'   => array( $this, 'display_primary_nav_menu' ),
		);
	}

	/**
	 * Retrieves the theme settings from the JSON file and stores them in class-level variable.
	 */
	private function get_theme_settings_config() {
		$url      = get_theme_file_uri() . '/inc/EZ_Customizer/themeCustomizeSettings.json';
		$response = wp_remote_get( $url );
		if ( is_wp_error( $response ) ) {
			return null;
		} else {
			$theme_settings_json  = wp_remote_retrieve_body( $response );
			$this->theme_settings = apply_filters( 'wp_rig_customizer_settings', json_decode( $theme_settings_json, FILE_USE_INCLUDE_PATH ) );
		}
		return null;
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
	public function filter_primary_nav_menu_dropdown_symbol( string $item_output, WP_Post $item, int $depth, $args ): string {

		// Only for our primary menu location.
		if ( empty( $args->theme_location ) || static::PRIMARY_NAV_MENU_SLUG !== $args->theme_location ) {
			return $item_output;
		}

		// Add the dropdown for items that have children.
		if ( ! empty( $item->classes ) && in_array( 'menu-item-has-children', $item->classes, true ) ) {
			return $item_output . '<span class="dropdown"><i class="dropdown-symbol"></i></span>';
		}

		return $item_output;
	}

	/**
	 * Checks whether the primary navigation menu is active.
	 *
	 * @return bool True if the primary navigation menu is active, false otherwise.
	 */
	public function is_primary_nav_menu_active(): bool {
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
		$get_menu_icon  = wp_remote_get( get_theme_file_uri() . '/assets/svg/menu-icon.svg' );
		$get_close_icon = wp_remote_get( get_theme_file_uri() . '/assets/svg/close-icon.svg' );
		return '<button class="menu-toggle icon" aria-label="' . esc_html__( 'Open menu', 'wp-rig' ) . '" aria-controls="primary-menu" aria-expanded="false">
					' . wp_remote_retrieve_body( $get_menu_icon ) . '
					' . wp_remote_retrieve_body( $get_close_icon ) . '
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

	// TODO: Please improve the following @param description.

	/**
	 * Adds the necessary nav class for navigation.js to control sub menus.
	 *
	 * @param mixed $block_content The block content. Type could possibly be more specific.
	 * @param mixed $block The block. Type could possibly be more specific.
	 * @param mixed $instance The instance. Type could possibly be more specific.
	 * @return string.
	 */
	public function add_nav_class_to_navigation_block( $block_content, $block, $instance ) {
		// Instantiate the tag processor.
		$content = new \WP_HTML_Tag_Processor( $block_content );

		// Find the first <ul> or <ol> tag in the block markup.
		$content->next_tag( array( 'nav' ) );
		// Note: soon this will change to `$content->next( [ 'ol', 'ul' ] )`.

		// Add a custom class.
		$content->add_class( 'nav--toggle-sub' );

		// Save the updated block content.
		$block_content = (string) $content;

		// Return the block content.
		return $block_content;
	}

	/**
	 * Modifies menu item output for improved accessibility.
	 *
	 * This method replaces `<a>` tags with `<button>` elements for menu items that have no valid URL
	 * or only contain `#`, adding appropriate accessibility attributes when necessary.
	 * It ensures meaningful semantics and better navigation for assistive technologies.
	 *
	 * @param string $item_output The HTML output for the current menu item.
	 * @param object $item WP_Post object for the current menu item.
	 * @param int    $depth Depth of the menu item. Used for nesting levels.
	 * @param array  $args An associative array of arguments passed to `wp_nav_menu()`.
	 *
	 * @return string Modified HTML output for the menu item.
	 */
	public function modify_menu_items_for_accessibility( $item_output, $item, $depth, $args ) {
		// Ensure we're working with the correct nav menu theme location.
		if ( empty( $args->theme_location ) || 'primary' !== $args->theme_location ) {
			return $item_output;
		}

		// Check if the `href` is empty or `#`.
		if ( empty( $item->url ) || '#' === $item->url ) {
			// Extract the original link content (e.g., the text inside the original <a> tag).
			$item_label = $item->title;

			// Add dropdown symbol inside the button.
			$dropdown_symbol = '<span class="dropdown"><i class="dropdown-symbol"></i></span>';
			$has_submenu     = in_array( 'menu-item-has-children', $item->classes, true );

			// Replace `<a>` with `<button>` for accessibility and meaningful semantics.
			return sprintf(
				'<button class="%s" type="button" aria-expanded="false" aria-controls="submenu-%s">%s %s</button>',
				$has_submenu ? 'submenu-toggle' : '',
				esc_attr( $item->ID ),
				esc_html( $item_label ),
				$has_submenu ? $dropdown_symbol : ''
			);
		}

		// Leave items unaffected that have valid URLs or do not meet conditions.
		return $item_output;
	}
}
