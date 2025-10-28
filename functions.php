<?php
/**
 * WP Rig functions and definitions
 *
 * This file must be parseable by PHP 5.2.
 *
 * @link https://developer.wordpress.org/themes/basics/theme-functions/
 *
 * @package wp_rig
 */

/**
 * Add LiveReload script in development mode.
 */

define( 'WP_RIG_MINIMUM_WP_VERSION', '5.4' );
define( 'WP_RIG_MINIMUM_PHP_VERSION', '8.0' );

// Bail if requirements are not met.
if ( version_compare( $GLOBALS['wp_version'], WP_RIG_MINIMUM_WP_VERSION, '<' ) || version_compare( phpversion(), WP_RIG_MINIMUM_PHP_VERSION, '<' ) ) {
	require get_template_directory() . '/inc/back-compat.php';
	return;
}

// Include WordPress shims.
require get_template_directory() . '/inc/wordpress-shims.php';

// Setup autoloader (via Composer or custom).
if ( file_exists( get_template_directory() . '/vendor/autoload.php' ) ) {
	require get_template_directory() . '/vendor/autoload.php';
} else {
	/**
	 * Custom autoloader function for theme classes.
	 *
	 * @access private
	 *
	 * @param string $class_name Class name to load.
	 * @return bool True if the class was loaded, false otherwise.
	 */
	function _wp_rig_autoload( $class_name ) {
		$namespace = 'WP_Rig\WP_Rig';

		if ( 0 !== strpos( $class_name, $namespace . '\\' ) ) {
			return false;
		}

		$parts = explode( '\\', substr( $class_name, strlen( $namespace . '\\' ) ) );

		$path = get_template_directory() . '/inc';
		foreach ( $parts as $part ) {
			$path .= '/' . $part;
		}
		$path .= '.php';

		if ( ! file_exists( $path ) ) {
			return false;
		}

		require_once $path;

		return true;
	}
	spl_autoload_register( '_wp_rig_autoload' );
}

// Load the `wp_rig()` entry point function.
require get_template_directory() . '/inc/functions.php';

// Add custom WP CLI commands.
if ( defined( 'WP_CLI' ) && WP_CLI ) {
	require_once get_template_directory() . '/wp-cli/wp-rig-commands.php';
}

// Initialize the theme.
call_user_func( 'WP_Rig\WP_Rig\wp_rig' );

/**
 * Inject Tiny LiveReload client when browsing through the modern dev proxy.
 * Primary signal is the X-WPRIG-DEV request header set by the proxy.
 * As a fallback, detect proxied requests via X-Forwarded-Host pointing to localhost:3000.
 * This does not rely on WP_DEBUG.
 */
if ( ! function_exists( 'wprig_is_dev_proxy_request' ) ) {
	function wprig_is_dev_proxy_request() {
		$has_custom_header = ! empty( $_SERVER['HTTP_X_WPRIG_DEV'] );
		$xfh               = isset( $_SERVER['HTTP_X_FORWARDED_HOST'] ) ? (string) $_SERVER['HTTP_X_FORWARDED_HOST'] : '';
		// Accept any localhost forwarded host regardless of port (supports custom devPort)
		$is_localhost_forward = ( false !== stripos( $xfh, 'localhost' ) ) || ( false !== stripos( $xfh, '127.0.0.1' ) );
		$has_cookie           = isset( $_COOKIE['wprig_dev'] ) && $_COOKIE['wprig_dev'] === '1';
		// return true;
		return $has_custom_header || $is_localhost_forward || $has_cookie;
	}
}

add_action(
	'wp_head',
	function () {
		if ( wprig_is_dev_proxy_request() ) {
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Static local URL for dev only
			echo "\n<script src=\"//localhost:35729/livereload.js?snipver=1\"></script>\n";
		}
	}
);
add_action(
	'admin_head',
	function () {
		if ( wprig_is_dev_proxy_request() ) {
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Static local URL for dev only
			echo "\n<script src=\"http://localhost:35729/livereload.js?snipver=1\"></script>\n";
		}
	}
);
