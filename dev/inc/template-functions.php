<?php
/**
 * Functions which enhance the theme by hooking into WordPress
 *
 * @package wprig
 */

/**
 * Adds custom classes to the array of body classes.
 *
 * @param array $classes Classes for the body element.
 * @return array
 */
function wprig_body_classes( $classes ) {
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
add_filter( 'body_class', 'wprig_body_classes' );

/**
 * Add a pingback url auto-discovery header for singularly identifiable articles.
 */
function wprig_pingback_header() {
	if ( is_singular() && pings_open() ) {
		echo '<link rel="pingback" href="', esc_url( get_bloginfo( 'pingback_url' ) ), '">';
	}
}
add_action( 'wp_head', 'wprig_pingback_header' );

/**
 * Adds async/defer attributes to enqueued / registered scripts.
 *
 * If #12009 lands in WordPress, this function can no-op since it would be handled in core.
 *
 * @link https://core.trac.wordpress.org/ticket/12009
 * @param string $tag    The script tag.
 * @param string $handle The script handle.
 * @return array
 */
function wprig_filter_script_loader_tag( $tag, $handle ) {

	foreach ( array( 'async', 'defer' ) as $attr ) {
		if ( ! wp_scripts()->get_data( $handle, $attr ) ) {
			continue;
		}

		// Prevent adding attribute when already added in #12009.
		if ( ! preg_match( ":\s$attr(=|>|\s):", $tag ) ) {
			$tag = preg_replace( ':(?=></script>):', " $attr", $tag, 1 );
		}

		// Only allow async or defer, not both.
		break;
	}

	return $tag;
}

add_filter( 'script_loader_tag', 'wprig_filter_script_loader_tag', 10, 2 );

/**
 * Generate preload markup for stylesheets.
 *
 * @param object $wp_styles Registered styles.
 * @param string $handle The style handle.
 */
function wprig_get_preload_stylesheet_uri( $wp_styles, $handle ) {
	$preload_uri = $wp_styles->registered[ $handle ]->src . '?ver=' . $wp_styles->registered[ $handle ]->ver;
	return $preload_uri;
}

/**
 * Adds preload for in-body stylesheets depending on what templates are being used.
 * Disabled when AMP is active as AMP injects the stylesheets inline.
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/HTML/Preloading_content
 */
function wprig_add_body_style() {

	if ( ! wprig_is_amp() ) {

		// Get registered styles.
		$wp_styles = wp_styles();

		$preloads = array();

		// Preload content.css.
		$preloads['wprig-content'] = wprig_get_preload_stylesheet_uri( $wp_styles, 'wprig-content' );

		// Preload sidebar.css and widget.css.
		if ( is_active_sidebar( 'sidebar-1' ) ) {
			$preloads['wprig-sidebar'] = wprig_get_preload_stylesheet_uri( $wp_styles, 'wprig-sidebar' );
			$preloads['wprig-widgets'] = wprig_get_preload_stylesheet_uri( $wp_styles, 'wprig-widgets' );
		}

		// Preload comments.css.
		if ( ! post_password_required() && is_singular() && ( comments_open() || get_comments_number() ) ) {
			$preloads['wprig-comments'] = wprig_get_preload_stylesheet_uri( $wp_styles, 'wprig-comments' );
		}

		// Preload front-page.css.
		if ( 'front-page.php' === basename( $template ) ) {
			$preloads['wprig-front-page'] = wprig_get_preload_stylesheet_uri( $wp_styles, 'wprig-front-page' );
		}

		// Output the preload markup in <head>.
		foreach ( $preloads as $handle => $src ) {
			echo '<link rel="preload" id="' . esc_attr( $handle ) . '-preload" href="' . esc_url( $src ) . '" as="style" />';
			echo "\n";
		}
	}

}
add_action( 'wp_head', 'wprig_add_body_style' );

/**
 * Add dropdown toggle buttons to nav menu.
 *
 * @param string $menu Nav menu HTML.
 * @return string Modified nav menu HTML.
 */
function wprig_add_menu_dropdown_toggle_button( $menu ) {
	$dropdown_button = sprintf(
		'<button class="dropdown-toggle" aria-expanded="false"><span class="dropdown-symbol" aria-hidden="true">&rsaquo;</span><span class="screen-reader-text">%s</span></button>',
		esc_html__( 'Expand child menu', 'wprig' )
	);
	return preg_replace( '/(?=<ul)/', $dropdown_button, $menu );
}
add_filter( 'wp_list_pages', 'wprig_add_menu_dropdown_toggle_button' );
add_filter( 'wp_nav_menu', 'wprig_add_menu_dropdown_toggle_button' );
