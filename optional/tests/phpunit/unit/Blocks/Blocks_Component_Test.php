<?php
/**
 * WP Rig Blocks_Component_Test class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Tests\Unit\Blocks;

use WP_Rig\WP_Rig\Blocks\Component;
use PHPUnit\Framework\TestCase;
use Brain\Monkey;

/**
 * Class unit-testing the Blocks component.
 *
 * @group blocks
 */
class Blocks_Component_Test extends TestCase {

	/**
	 * Sets up the test environment.
	 */
	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
		$GLOBALS['wp_register_block_types_from_metadata_collection_calls'] = array();
		$GLOBALS['wp_register_block_metadata_collection_calls']            = array();
		$GLOBALS['register_block_type_from_metadata_calls']                = array();
	}

	/**
	 * Tears down the test environment.
	 */
	protected function tearDown(): void {
		Monkey\tearDown();
		unset( $GLOBALS['wp_register_block_types_from_metadata_collection_calls'] );
		unset( $GLOBALS['wp_register_block_metadata_collection_calls'] );
		unset( $GLOBALS['register_block_type_from_metadata_calls'] );
		parent::tearDown();
	}

	/**
	 * Tests that the component returns the correct slug.
	 */
	public function test_get_slug() {
		$component = new Component();
		$this->assertEquals( 'blocks', $component->get_slug() );
	}

	/**
	 * Tests that the component registers blocks using the modern WP 6.8+ batch API
	 * if the function exists and the manifest file is present.
	 */
	public function test_register_blocks_modern() {
		$component = new Component();

		// Mock WordPress path functions to point to the actual theme directory.
		$theme_root = dirname( dirname( dirname( dirname( __DIR__ ) ) ) );

		Monkey\Functions\expect( 'get_stylesheet_directory' )
			->atLeast()->once()
			->andReturn( $theme_root );

		Monkey\Functions\expect( 'get_stylesheet_directory_uri' )
			->atLeast()->once()
			->andReturn( 'http://example.com' );

		$component->register_blocks();

		// Verify that the modern function was called exactly once with expected arguments.
		$this->assertCount( 1, $GLOBALS['wp_register_block_types_from_metadata_collection_calls'] );
		$this->assertEquals( $theme_root . '/assets/blocks', $GLOBALS['wp_register_block_types_from_metadata_collection_calls'][0][0] );
		$this->assertEquals( $theme_root . '/assets/blocks/blocks-manifest.php', $GLOBALS['wp_register_block_types_from_metadata_collection_calls'][0][1] );
	}
}
