<?php
/**
 * WP_Rig\WP_Rig\Tests\Unit\Block_Patterns\Component_Test class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Tests\Unit\Block_Patterns;

use WP_Rig\WP_Rig\Tests\Framework\Unit_Test_Case;
use Brain\Monkey\Filters;
use Brain\Monkey\Functions;
use WP_Rig\WP_Rig\Block_Patterns\Component;

/**
 * Class unit-testing the Block Patterns registry component.
 *
 * @group block_patterns
 */
class Component_Test extends Unit_Test_Case {

	/**
	 * The Block Patterns component instance.
	 *
	 * @var Component
	 */
	private $component;

	/**
	 * Temporary theme root for directory-scanning tests.
	 *
	 * @var string
	 */
	private $temp_theme_root;

	/**
	 * Registered pattern categories, keyed by slug.
	 *
	 * @var array
	 */
	private $registered_categories = array();

	/**
	 * Registered pattern slugs.
	 *
	 * @var array
	 */
	private $registered_patterns = array();

	/**
	 * Sets up the environment before each test.
	 */
	protected function setUp(): void {
		parent::setUp();

		Functions\when( 'WP_Rig\WP_Rig\get_config' )->justReturn( array() );
		Functions\when( 'wp_parse_list' )->alias(
			static function ( $list ) {
				if ( is_array( $list ) ) {
					return $list;
				}
				return preg_split( '/\s*,\s*/', trim( (string) $list ), -1, PREG_SPLIT_NO_EMPTY );
			}
		);

		$this->component            = new Component();
		$this->registered_categories = array();
		$this->registered_patterns   = array();
		$this->temp_theme_root         = sys_get_temp_dir() . '/wprig-block-patterns-' . uniqid();

		Functions\expect( 'register_block_pattern_category' )
			->zeroOrMoreTimes()
			->andReturnUsing(
				function ( $slug, $properties ) {
					$this->registered_categories[ $slug ] = $properties['label'];
				}
			);

		Functions\expect( 'register_block_pattern' )
			->zeroOrMoreTimes()
			->andReturnUsing(
				function ( $slug, $properties ) {
					$this->registered_patterns[] = array( $slug, $properties );
				}
			);
	}

