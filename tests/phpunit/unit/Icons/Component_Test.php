<?php
/**
 * WP_Rig\WP_Rig\Tests\Unit\Icons\Component_Test class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Tests\Unit\Icons;

use Brain\Monkey\Actions;
use Brain\Monkey\Filters;
use Brain\Monkey\Functions;
use WP_Rig\WP_Rig\Tests\Framework\Unit_Test_Case;
use WP_Rig\WP_Rig\Icons\Component;

/**
 * Tests the Icons component, including native Icon API registration and the
 * wprig_icon() bridge that prefers wp_get_icon() when an icon is registered.
 *
 * @group icons
 */
class Component_Test extends Unit_Test_Case {

	/**
	 * The component under test.
	 *
	 * @var Component
	 */
	protected Component $component;

	/**
	 * Temporary theme root used for directory-scanning tests.
	 *
	 * @var string
	 */
	private string $temp_theme_root = '';

	/**
	 * Sets up the component instance.
	 */
	protected function setUp(): void {
		parent::setUp();

		Functions\when( 'wp_json_encode' )->alias(
			static function ( $data ) {
				return json_encode( $data );
			}
		);

		$this->component       = new Component();
		$this->temp_theme_root = sys_get_temp_dir() . '/wprig-icons-' . uniqid();
	}

	/**
	 * Tears down the temporary theme root.
	 */
	protected function tearDown(): void {
		if ( '' !== $this->temp_theme_root && is_dir( $this->temp_theme_root ) ) {
			$this->removeDirectory( $this->temp_theme_root );
		}

		parent::tearDown();
	}

	/**
	 * Recursively removes a directory.
	 *
	 * @param string $dir Directory path.
	 */
	private function removeDirectory( string $dir ): void {
		if ( ! is_dir( $dir ) ) {
			return;
		}

		$items = glob( $dir . '/*' );
		if ( ! is_array( $items ) ) {
			$items = array();
		}

		foreach ( $items as $item ) {
			if ( is_dir( $item ) ) {
				$this->removeDirectory( $item );
			} else {
				unlink( $item );
			}
		}

		rmdir( $dir );
	}

