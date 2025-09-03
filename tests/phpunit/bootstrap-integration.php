<?php
/**
 * WP Rig integration tests bootstrap - uses WordPress's built-in PHPUnit compatibility
 *
 * @package wp_rig
 */

// Run common tests script.
require __DIR__ . '/bootstrap-common.php';

// Auto-setup WordPress test environment if it doesn't exist
function wp_rig_ensure_test_environment() {
	// Get the real system temp directory
	$system_temp = realpath( sys_get_temp_dir() );
	$test_dir    = $system_temp . DIRECTORY_SEPARATOR . 'wprig-tests' . DIRECTORY_SEPARATOR . 'wordpress-tests-lib';

	if ( ! file_exists( $test_dir . DIRECTORY_SEPARATOR . 'includes' . DIRECTORY_SEPARATOR . 'bootstrap.php' ) ) {
		echo "Setting up WordPress test environment...\n";
		$setup_script = TESTS_THEME_DIR . DIRECTORY_SEPARATOR . 'tests' . DIRECTORY_SEPARATOR . 'phpunit' . DIRECTORY_SEPARATOR . 'setup-wp-env.php';

		if ( file_exists( $setup_script ) ) {
			exec( "php \"{$setup_script}\"", $output, $return_code );
			if ( 0 !== $return_code ) {
				throw new Exception( 'Failed to set up WordPress test environment.' );
			}
		}
	}

	return $test_dir;
}

$test_root = wp_rig_ensure_test_environment();

// Override WP options to set current theme and themes directory.
$GLOBALS['wp_tests_options'] = array(
	'template'        => TESTS_THEME_BASENAME,
	'stylesheet'      => TESTS_THEME_BASENAME,
	'template_root'   => dirname( TESTS_THEME_DIR ),
	'stylesheet_root' => dirname( TESTS_THEME_DIR ),
);

// Register the themes directory.
require_once $test_root . DIRECTORY_SEPARATOR . 'includes' . DIRECTORY_SEPARATOR . 'functions.php';
tests_add_filter(
	'setup_theme',
	function () {
		register_theme_directory( $GLOBALS['wp_tests_options']['stylesheet_root'] );
	}
);

// Load WP test suite - let WordPress handle PHPUnit compatibility

$bootstrap_file = $test_root . DIRECTORY_SEPARATOR . 'includes' . DIRECTORY_SEPARATOR . 'bootstrap.php';
if ( ! file_exists( $bootstrap_file ) ) {
	echo "❌ ERROR: Bootstrap file does not exist: {$bootstrap_file}\n";
	exit( 1 );
}


// WordPress will handle PHPUnit compatibility - we just need to load it
require_once $bootstrap_file;

echo "✅ WordPress test suite bootstrap loaded successfully\n";
