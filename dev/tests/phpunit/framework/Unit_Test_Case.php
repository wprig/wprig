<?php
/**
 * WP Rig Unit_Test_Case class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Tests\Framework;

use PHPUnit\Framework\TestCase;
use Brain\Monkey;

/**
 * Unit test case base class.
 */
class Unit_Test_Case extends TestCase {

	/**
	 * Sets up the environment before each test.
	 */
	protected function setUp() {
		parent::setUp();
		Monkey\setUp();

		// We don't care about testing the following functions, so they should just be available.
		Monkey\Functions\stubs(
			[
				// With defined return value.
				'get_template_directory'   => TESTS_THEME_DIR,
				'get_stylesheet_directory' => TESTS_THEME_DIR,

				// With first parameter being returned.
				'esc_attr',
				'esc_html',
				'esc_js',
				'esc_textarea',
				'__',
				'_x',
				'esc_html__',
				'esc_html_x',
				'esc_attr_x',

				// With return value determined by callback.
				'_n' => function( $single, $plural, $number ) {
					return 1 === $number ? $single : $plural;
				},
				'_nx' => function( $single, $plural, $number ) {
					return 1 === $number ? $single : $plural;
				},
			]
		);
	}


	/**
	 * Tears down the environment after each test.
	 */
	protected function tearDown() {
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Asserts that the contents of two un-keyed, single arrays are equal, without accounting for the order of elements.
	 *
	 * @param array $expected Expected array.
	 * @param array $actual   Array to check.
	 */
	public static function assertEqualSets( $expected, $actual ) {
		sort( $expected );
		sort( $actual );
		self::assertEquals( $expected, $actual );
	}

	/**
	 * Asserts that the contents of two keyed, single arrays are equal, without accounting for the order of elements.
	 *
	 * @param array $expected Expected array.
	 * @param array $actual   Array to check.
	 */
	public static function assertEqualSetsWithIndex( $expected, $actual ) {
		ksort( $expected );
		ksort( $actual );
		self::assertEquals( $expected, $actual );
	}
}
