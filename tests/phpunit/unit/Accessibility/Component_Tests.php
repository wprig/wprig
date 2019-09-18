<?php
/**
 * WP_Rig\WP_Rig\Tests\Unit\Accessibility\Component_Tests class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Tests\Unit\Accessibility;

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
	 * Sets up the environment before each test.
	 */
	public function setUp() {
		parent::setUp();

		$this->component = new Component();
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

		$this->assertTrue( has_action( 'wp_enqueue_scripts', [ $this->component, 'action_enqueue_navigation_script' ] ) );
		$this->assertTrue( has_action( 'wp_print_footer_scripts', [ $this->component, 'action_print_skip_link_focus_fix' ] ) );
		$this->assertTrue( has_filter( 'nav_menu_link_attributes', [ $this->component, 'filter_nav_menu_link_attributes_aria_current' ] ) );
		$this->assertTrue( has_filter( 'page_menu_link_attributes', [ $this->component, 'filter_nav_menu_link_attributes_aria_current' ] ) );
	}

	/**
	 * Tests enqueueing the navigation script.
	 *
	 * @covers Component::action_enqueue_navigation_script()
	 */
	public function test_action_enqueue_navigation_script() {
		$template_tags = $this->mockTemplateTags( [ 'is_amp', 'get_asset_version' ] );

		$template_tags->expects( $this->once() )
			->method( 'is_amp' )
			->will( $this->returnValue( false ) );

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
			->once();

		Functions\expect( 'wp_localize_script' )
			->with( 'wp-rig-navigation', Mockery::any(), Mockery::any() )
			->once();

		$this->component->action_enqueue_navigation_script();
	}

	/**
	 * Tests enqueueing the navigation script, with AMP active.
	 *
	 * @covers Component::action_enqueue_navigation_script()
	 */
	public function test_action_enqueue_navigation_script_with_amp() {
		$template_tags = $this->mockTemplateTags( [ 'is_amp', 'get_asset_version' ] );

		$template_tags->expects( $this->once() )
			->method( 'is_amp' )
			->will( $this->returnValue( true ) );

		$template_tags->expects( $this->never() )
			->method( 'get_asset_version' );

		Functions\expect( 'wp_enqueue_script' )
			->never();

		$this->component->action_enqueue_navigation_script();
	}

	/**
	 * Tests printing the skip-link-focus-fix script inline.
	 *
	 * @covers Component::action_print_skip_link_focus_fix()
	 */
	public function test_action_print_skip_link_focus_fix() {
		$template_tags = $this->mockTemplateTags( [ 'is_amp' ] );

		$template_tags->expects( $this->once() )
			->method( 'is_amp' )
			->will( $this->returnValue( false ) );

		ob_start();
		$this->component->action_print_skip_link_focus_fix();
		$output = ob_get_clean();

		$this->assertTrue( false !== strpos( $output, '<script>' ) );
	}

	/**
	 * Tests printing the skip-link-focus-fix script inline, with AMP active.
	 *
	 * @covers Component::action_print_skip_link_focus_fix()
	 */
	public function test_action_print_skip_link_focus_fix_with_amp() {
		$template_tags = $this->mockTemplateTags( [ 'is_amp' ] );

		$template_tags->expects( $this->once() )
			->method( 'is_amp' )
			->will( $this->returnValue( true ) );

		ob_start();
		$this->component->action_print_skip_link_focus_fix();
		$output = ob_get_clean();

		$this->assertEmpty( $output );
	}

	/**
	 * Tests that an aria-current attribute is not added unconditionally.
	 *
	 * @covers Component::filter_nav_menu_link_attributes_aria_current()
	 */
	public function test_filter_nav_menu_link_attributes_aria_current() {
		$atts = [];
		$item = $this->getMockBuilder( 'WP_Post' )->getMock();

		$atts = $this->component->filter_nav_menu_link_attributes_aria_current( $atts, $item );
		$this->assertEmpty( $atts );
	}

	/**
	 * Tests that an aria-current attribute is added for the current menu item.
	 *
	 * @covers Component::filter_nav_menu_link_attributes_aria_current()
	 */
	public function test_filter_nav_menu_link_attributes_aria_current_with_current_item() {
		$atts          = [];
		$item          = $this->getMockBuilder( 'WP_Post' )->getMock();
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
		$atts     = [];
		$item     = $this->getMockBuilder( 'WP_Post' )->getMock();
		$item->ID = 1;

		$GLOBALS['post'] = $item; // phpcs:ignore WordPress.WP.GlobalVariablesOverride

		$atts = $this->component->filter_nav_menu_link_attributes_aria_current( $atts, $item );

		unset( $GLOBALS['post'] );

		$this->assertArrayHasKey( 'aria-current', $atts );
	}
}
