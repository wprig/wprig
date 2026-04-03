<?php
/**
 * WP Rig Performance_Component_Test class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Tests\Unit\Performance;

use WP_Rig\WP_Rig\Performance\Component;
use PHPUnit\Framework\TestCase;

/**
 * Class unit-testing the performance component.
 *
 * @group performance
 */
class Performance_Component_Test extends TestCase {

	/**
	 * Tests that the component returns the correct slug.
	 */
	public function test_get_slug() {
		$component = new Component();
		$this->assertEquals( 'performance', $component->get_slug() );
	}
}
