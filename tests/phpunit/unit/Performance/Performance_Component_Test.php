<?php
/**
 * WP Rig Performance_Component_Test class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Tests\Unit\Performance;

use WP_Rig\WP_Rig\Performance\Component;
use PHPUnit\Framework\TestCase;
use Brain\Monkey;

/**
 * Class unit-testing the performance component.
 *
 * @group performance
 */
class Performance_Component_Test extends TestCase {

	/**
	 * Sets up the test environment.
	 */
	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	/**
	 * Tears down the test environment.
	 */
	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Tests that the component returns the correct slug.
	 */
	public function test_get_slug() {
		$component = new Component();
		$this->assertEquals( 'performance', $component->get_slug() );
	}

	/**
	 * Tests the cleanup_meta_tags method.
	 */
	public function test_cleanup_meta_tags() {
		$component = new Component();

		Monkey\Functions\expect( 'remove_action' )
			->atLeast()->once()
			->with( 'wp_head', 'rsd_link' );

		Monkey\Functions\expect( 'remove_action' )
			->atLeast()->once()
			->with( 'wp_head', 'wlwmanifest_link' );

		Monkey\Functions\expect( 'remove_action' )
			->atLeast()->once()
			->with( 'wp_head', 'wp_generator' );

		Monkey\Functions\expect( 'remove_action' )
			->atLeast()->once()
			->with( 'wp_head', 'wp_shortlink_wp_head', 10 );

		Monkey\Functions\expect( 'remove_action' )
			->atLeast()->once()
			->with( 'wp_head', 'rest_output_link_wp_head', 10 );

		Monkey\Functions\expect( 'remove_action' )
			->atLeast()->once()
			->with( 'template_redirect', 'rest_output_link_header', 11 );

		Monkey\Functions\expect( 'remove_action' )
			->atLeast()->once()
			->with( 'wp_head', 'wp_oembed_add_discovery_links' );

		Monkey\Functions\expect( 'remove_action' )
			->atLeast()->once()
			->with( 'wp_head', 'wp_oembed_add_host_js' );

		$component->cleanup_meta_tags();

		$this->assertTrue( true );
	}
}
