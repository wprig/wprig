<?php
/**
 * WP_Rig\WP_Rig\Nav_Menus\Component class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Nav_Menus;

use WP_Post;
use WP_Rig\WP_Rig\Component_Interface;
use WP_Rig\WP_Rig\Templating_Component_Interface;

use function WP_Rig\WP_Rig\wp_rig;
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

	const string PRIMARY_NAV_MENU_SLUG = 'primary';

	/**
	 * All theme settings - from JSON file.
	 *
	 * @var $theme_settings array
	 */
	public $theme_settings;

	/**
	 * Dropdown symbol SVG content.
	 *
	 * @var string
	 */
	private $dropdown_symbol_svg;

	/**
	 * Menu icon SVG content.
	 *
	 * @var string
	 */
	private $menu_icon_svg;

	/**
	 * Close icon SVG content.
	 *
	 * @var string
	 */
	private $close_icon_svg;

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
		$this->preload_svg_assets();
		$this->hooks();
	}

	/**
	 * Preloads SVG assets to avoid multiple file reads during menu rendering.
	 *
	 * Each SVG can be filtered by theme developers using the provided hooks:
	 * - 'wp_rig_dropdown_icon_svg' - Filter the dropdown arrow icon used in navigation menus
	 * - 'wp_rig_menu_toggle_icon_svg' - Filter the hamburger menu icon
	 * - 'wp_rig_menu_close_icon_svg' - Filter the close (X) icon for the mobile menu
	 */
	private function preload_svg_assets() {
		// Load dropdown symbol SVG.
		$dropdown_svg = wp_rig()->get_theme_asset( 'dropdown-symbol.svg', 'svg', true ) ?? '';

		/**
		 * Filters the dropdown icon SVG markup used in navigation menus.
		 *
		 * @since 2.0.0
		 *
		 * @param string $dropdown_svg The SVG markup for the dropdown arrow icon.
		 */
		$this->dropdown_symbol_svg = apply_filters( 'wp_rig_dropdown_icon_svg', $dropdown_svg );

		// Load menu toggle icons.
		$menu_icon_path  = get_theme_file_uri() . '/assets/svg/menu-icon.svg';
		$close_icon_path = get_theme_file_uri() . '/assets/svg/close-icon.svg';

		$menu_response  = wp_remote_get( $menu_icon_path );
		$close_response = wp_remote_get( $close_icon_path );

		$menu_icon_svg  = is_wp_error( $menu_response ) ? '' : wp_remote_retrieve_body( $menu_response );
		$close_icon_svg = is_wp_error( $close_response ) ? '' : wp_remote_retrieve_body( $close_response );

		/**
		 * Filters the mobile menu toggle (hamburger) icon SVG markup.
		 *
		 * @since 2.0.0
		 *
		 * @param string $menu_icon_svg The SVG markup for the hamburger menu icon.
		 */
		$this->menu_icon_svg = apply_filters( 'wp_rig_menu_toggle_icon_svg', $menu_icon_svg );

		/**
		 * Filters the mobile menu close (X) icon SVG markup.
		 *
		 * @since 2.0.0
		 *
		 * @param string $close_icon_svg The SVG markup for the close menu icon.
		 */
		$this->close_icon_svg = apply_filters( 'wp_rig_menu_close_icon_svg', $close_icon_svg );
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
		add_filter( 'wp_nav_menu_objects', array( $this, 'inject_parent_link_into_submenu' ), 10, 2 );
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
	 * @param object $args        An object of wp_nav_menu() arguments.
	 *
	 * @return string Modified nav menu HTML.
	 */
	public function filter_primary_nav_menu_dropdown_symbol( string $item_output, WP_Post $item, int $depth, object $args ): string {

		// Only for our primary menu location.
		if ( empty( $args->theme_location ) || static::PRIMARY_NAV_MENU_SLUG !== $args->theme_location ) {
			return $item_output;
		}

		// Add the dropdown for items that have children.
		if ( ! empty( $item->classes ) && in_array( 'menu-item-has-children', $item->classes, true ) ) {
			return $item_output . '<span class="dropdown">' . $this->dropdown_symbol_svg . '</span>';
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
		return '<button class="menu-toggle icon" aria-label="' . esc_html__( 'Open menu', 'wp-rig' ) . '" aria-controls="primary-menu" aria-expanded="false">
					' . $this->menu_icon_svg . '
					' . $this->close_icon_svg . '
					</button>';
	}

	/**
	 * Displays the primary navigation menu.
	 *
	 * @return string Mobile Nav Toggle classes.
	 */
	public function customize_mobile_menu_nav_classes() {
		return esc_html( 'main-navigation nav--toggle-sub nav--toggle-small icon-nav' );
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
	public function add_nav_class_to_navigation_block( mixed $block_content, mixed $block, mixed $instance ): string {
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
	 * Inject a duplicate of the parent link as the first submenu item for parents that
	 * have children AND a valid URL. This improves mobile UX: tapping the parent opens
	 * the submenu, while the injected first child preserves access to the parent's URL.
	 *
	 * - Only applies to the Primary menu location.
	 * - Skips if an injected item already exists.
	 * - Marks injected items with a special class for styling/visibility control.
	 *
	 * @param WP_Post[] $items Menu items.
	 * @param object    $args  Menu args from wp_nav_menu().
	 *
	 * @return WP_Post[] Potentially modified items array.
	 */
	public function inject_parent_link_into_submenu( array $items, object $args ): array {
		// Ensure we're working with the correct nav menu theme location.
		if ( empty( $args->theme_location ) || static::PRIMARY_NAV_MENU_SLUG !== $args->theme_location ) {
			return $items;
		}

		// Build a quick lookup of children by parent ID to detect existing injected links and ordering.
		$children_by_parent = array();
		foreach ( $items as $itm ) {
			$parent_id = (int) ( $itm->menu_item_parent ?? 0 );
			if ( ! isset( $children_by_parent[ $parent_id ] ) ) {
				$children_by_parent[ $parent_id ] = array();
			}
			$children_by_parent[ $parent_id ][] = $itm;
		}

		$injected = array();

		foreach ( $items as $item ) {
			$has_children  = ! empty( $item->classes ) && is_array( $item->classes ) && in_array( 'menu-item-has-children', $item->classes, true );
			$has_valid_url = ! empty( $item->url ) && '#' !== $item->url;

			if ( ! $has_children || ! $has_valid_url ) {
				continue;
			}

			$already_has_injected = false;
			$children             = $children_by_parent[ (int) $item->ID ] ?? array();
			foreach ( $children as $child ) {
				if ( ! empty( $child->classes ) && is_array( $child->classes ) && in_array( 'menu-item--injected-parent-link', $child->classes, true ) ) {
					$already_has_injected = true;
					break;
				}
			}

			if ( $already_has_injected ) {
				continue;
			}

			// Create a lightweight clone of the parent as a custom child item.
			$new = clone $item;
			// Ensure unique/harmless identifiers for the injected item.
			$new->ID               = -1 * ( absint( $item->ID ) + 100000 );
			$new->db_id            = 0;
			$new->menu_item_parent = (int) $item->ID;
			$new->type             = 'custom';
			$new->object           = 'custom';
			$new->object_id        = 0;
			$new->title            = $item->title;
			$new->url              = $item->url;
			$new->xfn              = '';
			$new->target           = $item->target ?? '';
			$new->attr_title       = $item->attr_title ?? '';
			$new->description      = '';
			$base_classes          = array_diff( (array) ( $item->classes ?? array() ), array( 'menu-item-has-children' ) );
			$new->classes          = array_unique( array_merge( $base_classes, array( 'menu-item--injected-parent-link' ) ) );

			// Try to make it the first among this parent's children by using a very small menu_order.
			$children_orders = array_map(
				function ( $c ) {
					return (int) ( $c->menu_order ?? 0 );
				},
				$children
			);
			$min_order       = empty( $children_orders ) ? 0 : min( $children_orders );
			$new->menu_order = $min_order - 1;

			$injected[] = $new;
		}

		if ( empty( $injected ) ) {
			return $items;
		}

		// Merge and sort items by menu_order to keep expected order.
		$items = array_merge( $items, $injected );
		usort(
			$items,
			function ( $a, $b ) {
				$ao = (int) ( $a->menu_order ?? 0 );
				$bo = (int) ( $b->menu_order ?? 0 );
				if ( $ao === $bo ) {
					return 0;
				}
				return ( $ao < $bo ) ? -1 : 1;
			}
		);

		return $items;
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
	 * @param int $depth Depth of the menu item. Used for nesting levels.
	 * @param object $args An object of arguments passed to `wp_nav_menu()`.
	 *
	 * @return string Modified HTML output for the menu item.
	 */
	public function modify_menu_items_for_accessibility( string $item_output, object $item, int $depth, object $args ): string {
		// Ensure we're working with the correct nav menu theme location.
		if ( empty( $args->theme_location ) || 'primary' !== $args->theme_location ) {
			return $item_output;
		}

		// Check if the `href` is empty or `#`.
		if ( empty( $item->url ) || '#' === $item->url ) {
			// Extract the original link content (e.g., the text inside the original <a> tag).
			$item_label = $item->title;

			// Add dropdown symbol inside the button.
			$dropdown_symbol = '<span class="dropdown">' . $this->dropdown_symbol_svg . '</span>';
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

	/**
	 * Gets the dropdown symbol SVG content.
	 *
	 * @return string The dropdown symbol SVG markup.
	 */
	public function get_dropdown_symbol_svg() {
		return $this->dropdown_symbol_svg;
	}

	/**
	 * Gets the menu toggle icon SVG content.
	 *
	 * @return string The menu toggle icon SVG markup.
	 */
	public function get_menu_icon_svg() {
		return $this->menu_icon_svg;
	}

	/**
	 * Gets the menu close icon SVG content.
	 *
	 * @return string The menu close icon SVG markup.
	 */
	public function get_close_icon_svg() {
		return $this->close_icon_svg;
	}
}
