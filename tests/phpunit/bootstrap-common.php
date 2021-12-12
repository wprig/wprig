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
