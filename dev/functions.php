<?php
/**
 * WP Rig functions and definitions
 *
 * This file must be parseable by PHP 5.2.
 *
 * @link https://developer.wordpress.org/themes/basics/theme-functions/
 *
 * @package wprig
 */

define( 'WPRIG_MINIMUM_WP_VERSION', '4.5' );
define( 'WPRIG_MINIMUM_PHP_VERSION', '7.0' );

/**
 * Bail if requirements are not met.
 */
if ( version_compare( $GLOBALS['wp_version'], WPRIG_MINIMUM_WP_VERSION, '<' ) || version_compare( phpversion(), WPRIG_MINIMUM_PHP_VERSION, '<' ) ) {
	require get_template_directory() . '/inc/back-compat.php';
	return;
}

/**
 * Setup and core features configuration.
 */
require get_template_directory() . '/inc/setup.php';

/**
 * Theme assets management.
 */
require get_template_directory() . '/inc/assets.php';

/**
 * Custom responsive image sizes.
 */
require get_template_directory() . '/inc/image-sizes.php';

/**
 * Implement the Custom Header feature.
 */
require get_template_directory() . '/pluggable/custom-header.php';

/**
 * Custom template tags for this theme.
 */
require get_template_directory() . '/inc/template-tags.php';

/**
 * Functions which enhance the theme by hooking into WordPress.
 */
require get_template_directory() . '/inc/template-functions.php';

/**
 * Customizer additions.
 */
require get_template_directory() . '/inc/customizer.php';

/**
 * Optional: Add theme support for lazyloading images.
 *
 * @link https://developers.google.com/web/fundamentals/performance/lazy-loading-guidance/images-and-video/
 */
require get_template_directory() . '/pluggable/lazyload/lazyload.php';
