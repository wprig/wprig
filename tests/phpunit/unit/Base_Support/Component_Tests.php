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
	protected function setUp() {
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
	 * Tests that the component adds hooks correctly.
	 *
	 * @covers Component::initialize()
	 */
	public function test_initialize() {
		$this->component->initialize();

		$this->assertNotEquals( false, has_action( 'after_setup_theme', array( $this->component, 'action_essential_theme_support' ) ) );
		$this->assertNotEquals( false, has_action( 'wp_head', array( $this->component, 'action_add_pingback_header' ) ) );
		$this->assertNotEquals( false, has_filter( 'body_class', array( $this->component, 'filter_body_classes_add_hfeed' ) ) );
		$this->assertNotEquals( false, has_filter( 'embed_defaults', array( $this->component, 'filter_embed_dimensions' ) ) );
		$this->assertNotEquals( false, has_filter( 'theme_scandir_exclusions', array( $this->component, 'filter_scandir_exclusions_for_optional_templates' ) ) );
		$this->assertNotEquals( false, has_filter( 'script_loader_tag', array( $this->component, 'filter_script_loader_tag' ) ) );
	}

	/**
	 * Tests that the correct template tags are exposed.
	 *
	 * @covers Component::template_tags()
	 */
	public function test_template_tags() {
		$tags = $this->component->template_tags();

		$this->assertEqualSetsWithIndex(
			array(
				'get_version'       => array( $this->component, 'get_version' ),
				'get_asset_version' => array( $this->component, 'get_asset_version' ),
			),
			$tags
		);
	}

	/**
	 * Tests that essential theme support is added.
	 *
	 * @covers Component::action_essential_theme_support()
	 */
	public function test_action_essential_theme_support() {
		$features = array();

		Functions\when( 'add_theme_support' )->alias(
			function( $feature, ...$args ) use ( &$features ) {
				$features[ $feature ] = $args;
			}
		);

		$this->component->action_essential_theme_support();

		$this->assertEqualSets(
			array(
				'automatic-feed-links',
				'title-tag',
				'html5',
				'customize-selective-refresh-widgets',
				'responsive-embeds',
			),
			array_keys( $features )
		);
	}
}