	/**
	 * Creates an SVG file inside a temporary theme root.
	 *
	 * @param string $root     Theme root.
	 * @param string $relative Relative path under the theme root.
	 * @param string $contents File contents.
	 */
	private function createIconFile( string $root, string $relative, string $contents ): void {
		$path = $root . '/' . ltrim( $relative, '/' );
		$dir  = dirname( $path );

		if ( ! is_dir( $dir ) ) {
			mkdir( $dir, 0777, true );
		}

		file_put_contents( $path, $contents ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents -- Test fixture helper.
	}

	/**
	 * Tests that the slug of the component is correct.
	 *
	 * @covers \WP_Rig\WP_Rig\Icons\Component::get_slug()
	 */
	public function test_get_slug() {
		$this->assertSame( 'icons', $this->component->get_slug() );
	}

	/**
	 * Tests wprig_icon() falls back to the theme asset when the native Icon API
	 * is not available (classic behavior).
	 *
	 * @covers \WP_Rig\WP_Rig\Icons\Component::wprig_icon()
	 * @covers \WP_Rig\WP_Rig\Icons\Component::get_native_icon()
	 */
	public function test_wprig_icon_falls_back_to_theme_asset() {
		$tags = $this->mockTemplateTags( array( 'get_theme_asset' ) );
		$tags->expects( $this->once() )
			->method( 'get_theme_asset' )
			->with( 'check.svg', 'icons', true )
			->willReturn( '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>' );

		$output = $this->component->wprig_icon( 'check' );

		$this->assertStringContainsString( '<svg', $output );
		$this->assertStringContainsString( 'aria-hidden="true"', $output );
	}

	/**
	 * Tests get_native_icon() returns null when the WP 7.1 Icon API is not
	 * loaded (so wprig_icon() always falls back safely).
	 *
	 * @covers \WP_Rig\WP_Rig\Icons\Component::get_native_icon()
	 */
	public function test_get_native_icon_returns_null_without_native_api() {
		$method = new \ReflectionMethod( Component::class, 'get_native_icon' );
		$method->setAccessible( true );

		$this->assertNull(
			$method->invoke(
				$this->component,
				'check',
				array(
					'class'      => '',
					'aria_label' => '',
				)
			)
		);
	}

	/**
	 * Tests wprig_icon() prefers a natively registered icon over the theme file.
	 *
	 * @covers \WP_Rig\WP_Rig\Icons\Component::wprig_icon()
	 * @covers \WP_Rig\WP_Rig\Icons\Component::get_native_icon()
	 */
	public function test_wprig_icon_prefers_native_icon() {
		$tags = $this->mockTemplateTags( array( 'get_theme_asset' ) );
		$tags->expects( $this->never() )->method( 'get_theme_asset' );

		Functions\expect( 'wp_get_icon' )
			->once()
			->with(
				'wprig-icons/check',
				array(
					'class' => 'foo',
					'label' => '',
				)
			)
			->andReturn( '<svg class="foo" aria-hidden="true"><path d="M0 0"/></svg>' );

		$output = $this->component->wprig_icon( 'check', array( 'class' => 'foo' ) );

		$this->assertStringContainsString( 'class="foo"', $output );
		$this->assertStringContainsString( '<path', $output );
	}

	/**
	 * Tests register_icon_collection() no-ops on WordPress versions without the
	 * Icon API, leaving the page untouched.
	 *
	 * @covers \WP_Rig\WP_Rig\Icons\Component::register_icon_collection()
	 */
	public function test_register_icon_collection_noops_without_native_api() {
		Actions\expectDone( 'wp_rig_log' )->never();

		$this->component->register_icon_collection();

		$this->assertFalse( function_exists( 'wp_register_icon_collection' ) );
	}

	/**
	 * Tests the collection and every discovered icon are registered natively.
	 *
	 * @covers \WP_Rig\WP_Rig\Icons\Component::register_icon_collection()
	 * @covers \WP_Rig\WP_Rig\Icons\Component::get_icon_files()
	 * @covers \WP_Rig\WP_Rig\Icons\Component::read_icon_svg()
	 * @covers \WP_Rig\WP_Rig\Icons\Component::humanize()
	 */
	public function test_register_icon_collection_registers_icons() {
		$this->createIconFile(
			$this->temp_theme_root,
			'assets/icons/arrow-right.svg',
			'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M4 12h16"/></svg>'
		);
		$this->createIconFile(
			$this->temp_theme_root,
			'assets/icons/star.svg',
			'<svg viewBox="0 0 24 24"><polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9"/></svg>'
		);

		Functions\when( 'get_template_directory' )->justReturn( $this->temp_theme_root );
		Functions\when( 'get_stylesheet_directory' )->justReturn( $this->temp_theme_root );

		$collections = array();
		$icons       = array();

		Functions\expect( 'wp_register_icon_collection' )
			->once()
			->andReturnUsing(
				function ( $slug, $args ) use ( &$collections ) {
					$collections[ $slug ] = $args;
					return true;
				}
			);

		Functions\expect( 'wp_register_icon' )
			->twice()
			->andReturnUsing(
				function ( $name, $args ) use ( &$icons ) {
					$icons[ $name ] = $args;
					return true;
				}
			);

		$this->component->register_icon_collection();

		$this->assertArrayHasKey( 'wprig-icons', $collections );
		$this->assertSame( 'WP Rig Icons', $collections['wprig-icons']['label'] );

		$this->assertArrayHasKey( 'wprig-icons/arrow-right', $icons );
		$this->assertSame( 'Arrow Right', $icons['wprig-icons/arrow-right']['label'] );
		$this->assertStringContainsString( '<path', $icons['wprig-icons/arrow-right']['content'] );
		$this->assertStringNotContainsString( 'width=', $icons['wprig-icons/arrow-right']['content'] );

		$this->assertArrayHasKey( 'wprig-icons/star', $icons );
		$this->assertStringContainsString( '<polygon', $icons['wprig-icons/star']['content'] );
	}

	/**
	 * Tests registration can be disabled via the opt-out filter.
	 *
	 * @covers \WP_Rig\WP_Rig\Icons\Component::register_icon_collection()
	 */
	public function test_register_icon_collection_respects_opt_out_filter() {
		Functions\when( 'get_template_directory' )->justReturn( $this->temp_theme_root );
		Functions\when( 'get_stylesheet_directory' )->justReturn( $this->temp_theme_root );

		Filters\expectApplied( 'wp_rig_icons_register_collection' )
			->once()
			->andReturn( false );

		Functions\expect( 'wp_register_icon_collection' )->never();
		Functions\expect( 'wp_register_icon' )->never();

		$this->component->register_icon_collection();

		$this->addToAssertionCount( 1 );
	}

	/**
	 * Tests icons using primitives core strips (rect, circle, line, …) are
	 * skipped rather than registered as blank icons.
	 *
	 * @covers \WP_Rig\WP_Rig\Icons\Component::register_icon_collection()
	 * @covers \WP_Rig\WP_Rig\Icons\Component::read_icon_svg()
	 */
	public function test_register_icon_collection_skips_incompatible_icons() {
		$this->createIconFile(
			$this->temp_theme_root,
			'assets/icons/square.svg',
			'<svg viewBox="0 0 24 24"><rect width="24" height="24"/></svg>'
		);

		Functions\when( 'get_template_directory' )->justReturn( $this->temp_theme_root );
		Functions\when( 'get_stylesheet_directory' )->justReturn( $this->temp_theme_root );

		Functions\when( 'wp_register_icon_collection' )->justReturn( true );

		Actions\expectDone( 'wp_rig_log' )->once();
		Functions\expect( 'wp_register_icon' )->never();

		$this->component->register_icon_collection();

		$this->addToAssertionCount( 1 );
	}

	/**
	 * Tests a child theme icon overrides a parent theme icon of the same name.
	 *
	 * @covers \WP_Rig\WP_Rig\Icons\Component::get_icon_files()
	 */
	public function test_register_icon_collection_child_theme_overrides_parent() {
		$parent_root = $this->temp_theme_root . '-parent';
		$child_root  = $this->temp_theme_root . '-child';

		$this->createIconFile( $parent_root, 'assets/icons/check.svg', '<svg viewBox="0 0 24 24"><path d="M1 1"/></svg>' );
		$this->createIconFile( $child_root, 'assets/icons/check.svg', '<svg viewBox="0 0 24 24"><path d="M2 2"/></svg>' );

		Functions\when( 'get_template_directory' )->justReturn( $parent_root );
		Functions\when( 'get_stylesheet_directory' )->justReturn( $child_root );

		Functions\when( 'wp_register_icon_collection' )->justReturn( true );

		$icons = array();
		Functions\expect( 'wp_register_icon' )
			->once()
			->andReturnUsing(
				function ( $name, $args ) use ( &$icons ) {
					$icons[ $name ] = $args;
					return true;
				}
			);

		$this->component->register_icon_collection();

		$this->assertArrayHasKey( 'wprig-icons/check', $icons );
		$this->assertStringContainsString( 'M2 2', $icons['wprig-icons/check']['content'] );

		$this->removeDirectory( $parent_root );
		$this->removeDirectory( $child_root );
	}

	/**
	 * Tests that passing aria_label implies the icon is announced: aria_hidden
	 * defaults to false unless the caller set it explicitly.
	 *
	 * @covers \WP_Rig\WP_Rig\Icons\Component::wprig_icon()
	 */
	public function test_wprig_icon_aria_label_implies_not_hidden_by_default() {
		// Force the theme-asset fallback path (no native icon).
		Functions\when( 'wp_get_icon' )->justReturn( '' );
		$tags = $this->mockTemplateTags( array( 'get_theme_asset' ) );
		$tags->method( 'get_theme_asset' )->willReturn(
			'<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>'
		);

		$output = $this->component->wprig_icon( 'check', array( 'aria_label' => 'Close' ) );

		$this->assertStringContainsString( 'aria-label="Close"', $output );
		$this->assertStringNotContainsString( 'aria-hidden', $output );
	}

	/**
	 * Tests that an explicit aria_hidden=true wins over the aria_label
	 * implication (caller's explicit choice is respected).
	 *
	 * @covers \WP_Rig\WP_Rig\Icons\Component::wprig_icon()
	 */
	public function test_wprig_icon_explicit_aria_hidden_wins() {
		Functions\when( 'wp_get_icon' )->justReturn( '' );
		$tags = $this->mockTemplateTags( array( 'get_theme_asset' ) );
		$tags->method( 'get_theme_asset' )->willReturn(
			'<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>'
		);

		$output = $this->component->wprig_icon(
			'check',
			array(
				'aria_label'  => 'Close',
				'aria_hidden' => true,
			)
		);

		$this->assertStringContainsString( 'aria-label="Close"', $output );
		$this->assertStringContainsString( 'aria-hidden="true"', $output );
	}

	/**
	 * Tests that prepending a class to a single-quoted SVG class attribute
	 * does not produce a duplicate class attribute.
	 *
	 * @covers \WP_Rig\WP_Rig\Icons\Component::wprig_icon()
	 */
	public function test_wprig_icon_single_quoted_class_attribute() {
		Functions\when( 'wp_get_icon' )->justReturn( '' );
		$tags = $this->mockTemplateTags( array( 'get_theme_asset' ) );
		$tags->method( 'get_theme_asset' )->willReturn(
			"<svg class='base' xmlns='http://www.w3.org/2000/svg'><path d='M0 0'/></svg>"
		);

		$output = $this->component->wprig_icon( 'check', array( 'class' => 'big' ) );

		$this->assertSame( 1, substr_count( $output, 'class=' ) );
		$this->assertStringContainsString( 'big', $output );
		$this->assertStringContainsString( 'base', $output );
	}
}
