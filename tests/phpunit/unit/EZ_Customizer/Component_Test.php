<?php
/**
 * WP_Rig\WP_Rig\Tests\Unit\EZ_Customizer\Component_Test class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Tests\Unit\EZ_Customizer;

use WP_Rig\WP_Rig\Tests\Framework\Unit_Test_Case;
use Brain\Monkey\Functions;
use WP_Rig\WP_Rig\EZ_Customizer\Component;

/**
 * Class unit-testing the EZ Customizer component.
 *
 * @group ez_customizer
 */
class Component_Test extends Unit_Test_Case {

	/**
	 * The EZ Customizer component instance.
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
	 * @covers \WP_Rig\WP_Rig\EZ_Customizer\Component::get_slug()
	 */
	public function test_get_slug() {
		$this->assertSame( 'ez_customizer', $this->component->get_slug() );
	}

	/**
	 * Tests that is_active() returns false when themeType is block-based in config.
	 *
	 * @covers \WP_Rig\WP_Rig\EZ_Customizer\Component::is_active()
	 */
	public function test_is_active_when_block_based() {
		Functions\when( 'WP_Rig\WP_Rig\get_config' )->justReturn(
			array(
				'theme' => array(
					'themeType' => 'block-based',
				),
			)
		);

		$this->assertFalse( Component::is_active() );
	}

	/**
	 * Tests that is_active() returns true when themeType is classic or universal in config.
	 *
	 * @covers \WP_Rig\WP_Rig\EZ_Customizer\Component::is_active()
	 */
	public function test_is_active_when_classic_or_universal() {
		Functions\when( 'WP_Rig\WP_Rig\get_config' )->justReturn(
			array(
				'theme' => array(
					'themeType' => 'classic',
				),
			)
		);

		$this->assertTrue( Component::is_active() );
	}
}
