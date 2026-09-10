<?php
/**
 * WP_Rig\WP_Rig\Tests\Unit\Fonts\Component_Tests class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Tests\Unit\Fonts;

use WP_Rig\WP_Rig\Tests\Framework\Unit_Test_Case;
use Brain\Monkey\Functions;
use ReflectionMethod;
use WP_Rig\WP_Rig\Fonts\Component;

/**
 * Class unit-testing the Fonts component.
 *
 * Focus: the strict preload guard — only woff2 files shipped by this
 * component's own download pipeline (marked by the google-fonts.css
 * manifest) are preloaded. Files that came from other sources (e.g.
 * `rig:bake` Font Library exports under assets/fonts/<slug>/) must never be
 * preloaded.
 *
 * @group fonts
 */
class Component_Tests extends Unit_Test_Case {

	/**
	 * The fonts component instance.
	 *
	 * @var Component
	 */
	private $component;

	/**
	 * Preload method reflection (protected API).
	 *
	 * @var ReflectionMethod
	 */
	private $preload_method;

	/**
	 * Sets up the environment before each test.
	 */
	protected function setUp(): void {
		parent::setUp();

		$this->component     = new Component();
		$this->preload_method = new ReflectionMethod( Component::class, 'get_font_files_to_preload' );
		$this->preload_method->setAccessible( true );

		Functions\when( 'apply_filters' )->alias( static fn( $tag, $value = null ) => $value );
		Functions\when( 'sanitize_title' )->alias(
			static fn( $title ) => strtolower( (string) preg_replace( '/[^A-Za-z0-9]+/', '-', strtolower( (string) $title ) ) )
		);
	}

	/**
	 * Creates a fixture theme directory with optional font artifacts.
	 *
	 * @param array $options { shippedCss, familyDir, fileName }.
	 * @return string Fixture theme directory.
	 */
	private function createFontFixture( array $options = array() ): string {
		$dir = sys_get_temp_dir() . '/wprig-fonts-' . uniqid();
		mkdir( $dir . '/assets/fonts/inter', 0777, true );

		if ( ! empty( $options['shippedCss'] ) ) {
			mkdir( $dir . '/assets/css/src', 0777, true );
			file_put_contents( $dir . '/assets/css/src/google-fonts.css', '@font-face { font-family: Inter; }' );
		}

		if ( ! empty( $options['fileName'] ) ) {
			file_put_contents( $dir . '/assets/fonts/inter/' . $options['fileName'], 'wOF2' );
		}

		Functions\when( 'get_stylesheet_directory' )->justReturn( $dir );
		Functions\when( 'get_stylesheet_directory_uri' )->justReturn( 'http://tests.local/theme' );

		return $dir;
	}

	/**
	 * Cleans up a fixture directory.
	 *
	 * @param string $dir Fixture directory.
	 */
	private function removeFixture( string $dir ): void {
		if ( ! is_dir( $dir ) ) {
			return;
		}

		foreach ( array_diff( scandir( $dir ), array( '.', '..' ) ) as $entry ) {
			$path = $dir . '/' . $entry;

			if ( is_dir( $entry ) || is_dir( $path ) ) {
				$this->removeFixture( $path );
			} else {
				unlink( $path );
			}
		}

		rmdir( $dir );
	}

	/**
	 * Tests that the slug of the component is correct.
	 *
	 * @covers Component::get_slug()
	 */
	public function test_get_slug() {
		$this->assertSame( 'fonts', $this->component->get_slug() );
	}

	/**
	 * Tests that files under assets/fonts/ are NOT preloaded when the
	 * component's google-fonts.css manifest is absent (rig:bake Font Library
	 * exports land in the same directory and must not be preloaded).
	 *
	 * @covers Component::get_font_files_to_preload()
	 */
	public function test_does_not_preload_without_shipped_css_manifest() {
		$dir = $this->createFontFixture( array( 'fileName' => 'inter-300-normal.woff2' ) );

		try {
			$this->assertSame(
				array(),
				$this->preload_method->invoke( $this->component )
			);
		} finally {
			$this->removeFixture( $dir );
		}
	}

	/**
	 * Tests that woff2 files ARE preloaded once the component's own
	 * google-fonts.css manifest exists.
	 *
	 * @covers Component::get_font_files_to_preload()
	 */
	public function test_preloads_component_shipped_fonts() {
		$dir = $this->createFontFixture(
			array(
				'shippedCss' => true,
				'fileName'   => 'inter-300-normal.woff2',
			)
		);

		try {
			$preloads = $this->preload_method->invoke( $this->component );

			$this->assertCount( 1, $preloads );
			$this->assertStringContainsString(
				'assets/fonts/inter/inter-300-normal.woff2',
				$preloads[0]
			);
		} finally {
			$this->removeFixture( $dir );
		}
	}

	/**
	 * Tests that the built google-fonts.min.css also counts as the shipped
	 * marker (production lookup).
	 *
	 * @covers Component::get_font_files_to_preload()
	 */
	public function test_preloads_with_built_css_marker() {
		$dir = sys_get_temp_dir() . '/wprig-fonts-' . uniqid();
		mkdir( $dir . '/assets/fonts/inter', 0777, true );
		mkdir( $dir . '/assets/css', 0777, true );
		file_put_contents( $dir . '/assets/css/google-fonts.min.css', '@font-face{font-family:Inter}' );
		file_put_contents( $dir . '/assets/fonts/inter/inter-300-normal.woff2', 'wOF2' );
		Functions\when( 'get_stylesheet_directory' )->justReturn( $dir );
		Functions\when( 'get_stylesheet_directory_uri' )->justReturn( 'http://tests.local/theme' );

		try {
			$this->assertCount( 1, $this->preload_method->invoke( $this->component ) );
		} finally {
			$this->removeFixture( $dir );
		}
	}
}
