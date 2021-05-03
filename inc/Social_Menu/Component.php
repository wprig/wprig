<?php
/**
 * WP_Rig\WP_Rig\Social_Menu\Component class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Social_Menu;

use WP_Rig\WP_Rig\Component_Interface;
use WP_Rig\WP_Rig\Templating_Component_Interface;
use WP_Post;
use function WP_Rig\WP_Rig\wp_rig;
use function add_action;
use function add_filter;
use function register_nav_menus;
use function esc_html__;
use function has_nav_menu;
use function wp_nav_menu;

/**
 * Class for managing social links from a menu.
 *
 * Exposes template tags:
 * * `wp_rig()->is_social_menu_active()`
 * * `wp_rig()->display_social_menu( array $args )`
 */
class Component implements Component_Interface, Templating_Component_Interface {

	const SOCIAL_MENU_SLUG = 'social';
	const TRANSIENT_NAME   = 'nav_menu-social';
	const ICON_SIZE        = 26;

	/**
	 * Gets the unique identifier for the theme component.
	 *
	 * @return string Component slug.
	 */
	public function get_slug() : string {
		return 'social_menu';
	}

	/**
	 * Adds the action and filter hooks to integrate with WordPress.
	 */
	public function initialize() {
		add_action( 'after_setup_theme', [ $this, 'action_register_social_menu' ] );
		add_action( 'wp_update_nav_menu', [ $this, 'action_delete_transient' ] );
		add_action( 'switch_theme', [ $this, 'action_delete_transient' ] );
		add_filter( 'walker_nav_menu_start_el', [ $this, 'filter_social_menu_icons' ], 10, 4 );
	}

	/**
	 * Gets template tags to expose as methods on the Template_Tags class instance, accessible through `wp_rig()`.
	 *
	 * @return array Associative array of $method_name => $callback_info pairs. Each $callback_info must either be
	 *               a callable or an array with key 'callable'. This approach is used to reserve the possibility of
	 *               adding support for further arguments in the future.
	 */
	public function template_tags() : array {
		return [
			'is_social_menu_active' => [ $this, 'is_social_menu_active' ],
			'display_social_menu'   => [ $this, 'display_social_menu' ],
		];
	}

	/**
	 * Registers the social menu.
	 */
	public function action_register_social_menu() {
		register_nav_menus(
			[
				static::SOCIAL_MENU_SLUG => esc_html__( 'Social links', 'wp-rig' ),
			]
		);
	}

	/**
	 * Deletes the transient used to cache this menu.
	 */
	public function action_delete_transient() {
		delete_transient( self::TRANSIENT_NAME );
	}

	/**
	 * Display SVG icons in social links menu.
	 *
	 * @param string  $item_output The menu item's starting HTML output.
	 * @param WP_Post $item        Menu item data object.
	 * @param int     $depth       Depth of menu item.
	 * @param object  $args        An object of wp_nav_menu() arguments.
	 * @return string The menu item output with social icon.
	 */
	public function filter_social_menu_icons( string $item_output, WP_Post $item, int $depth, $args ) : string {
		if ( static::SOCIAL_MENU_SLUG !== $args->theme_location ) {
			return $item_output;
		}

		// Change SVG icon inside social links menu if there is supported URL.
		$svg = wp_rig()->get_social_link_svg( $item->url, self::ICON_SIZE );
		if ( empty( $svg ) ) {
			$svg = wp_rig()->get_svg( 'ui', 'link', self::ICON_SIZE );
		}
		return str_replace( $args->link_after, '</span>' . $svg, $item_output );
	}

	/**
	 * Checks whether the social navigation menu is active.
	 *
	 * @return bool True if the social navigation menu is active, false otherwise.
	 */
	public function is_social_menu_active() : bool {
		return (bool) has_nav_menu( static::SOCIAL_MENU_SLUG );
	}

	/**
	 * Displays the social menu.
	 *
	 * @param array $args Optional. Array of arguments. See `wp_nav_menu()` documentation for a list of supported
	 *                    arguments.
	 */
	public function display_social_menu( array $args = [] ) {
		if ( ! $this->is_social_menu_active() ) {
			return;
		}

		if ( ! isset( $args['container'] ) ) {
			$args['container'] = 'ul';
		}

		if ( ! isset( $args['menu_class'] ) ) {
			$args['menu_class'] = 'social-links-menu';
		}

		$args['link_before']    = '<span class="screen-reader-text">';
		$args['link_after']     = '</span>' . wp_rig()->get_svg( 'ui', 'link', self::ICON_SIZE );
		$args['theme_location'] = static::SOCIAL_MENU_SLUG;
		$args['echo']           = 0;

		$nav_menu = get_transient( static::TRANSIENT_NAME );

		if ( false === $nav_menu ) {
			$nav_menu = wp_nav_menu( $args );
			set_transient( static::TRANSIENT_NAME, $nav_menu, YEAR_IN_SECONDS );
		}

		echo $nav_menu; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}
}
