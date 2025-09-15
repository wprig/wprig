<?php
/**
 * WP Rig Integration_Test_Case class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Tests\Framework;

use WP_UnitTestCase;

/**
 * Integration test case base class.
 */
class Integration_Test_Case extends WP_UnitTestCase {

	/**
	 * Sets up the environment before each test.
	 */
	public function setUp(): void {
		parent::setUp();

		// Suppress the incorrect usage notice for title-tag theme support
		add_filter(
			'doing_it_wrong_trigger_error',
			function ( $trigger_error, $function ) {
				if ( 'add_theme_support( \'title-tag\' )' === $function ) {
					return false;
				}
				return $trigger_error;
			},
			10,
			2
		);

		// Switch to our theme and force theme setup
		switch_theme( TESTS_THEME_BASENAME );

		// Force theme functions.php to load if it hasn't already
		$functions_file = get_template_directory() . '/functions.php';
		if ( file_exists( $functions_file ) ) {
			require_once $functions_file;
		}

		// Fire the after_setup_theme hook to ensure theme supports are registered
		do_action( 'after_setup_theme' );

		// Ensure theme is properly activated
		$this->assertTrue(
			TESTS_THEME_BASENAME === wp_get_theme()->get_stylesheet(),
			'Theme should be activated for integration tests'
		);
	}

	/**
	 * Tears down the environment after each test.
	 */
	public function tearDown(): void {
		// Fix for core test suite removing 'html5' theme support after each test.
		$html5_support = get_theme_support( 'html5' );

		parent::tearDown();

		if ( ! empty( $html5_support ) ) {
			add_theme_support( 'html5', $html5_support[0] );
		}
	}
}
