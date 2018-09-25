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
	 * Tears down the environment after each test.
	 */
	public function tearDown() {

		// Fix for core test suite removing 'html5' theme support after each test.
		$html5_support = get_theme_support( 'html5' );
		parent::tearDown();
		if ( ! empty( $html5_support ) ) {
			add_theme_support( 'html5', $html5_support[0] );
		}
	}
}
