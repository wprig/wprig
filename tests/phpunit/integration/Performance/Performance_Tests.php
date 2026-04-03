<?php
/**
 * WP Rig Performance_Tests integration test class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Tests\Integration\Performance;

use WP_Rig\WP_Rig\Tests\Framework\Integration_Test_Case;
use WP_Rig\WP_Rig\Performance\Component as Performance_Component;
use WP_Rig\WP_Rig\Asset_Provider;
use function WP_Rig\WP_Rig\wp_rig_theme;

/**
 * Class integration-testing the performance features.
 *
 * @group performance
 */
class Performance_Tests extends Integration_Test_Case {

	/**
	 * Tests that the performance component is present.
	 */
	public function test_performance_component_registered() {
		$theme     = wp_rig_theme();
		$component = $theme->component( 'performance' );
		$this->assertInstanceOf( Performance_Component::class, $component );
	}

	/**
	 * Tests that the emoji cleanup works.
	 */
	public function test_emoji_cleanup() {
		$theme     = wp_rig_theme();
		$component = $theme->component( 'performance' );
		$component->cleanup_emojis();

		$this->assertFalse( has_action( 'wp_head', 'print_emoji_detection_script' ) );
		$this->assertFalse( has_action( 'admin_print_scripts', 'print_emoji_detection_script' ) );
		$this->assertFalse( has_action( 'wp_print_styles', 'print_emoji_styles' ) );
		$this->assertFalse( has_action( 'admin_print_styles', 'print_emoji_styles' ) );
	}

	/**
	 * Tests manifest aggregation in Styles component.
	 */
	public function test_styles_manifest_aggregation() {
		$theme            = wp_rig_theme();
		$styles_component = $theme->component( 'styles' );

		// Use reflection to access protected method get_css_files.
		$reflection = new \ReflectionClass( $styles_component );
		$method     = $reflection->getMethod( 'get_css_files' );
		$method->setAccessible( true );
		$css_files = $method->invoke( $styles_component );

		// Check if header-navigation critical styles are present.
		$this->assertArrayHasKey( 'wp-rig-header-navigation-critical', $css_files );
		$this->assertEquals( 'cookie-critical', $css_files['wp-rig-header-navigation-critical']['strategy'] );
	}

	/**
	 * Tests manifest aggregation in Scripts component.
	 */
	public function test_scripts_manifest_aggregation() {
		$theme             = wp_rig_theme();
		$scripts_component = $theme->component( 'scripts' );

		// Use reflection to access protected method get_js_files.
		$reflection = new \ReflectionClass( $scripts_component );
		$method     = $reflection->getMethod( 'get_js_files' );
		$method->setAccessible( true );
		$js_files = $method->invoke( $scripts_component );

		// Check if navigation script is present.
		$this->assertArrayHasKey( 'wp-rig-navigation', $js_files );
		$this->assertEquals( 'async', $js_files['wp-rig-navigation']['strategy'] );
	}
}
