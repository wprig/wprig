<?php
/**
 * WP_Rig\WP_Rig\Tests\Unit\Styles\Component_Test class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Tests\Unit\Styles;

use WP_Rig\WP_Rig\Tests\Framework\Unit_Test_Case;
use Brain\Monkey\Functions;
use WP_Rig\WP_Rig\Styles\Component;
use ReflectionMethod;

/**
 * Class unit-testing the Styles component.
 *
 * @group styles
 */
class Component_Test extends Unit_Test_Case {

	/**
	 * The Styles component instance.
	 *
	 * @var Component
	 */
	private $component;

	/**
	 * Sets up the environment before each test.
	 */
	protected function setUp(): void {
		parent::setUp();

		Functions\when( 'get_theme_file_uri' )->justReturn( 'http://example.com/wp-content/themes/wprig/assets/css/' );
		Functions\when( 'get_theme_file_path' )->justReturn( '/path/to/assets/css/' );

		$this->component = new Component();
		$this->component->initialize();

		Functions\when( 'WP_Rig\WP_Rig\wp_rig' )->justReturn(
			new class() {
				/**
				 * Mocks get_asset_file.
				 *
				 * @param string $file File name.
				 * @param string $type Asset type.
				 * @return string File name.
				 */
				public function get_asset_file( string $file, string $type ): string {
					return $file;
				}

				/**
				 * Mocks get_asset_version.
				 *
				 * @param string $file File path.
				 * @return string Version.
				 */
				public function get_asset_version( string $file ): string {
					return '1.0.0';
				}
			}
		);

		Functions\when( 'WP_Rig\WP_Rig\wp_rig_theme' )->justReturn(
			new class() {
				/**
				 * Mocks get_asset_manifests.
				 *
				 * @param string $type Asset type.
				 * @return array Empty manifests array.
				 */
				public function get_asset_manifests( string $type ): array {
					return array();
				}
			}
		);
	}

	/**
	 * Tests that the slug of the component is correct.
	 *
	 * @covers \WP_Rig\WP_Rig\Styles\Component::get_slug()
	 */
	public function test_get_slug() {
		$this->assertSame( 'styles', $this->component->get_slug() );
	}

	/**
	 * Tests that sidebar CSS handles are excluded when themeType is block-based.
	 *
	 * @covers \WP_Rig\WP_Rig\Styles\Component::get_css_files()
	 */
	public function test_get_css_files_when_block_based() {
		Functions\when( 'WP_Rig\WP_Rig\get_config' )->justReturn(
			array(
				'theme' => array(
					'themeType' => 'block-based',
				),
			)
		);

		$reflection = new ReflectionMethod( $this->component, 'get_css_files' );
		$reflection->setAccessible( true );
		$css_files = $reflection->invoke( $this->component );

		$this->assertArrayNotHasKey( 'wp-rig-sidebar', $css_files );
		$this->assertArrayNotHasKey( 'wp-rig-widgets', $css_files );
	}

	/**
	 * Tests that sidebar CSS handles are included when themeType is classic.
	 *
	 * @covers \WP_Rig\WP_Rig\Styles\Component::get_css_files()
	 */
	public function test_get_css_files_when_classic() {
		Functions\when( 'WP_Rig\WP_Rig\get_config' )->justReturn(
			array(
				'theme' => array(
					'themeType' => 'classic',
				),
			)
		);

		$reflection = new ReflectionMethod( $this->component, 'get_css_files' );
		$reflection->setAccessible( true );
		$css_files = $reflection->invoke( $this->component );

		$this->assertArrayHasKey( 'wp-rig-sidebar', $css_files );
		$this->assertArrayHasKey( 'wp-rig-widgets', $css_files );
	}
}
