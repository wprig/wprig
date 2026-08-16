<?php
/**
 * WP_Rig\WP_Rig\Tests\Unit\Dev_Tools\Component_Test class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Tests\Unit\Dev_Tools;

use WP_Rig\WP_Rig\Tests\Framework\Unit_Test_Case;
use Brain\Monkey\Functions;
use WP_Rig\WP_Rig\Dev_Tools\Component;

/**
 * Class unit-testing the dev tools component.
 *
 * @group dev_tools
 */
class Component_Test extends Unit_Test_Case {

	/**
	 * The dev tools component instance.
	 *
	 * @var Component
	 */
	private $component;

	/**
	 * Sets up the environment before each test.
	 */
	protected function setUp(): void {
		parent::setUp();

		$this->component = new Component();
	}

	/**
	 * Tests that the slug of the component is correct.
	 *
	 * @covers \WP_Rig\WP_Rig\Dev_Tools\Component::get_slug()
	 */
	public function test_get_slug() {
		$this->assertSame( 'dev_tools', $this->component->get_slug() );
	}

	/**
	 * Tests that is_active() returns false when devTools is explicitly set to false in config.
	 *
	 * @covers \WP_Rig\WP_Rig\Dev_Tools\Component::is_active()
	 */
	public function test_is_active_when_disabled_in_config() {
		Functions\when( 'WP_Rig\WP_Rig\get_config' )->justReturn(
			array(
				'dev' => array(
					'devTools' => false,
				),
			)
		);

		$this->assertFalse( Component::is_active() );
	}

	/**
	 * Tests that is_active() returns true when devTools is true and on local domain.
	 *
	 * @covers \WP_Rig\WP_Rig\Dev_Tools\Component::is_active()
	 */
	public function test_is_active_when_enabled_in_config() {
		Functions\when( 'WP_Rig\WP_Rig\get_config' )->justReturn(
			array(
				'dev' => array(
					'devTools' => true,
				),
			)
		);

		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( 'wp_unslash' )->returnArg();

		$_SERVER['HTTP_HOST'] = 'localhost';

		$this->assertTrue( Component::is_active() );

		unset( $_SERVER['HTTP_HOST'] );
	}
}
