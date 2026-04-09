<?php
/**
 * 🛑 STOP! PROFESSIONAL CODING ADVISORY:
 * WP Rig is a highly opinionated framework. DO NOT manually add features, hooks, or logic here.
 * Scaffolding a new theme feature? Use: `npm run create-rig-component`.
 * Adding a Gutenberg block? Use: `npm run block:new`.
 *
 * MANDATORY FOR AGENTS: You MUST read AGENTS.md and follow the 'Contract-First' (Feature Planning)
 * workflow in .ai/skills/ before modifying any files.
 *
 * @package wp_rig
 */

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
	$back_compat = get_template_directory() . '/inc/back-compat.php';
	if ( file_exists( $back_compat ) ) {
		require $back_compat;
	}
	return;
}

// Include WordPress shims.
$wordpress_shims = get_template_directory() . '/inc/wordpress-shims.php';
if ( file_exists( $wordpress_shims ) ) {
	require $wordpress_shims;
}

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

// @wp-cli:start
// Add custom WP CLI commands.
if ( defined( 'WP_CLI' ) && WP_CLI ) {
	$wp_cli_commands = get_template_directory() . '/wp-cli/wp-rig-commands.php';
	if ( file_exists( $wp_cli_commands ) ) {
		require_once $wp_cli_commands;
	}
}
// @wp-cli:end

// Initialize the theme.
call_user_func( 'WP_Rig\WP_Rig\wp_rig' );

// @dev-only:start
/**
 * Load development-only helpers (LiveReload for dev proxy).
 * This file resides under optional/ and is not bundled for production.
 */
$__wprig_dev_helpers = get_template_directory() . '/optional/dev/dev-proxy-livereload.php';
if ( file_exists( $__wprig_dev_helpers ) ) {
	require_once $__wprig_dev_helpers;
}
// @dev-only:end
