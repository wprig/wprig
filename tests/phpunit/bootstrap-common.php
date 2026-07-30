<?php
/**
 * WP Rig common tests bootstrap script.
 *
 * @package wp_rig
 */

// Disable xdebug backtrace.
if ( function_exists( 'xdebug_disable' ) ) {
	xdebug_disable();
}

define( 'TESTS_THEME_DIR', dirname( __DIR__, 2 ) );
define( 'TESTS_THEME_BASENAME', basename( TESTS_THEME_DIR ) );
define( 'TESTS_THEME_URI', 'http://example.org/wp-content/themes/' . TESTS_THEME_BASENAME );
define( 'WP_TESTS_PHPUNIT_POLYFILLS_PATH', TESTS_THEME_DIR . '/vendor/yoast/phpunit-polyfils' );

// Vendor directory is one level above 'dev' folder.
$loader = require TESTS_THEME_DIR . '/vendor/autoload.php';
$loader->addPsr4( 'WP_Rig\\WP_Rig\\Tests\\Framework\\', __DIR__ . '/framework' );

// Define mock WordPress global functions for unit tests.
if ( ! function_exists( 'trailingslashit' ) ) {
	/**
	 * Mock trailingslashit function.
	 *
	 * @param string $str Input string.
	 * @return string Output string with trailing slash.
	 */
	function trailingslashit( $str ) {
		return rtrim( $str, '/' ) . '/';
	}
}

if ( ! function_exists( 'wp_register_block_types_from_metadata_collection' ) ) {
	/**
	 * Mock wp_register_block_types_from_metadata_collection function.
	 *
	 * @param string $path Path to build directory.
	 * @param string $manifest Path to manifest file.
	 */
	function wp_register_block_types_from_metadata_collection( $path, $manifest ) {
		$GLOBALS['wp_register_block_types_from_metadata_collection_calls'][] = array( $path, $manifest );
	}
}

if ( ! function_exists( 'wp_register_block_metadata_collection' ) ) {
	/**
	 * Mock wp_register_block_metadata_collection function.
	 *
	 * @param string $path Path to build directory.
	 * @param string $manifest Path to manifest file.
	 */
	function wp_register_block_metadata_collection( $path, $manifest ) {
		$GLOBALS['wp_register_block_metadata_collection_calls'][] = array( $path, $manifest );
	}
}

if ( ! function_exists( 'register_block_type_from_metadata' ) ) {
	/**
	 * Mock register_block_type_from_metadata function.
	 *
	 * @param string $file Path to block folder or block.json.
	 */
	function register_block_type_from_metadata( $file ) {
		$GLOBALS['register_block_type_from_metadata_calls'][] = $file;
	}
}
