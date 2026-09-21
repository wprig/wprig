<?php
/**
 * WP_Rig\WP_Rig\Tests\Unit\Base_Support\Component_Tests class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Tests\Unit\Base_Support;

use WP_Rig\WP_Rig\Tests\Framework\Unit_Test_Case;
use Brain\Monkey\Functions;
use Mockery;
use WP_Rig\WP_Rig\Base_Support\Component;

/**
 * Class unit-testing the accessibility component.
 *
 * @group hooks
 */
class Component_Tests extends Unit_Test_Case {

	/**
	 * The accessibility component instance.
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
	 * @covers Component::get_slug()
	 */
	public function test_get_slug() {
		$this->assertSame( 'base_support', $this->component->get_slug() );
	}

	/**
	 * Tests that get_wp_rig_version() is exposed as a template tag.
	 *
	 * @covers Component::template_tags()
	 */
	public function test_template_tags_expose_wp_rig_version() {
		$this->assertArrayHasKey( 'get_wp_rig_version', $this->component->template_tags() );
	}

	/**
	 * Tests that the WP Rig framework version is read from the source-only file.
	 *
	 * @covers Component::get_wp_rig_version()
	 */
	public function test_get_wp_rig_version_reads_framework_file() {
		$dir = sys_get_temp_dir() . '/wprig-fw-' . uniqid();
		mkdir( $dir . '/config', 0777, true );
		file_put_contents( $dir . '/config/framework.json', '{"name":"wp-rig","version":"9.9.9"}' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents -- Test fixture.

		Functions\when( 'get_theme_file_path' )->alias(
			function ( $path ) use ( $dir ) {
				return $dir . '/' . ltrim( $path, '/' );
			}
		);

		$this->assertSame( '9.9.9', $this->component->get_wp_rig_version() );

		unlink( $dir . '/config/framework.json' );
		rmdir( $dir . '/config' );
		rmdir( $dir );
	}

	/**
	 * Tests that get_wp_rig_version() returns null in a built theme (file absent).
	 *
	 * @covers Component::get_wp_rig_version()
	 */
	public function test_get_wp_rig_version_returns_null_when_absent() {
		$dir = sys_get_temp_dir() . '/wprig-fw-' . uniqid();
		mkdir( $dir, 0777, true );

		Functions\when( 'get_theme_file_path' )->alias(
			function ( $path ) use ( $dir ) {
				return $dir . '/' . ltrim( $path, '/' );
			}
		);

		$this->assertNull( $this->component->get_wp_rig_version() );

		rmdir( $dir );
	}

	/**
	 * Tests that the component adds hooks correctly.
	 *
	 * @covers Component::initialize()
	 */
	public function test_initialize() {
		$this->component->initialize();

		$this->assertNotEquals( false, has_action( 'after_setup_theme', array( $this->component, 'action_essential_theme_support' ) ) );
		$this->assertNotEquals( false, has_filter( 'theme_scandir_exclusions', array( $this->component, 'filter_scandir_exclusions_for_optional_templates' ) ) );
	}

	/**
	 * Tests that essential theme support is added.
	 *
	 * @covers Component::action_essential_theme_support()
	 */
	public function test_action_essential_theme_support() {
		$features = array();

		Functions\when( 'add_theme_support' )->alias(
			function ( $feature, ...$args ) use ( &$features ) {
				$features[ $feature ] = $args;
			}
		);

		$this->component->action_essential_theme_support();

		$this->assertEqualSets(
			array(
				'html5',
				'responsive-embeds',
			),
			array_keys( $features )
		);
	}
}
