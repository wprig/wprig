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
	$test_root = '../../../../../../tests/phpunit';
}

$test_root = rtrim( $test_root, '/' );

// WordPress only includes its PHPUnit 6 compatibility file since version 4.7.
if ( ! file_exists( $test_root . '/includes/phpunit6-compat.php' ) && ! file_exists( $test_root . '/includes/phpunit6/compat.php' ) && class_exists( 'PHPUnit\Runner\Version' ) && version_compare( PHPUnit\Runner\Version::id(), '6.0', '>=' ) ) {
	class_alias( 'PHPUnit\Framework\TestCase', 'PHPUnit_Framework_TestCase' );
	class_alias( 'PHPUnit\Framework\Exception', 'PHPUnit_Framework_Exception' );
	class_alias( 'PHPUnit\Framework\ExpectationFailedException', 'PHPUnit_Framework_ExpectationFailedException' );
	class_alias( 'PHPUnit\Framework\Error\Notice', 'PHPUnit_Framework_Error_Notice' );
	class_alias( 'PHPUnit\Framework\Error\Warning', 'PHPUnit_Framework_Error_Warning' );
	class_alias( 'PHPUnit\Framework\Test', 'PHPUnit_Framework_Test' );
	class_alias( 'PHPUnit\Framework\Warning', 'PHPUnit_Framework_Warning' );
	class_alias( 'PHPUnit\Framework\AssertionFailedError', 'PHPUnit_Framework_AssertionFailedError' );
	class_alias( 'PHPUnit\Framework\TestSuite', 'PHPUnit_Framework_TestSuite' );
	class_alias( 'PHPUnit\Framework\TestListener', 'PHPUnit_Framework_TestListener' );
	class_alias( 'PHPUnit\Util\GlobalState', 'PHPUnit_Util_GlobalState' );
	class_alias( 'PHPUnit\Util\Getopt', 'PHPUnit_Util_Getopt' );
	class_alias( 'PHPUnit\Util\Test', 'PHPUnit_Util_Test' );

	// This only needs to be included to that the WP test suite does not call the `getTickets()` method which conflicts.
	define( 'WP_TESTS_FORCE_KNOWN_BUGS', true );
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
