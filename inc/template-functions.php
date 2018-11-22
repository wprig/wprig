<?php
/**
 * Functions which enhance the theme by hooking into WordPress
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig;

use WP_Post;

/**
 * Adds custom classes to the array of body classes.
 *
 * @param array $classes Classes for the body element.
 * @return array Filtered body classes.
 */
function filter_body_classes( array $classes ) : array {
	// Adds a class of hfeed to non-singular pages.
	if ( ! is_singular() ) {
		$classes[] = 'hfeed';
	}

	if ( is_active_sidebar( 'sidebar-1' ) ) {
		global $template;
		if ( 'front-page.php' !== basename( $template ) ) {
			$classes[] = 'has-sidebar';
		}
	}

	return $classes;
}
add_filter( 'body_class', __NAMESPACE__ . '\\filter_body_classes' );

/**
 * Adds a pingback url auto-discovery header for singularly identifiable articles.
 */
function add_pingback_header() {
	if ( is_singular() && pings_open() ) {
		echo '<link rel="pingback" href="', esc_url( get_bloginfo( 'pingback_url' ) ), '">';
	}
}
add_action( 'wp_head', __NAMESPACE__ . '\\add_pingback_header' );

/**
 * Adds dropdown symbol to nav menu items with children.
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
function filter_primary_menu_dropdown_symbol( string $item_output, WP_Post $item, int $depth, $args ) : string {

	// Only for our primary menu location.
	if ( empty( $args->theme_location ) || 'primary' != $args->theme_location ) {
		return $item_output;
	}

	// Add the dropdown for items that have children.
	if ( ! empty( $item->classes ) && in_array( 'menu-item-has-children', $item->classes ) ) {
		return $item_output . '<span class="dropdown"><i class="dropdown-symbol"></i></span>';
	}

	return $item_output;
}
add_filter( 'walker_nav_menu_start_el', __NAMESPACE__ . '\\filter_primary_menu_dropdown_symbol', 10, 4 );

/**
 * Filters the HTML attributes applied to a menu item's anchor element.
 *
 * Checks if the menu item is the current menu
 * item and adds the aria "current" attribute.
 *
 * @param array   $atts   The HTML attributes applied to the menu item's `<a>` element.
 * @param WP_Post $item  The current menu item.
 * @return array Modified HTML attributes
 */
function filter_nav_menu_link_attributes_aria_current( array $atts, WP_Post $item ) : array {
	/*
	 * First, check if "current" is set,
	 * which means the item is a nav menu item.
	 *
	 * Otherwise, it's a post item so check
	 * if the item is the current post.
	 */
	if ( isset( $item->current ) ) {
		if ( $item->current ) {
			$atts['aria-current'] = 'page';
		}
	} else if ( ! empty( $item->ID ) ) {
		global $post;
		if ( ! empty( $post->ID ) && $post->ID == $item->ID ) {
			$atts['aria-current'] = 'page';
		}
	}

	return $atts;
}
add_filter( 'nav_menu_link_attributes', __NAMESPACE__ . '\\filter_nav_menu_link_attributes_aria_current', 10, 2 );
add_filter( 'page_menu_link_attributes', __NAMESPACE__ . '\\filter_nav_menu_link_attributes_aria_current', 10, 2 );

/**
 * Excludes any directory named 'optional' from being scanned for theme files
 *
 * @link https://developer.wordpress.org/reference/hooks/theme_scandir_exclusions/
 *
 * @param array $exclusions the default directories to exclude.
 * @return array Filtered exclusions.
 */
function exclude_optional_templates( array $exclusions ) : array {
	return array_merge(
		$exclusions,
		array( 'optional' )
	);
}
add_filter( 'theme_scandir_exclusions', __NAMESPACE__ . '\\exclude_optional_templates', 10, 1 );
