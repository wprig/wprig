<?php
/**
 * WP Rig integration tests bootstrap script for WordPress.
 *
 * @package wp_rig
 */

// Run common tests script.
require __DIR__ . '/bootstrap-common.php';

// Determine location of WP test suite.
if ( false !== getenv( 'WP_TESTS_DIR' ) ) {
	$test_root = getenv( 'WP_TESTS_DIR' );
} elseif ( false !== getenv( 'WP_DEVELOP_DIR' ) ) {
	$test_root = getenv( 'WP_DEVELOP_DIR' ) . '/tests/phpunit';
} elseif ( file_exists( '/tmp/wordpress-tests-lib/includes/bootstrap.php' ) ) {
	$test_root = '/tmp/wordpress-tests-lib';
} else {
	$test_root = '../../../../../../../tests/phpunit';
}

// Override WP options to set current theme and themes directory.
$GLOBALS['wp_tests_options'] = [
	'template'        => TESTS_THEME_BASENAME,
	'stylesheet'      => TESTS_THEME_BASENAME,
	'template_root'   => dirname( TESTS_THEME_DIR ),
	'stylesheet_root' => dirname( TESTS_THEME_DIR ),
];

// Register the themes directory.
require_once $test_root . '/includes/functions.php';
tests_add_filter(
	'setup_theme',
	function() {
		register_theme_directory( $GLOBALS['wp_tests_options']['stylesheet_root'] );
	}
);

// Load WP test suite.
require_once $test_root . '/includes/bootstrap.php';