	/**
	 * Tears down the environment after each test.
	 */
	protected function tearDown(): void {
		if ( $this->temp_theme_root && is_dir( $this->temp_theme_root ) ) {
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
	 * Creates a pattern file inside the temporary theme root.
	 *
	 * @param string $relative_path Relative path under the theme root.
	 * @param string $contents      File contents.
	 */
	private function createFile( string $relative_path, string $contents ): void {
		$path = $this->temp_theme_root . '/' . ltrim( $relative_path, '/' );
		$dir  = dirname( $path );
		if ( ! is_dir( $dir ) ) {
			mkdir( $dir, 0777, true );
		}
		file_put_contents( $path, $contents ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents -- Test fixture helper.
	}

	/**
	 * Mocks get_file_data() to return headers derived from the file basename.
	 *
	 * @param array $files Map of basename => header overrides.
	 */
	private function mockFileData( array $files ): void {
		Functions\when( 'get_file_data' )->alias(
			function ( $file, $headers ) use ( $files ) {
				$basename = basename( (string) $file );
				$data     = array();

				foreach ( $headers as $property => $key ) {
					$data[ $property ] = $files[ $basename ][ $property ] ?? '';
				}

				return $data;
			}
		);
	}

	/**
	 * Tests that the slug of the component is correct.
	 *
	 * @covers \WP_Rig\WP_Rig\Block_Patterns\Component::get_slug()
	 */
	public function test_get_slug() {
		$this->assertSame( 'block_patterns', $this->component->get_slug() );
	}

	/**
	 * Tests that the component is active when themeType is block-based.
	 *
	 * @covers \WP_Rig\WP_Rig\Block_Patterns\Component::is_active()
	 */
	public function test_is_active_when_block_based() {
		Functions\when( 'WP_Rig\WP_Rig\get_config' )->justReturn(
			array(
				'theme' => array(
					'themeType' => 'block-based',
				),
			)
		);

		$this->assertTrue( Component::is_active() );
	}

	/**
	 * Tests that the component is active when themeType is universal.
	 *
	 * @covers \WP_Rig\WP_Rig\Block_Patterns\Component::is_active()
	 */
	public function test_is_active_when_universal() {
		Functions\when( 'WP_Rig\WP_Rig\get_config' )->justReturn(
			array(
				'theme' => array(
					'themeType' => 'universal',
				),
			)
		);

		$this->assertTrue( Component::is_active() );
	}

	/**
	 * Tests that the component is inactive when themeType is classic.
	 *
	 * @covers \WP_Rig\WP_Rig\Block_Patterns\Component::is_active()
	 */
	public function test_is_active_when_classic() {
		Functions\when( 'WP_Rig\WP_Rig\get_config' )->justReturn(
			array(
				'theme' => array(
					'themeType' => 'classic',
				),
			)
		);

		$this->assertFalse( Component::is_active() );
	}

	/**
	 * Tests that config-seeded categories are registered.
	 *
	 * @covers \WP_Rig\WP_Rig\Block_Patterns\Component::register_pattern_categories()
	 */
	public function test_register_pattern_categories_from_config() {
		Functions\when( 'WP_Rig\WP_Rig\get_config' )->justReturn(
			array(
				'patterns' => array(
					'categories' => array(
						'featured' => 'Featured',
						'hero'     => 'Hero',
					),
				),
			)
		);

		$this->component->register_pattern_categories();

		$this->assertSame(
			array(
				'featured' => 'Featured',
				'hero'     => 'Hero',
			),
			$this->registered_categories
		);
	}

	/**
	 * Tests that invalid category entries are skipped.
	 *
	 * @covers \WP_Rig\WP_Rig\Block_Patterns\Component::register_pattern_categories()
	 */
	public function test_register_pattern_categories_skips_invalid_entries() {
		Functions\when( 'WP_Rig\WP_Rig\get_config' )->justReturn(
			array(
				'patterns' => array(
					'categories' => array(
						'featured' => 'Featured',
						'broken'   => '',
						'bad-key'  => 42,
					),
				),
			)
		);

		$this->component->register_pattern_categories();

		$this->assertSame( array( 'featured' => 'Featured' ), $this->registered_categories );
	}

	/**
	 * Tests that the wprig_block_pattern_categories filter can extend categories.
	 *
	 * @covers \WP_Rig\WP_Rig\Block_Patterns\Component::register_pattern_categories()
	 */
	public function test_pattern_categories_are_filterable() {
		Functions\when( 'WP_Rig\WP_Rig\get_config' )->justReturn(
			array(
				'patterns' => array(
					'categories' => array(
						'featured' => 'Featured',
					),
				),
			)
		);

		Filters\expectApplied( 'wprig_block_pattern_categories' )
			->andReturn(
				array(
					'featured' => 'Featured',
					'custom'   => 'Custom',
				)
			);

		$this->component->register_pattern_categories();

		$this->assertSame(
			array(
				'featured' => 'Featured',
				'custom'   => 'Custom',
			),
			$this->registered_categories
		);
	}

	/**
	 * Tests that bundled component pattern directories are registered.
	 *
	 * @covers \WP_Rig\WP_Rig\Block_Patterns\Component::register_component_patterns()
	 * @covers \WP_Rig\WP_Rig\Block_Patterns\Component::get_component_pattern_directories()
	 */
	public function test_register_component_patterns_from_inc_directories() {
		Functions\when( 'get_stylesheet_directory' )->justReturn( $this->temp_theme_root );

		$this->createFile( 'inc/Foo/patterns/good.php', '<?php /** Title/Slug in header */' );
		$this->createFile( 'inc/Bar/patterns/other.php', '<?php /** Title/Slug in header */' );
		$this->createFile( 'inc/Baz/readme.txt', 'no patterns dir here' );

		$this->mockFileData(
			array(
				'good.php'  => array(
					'title'      => 'Good Pattern',
					'slug'       => 'test/good',
					'categories' => 'featured',
				),
				'other.php' => array(
					'title'      => 'Other Pattern',
					'slug'       => 'test/other',
				),
			)
		);

		$this->component->register_component_patterns();

		$this->assertCount( 2, $this->registered_patterns );

		$slugs = array_column( $this->registered_patterns, 0 );
		sort( $slugs );
		$this->assertSame( array( 'test/good', 'test/other' ), $slugs );

		$good = null;
		foreach ( $this->registered_patterns as $registration ) {
			if ( 'test/good' === $registration[0] ) {
				$good = $registration[1];
			}
		}

		$this->assertSame( array( 'featured' ), $good['categories'] );
		$this->assertSame( $this->temp_theme_root . '/inc/Foo/patterns/good.php', $good['filePath'] );
	}

	/**
	 * Tests that the wprig_block_patterns filter can add pattern directories.
	 *
	 * @covers \WP_Rig\WP_Rig\Block_Patterns\Component::register_component_patterns()
	 */
	public function test_component_patterns_directories_are_filterable() {
		Functions\when( 'get_stylesheet_directory' )->justReturn( $this->temp_theme_root );

		$external_dir = $this->temp_theme_root . '/external-patterns';
		$this->createFile( 'inc/Foo/patterns/good.php', '<?php /** */' );
		$this->createFile( 'external-patterns/filtered.php', '<?php /** */' );

		$this->mockFileData(
			array(
				'good.php'     => array(
					'title' => 'Good Pattern',
					'slug'  => 'test/good',
				),
				'filtered.php' => array(
					'title' => 'Filtered Pattern',
					'slug'  => 'test/filtered',
				),
			)
		);

		Filters\expectApplied( 'wprig_block_patterns' )
			->andReturn(
				array(
					$this->temp_theme_root . '/inc/Foo/patterns',
					$external_dir,
				)
			);

		$this->component->register_component_patterns();

		$slugs = array_column( $this->registered_patterns, 0 );
		sort( $slugs );
		$this->assertSame( array( 'test/filtered', 'test/good' ), $slugs );
	}
}
