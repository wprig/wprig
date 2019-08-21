<?php
/**
 * WP_Rig\WP_Rig\Sidebars\Component class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Sidebars;

use WP_Rig\WP_Rig\Component_Interface;
use WP_Rig\WP_Rig\Templating_Component_Interface;
use function add_action;
use function add_filter;
use function register_sidebar;
use function esc_html__;
use function is_active_sidebar;
use function dynamic_sidebar;

/**
 * Class for managing sidebars.
 *
 * Exposes template tags:
 * * `wp_rig()->is_primary_sidebar_active()`
 * * `wp_rig()->display_primary_sidebar()`
 *
 * @link https://developer.wordpress.org/themes/functionality/sidebars/
 */
class Component implements Component_Interface, Templating_Component_Interface {

	const PRIMARY_SIDEBAR_SLUG = 'sidebar-1';

	/**
	 * Gets the unique identifier for the theme component.
	 *
	 * @return string Component slug.
	 */
	public function get_slug() : string {
		return 'sidebars';
	}

	/**
	 * Adds the action and filter hooks to integrate with WordPress.
	 */
	public function initialize() {
		add_action( 'widgets_init', [ $this, 'action_register_sidebars' ] );
		add_filter( 'body_class', [ $this, 'filter_body_classes' ] );
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
			'is_primary_sidebar_active' => [ $this, 'is_primary_sidebar_active' ],
			'display_primary_sidebar'   => [ $this, 'display_primary_sidebar' ],
		];
	}

	/**
	 * Registers the sidebars.
	 */
	public function action_register_sidebars() {
		register_sidebar(
			[
				'name'          => esc_html__( 'Sidebar', 'wp-rig' ),
				'id'            => static::PRIMARY_SIDEBAR_SLUG,
				'description'   => esc_html__( 'Add widgets here.', 'wp-rig' ),
				'before_widget' => '<section id="%1$s" class="widget %2$s">',
				'after_widget'  => '</section>',
				'before_title'  => '<h2 class="widget-title">',
				'after_title'   => '</h2>',
			]
		);
	}

	/**
	 * Adds custom classes to indicate whether a sidebar is present to the array of body classes.
	 *
	 * @param array $classes Classes for the body element.
	 * @return array Filtered body classes.
	 */
	public function filter_body_classes( array $classes ) : array {
		if ( $this->is_primary_sidebar_active() ) {
			global $template;

			if ( ! in_array( basename( $template ), [ 'front-page.php', '404.php', '500.php', 'offline.php' ] ) ) {
				$classes[] = 'has-sidebar';
			}
		}

		return $classes;
	}

	/**
	 * Checks whether the primary sidebar is active.
	 *
	 * @return bool True if the primary sidebar is active, false otherwise.
	 */
	public function is_primary_sidebar_active() : bool {
		return (bool) is_active_sidebar( static::PRIMARY_SIDEBAR_SLUG );
	}

	/**
	 * Displays the primary sidebar.
	 */
	public function display_primary_sidebar() {
		dynamic_sidebar( static::PRIMARY_SIDEBAR_SLUG );
	}
}
