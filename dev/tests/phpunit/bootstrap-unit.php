<?php
/**
 * WP Rig unit tests bootstrap script.
 *
 * @package wp_rig
 */

// Run common tests script.
require __DIR__ . '/bootstrap-common.php';

// Stub essential WP functions for requiring the theme files.
Brain\Monkey\setUp();
Brain\Monkey\Functions\stubs(
	[
		'get_template_directory'   => TESTS_THEME_DIR,
		'get_stylesheet_directory' => TESTS_THEME_DIR,
	]
);

// Stub $wp_version global to ensure the theme is loaded.
$GLOBALS['wp_version'] = '99.0'; // phpcs:ignore WordPress.WP.GlobalVariablesOverride

// Load the theme.
require_once TESTS_THEME_DIR . '/functions.php';
