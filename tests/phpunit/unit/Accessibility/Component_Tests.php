<?php
/**
 * WP_Rig\WP_Rig\Tests\Unit\Accessibility\Component_Tests class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Tests\Unit\Accessibility;

use phpDocumentor\Reflection\Types\Object_;
use WP_Rig\WP_Rig\Tests\Framework\Unit_Test_Case;
use Brain\Monkey\Functions;
use Mockery;
use WP_Rig\WP_Rig\Accessibility\Component;

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
	 * WP_Post mock object.
	 *
	 * @var Object
	 */
	public $mock_post;

	/**
	 * Sets up the environment before each test.
	 */
	protected function setUp(): void {
		parent::setUp();

		$this->component = new Component();
		$this->mock_post = $this->getMockBuilder( \WP_Post::class )
								->disableOriginalConstructor()
								->getMock();
	}

	/**
	 * Tests that the slug of the component is correct.
	 *
	 * @covers Component::get_slug()
	 */
	public function test_get_slug() {
		$this->assertSame( 'accessibility', $this->component->get_slug() );
	}

	/**
	 * Tests that the component adds hooks correctly.
	 *
	 * @covers Component::initialize()
	 */
	public function test_initialize() {
		$this->component->initialize();
		$this->mock_post = $this->getMockBuilder( 'WP_Post' );

		$this->assertNotEquals( false, has_action( 'wp_enqueue_scripts', array( $this->component, 'action_enqueue_navigation_script' ) ) );
		$this->assertNotEquals( false, has_action( 'wp_print_footer_scripts', array( $this->component, 'action_print_skip_link_focus_fix' ) ) );
		$this->assertNotEquals( false, has_filter( 'nav_menu_link_attributes', array( $this->component, 'filter_nav_menu_link_attributes_aria_current' ) ) );
		$this->assertNotEquals( false, has_filter( 'page_menu_link_attributes', array( $this->component, 'filter_nav_menu_link_attributes_aria_current' ) ) );
	}

	/**
	 * Tests enqueueing the navigation script.
	 *
	 * @covers Component::action_enqueue_navigation_script()
	 */
	public function test_action_enqueue_navigation_script() {
		$template_tags = $this->mockTemplateTags( array( 'get_asset_version' ) );

		$template_tags->expects( $this->once() )
			->method( 'get_asset_version' )
			->will( $this->returnValue( '2.0.1' ) );

		Functions\when( 'get_theme_file_uri' )->returnArg();
		Functions\when( 'get_theme_file_path' )->returnArg();

		Functions\expect( 'wp_enqueue_script' )
			->with( 'wp-rig-navigation', Mockery::any(), Mockery::any(), Mockery::any(), Mockery::any() )
			->once();

		Functions\expect( 'wp_script_add_data' )
			->with( 'wp-rig-navigation', 'async', true )
			->twice();

		Functions\expect( 'wp_localize_script' )
			->with( 'wp-rig-navigation', Mockery::any(), Mockery::any() )
			->once();

		$this->component->action_enqueue_navigation_script();
	}


	/**
	 * Tests printing the skip-link-focus-fix script inline.
	 *
	 * @covers Component::action_print_skip_link_focus_fix()
	 */
	public function test_action_print_skip_link_focus_fix() {

		ob_start();
		$this->component->action_print_skip_link_focus_fix();
		$output = ob_get_clean();

		$this->assertTrue( false !== strpos( $output, '<script>' ) );
	}


	/**
	 * Tests that an aria-current attribute is not added unconditionally.
	 *
	 * @covers Component::filter_nav_menu_link_attributes_aria_current()
	 */
	public function test_filter_nav_menu_link_attributes_aria_current() {
		$atts = array();
		$item = $this->mock_post;
		$atts = $this->component->filter_nav_menu_link_attributes_aria_current( $atts, $item );
		$this->assertEmpty( $atts );
	}

	/**
	 * Tests that an aria-current attribute is added for the current menu item.
	 *
	 * @covers Component::filter_nav_menu_link_attributes_aria_current()
	 */
	public function test_filter_nav_menu_link_attributes_aria_current_with_current_item() {
		$atts          = array();
		$item          = $this->mock_post;
		$item->current = true;

		$atts = $this->component->filter_nav_menu_link_attributes_aria_current( $atts, $item );
		$this->assertArrayHasKey( 'aria-current', $atts );
	}

	/**
	 * Tests that an aria-current attribute is added for the current post.
	 *
	 * @covers Component::filter_nav_menu_link_attributes_aria_current()
	 */
	public function test_filter_nav_menu_link_attributes_aria_current_with_current_post() {
		$atts     = array();
		$item     = $this->mock_post;
		$item->ID = 1;

		$GLOBALS['post'] = $item; // phpcs:ignore WordPress.WP.GlobalVariablesOverride

		$atts = $this->component->filter_nav_menu_link_attributes_aria_current( $atts, $item );

		unset( $GLOBALS['post'] );

		$this->assertArrayHasKey( 'aria-current', $atts );
	}
}
