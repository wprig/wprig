<?php
/**
 * WP Rig Theme_Support_Tests integration test class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Tests\Integration;

use WP_Rig\WP_Rig\Tests\Framework\Integration_Test_Case;

/**
 * Class integration-testing the theme support features.
 *
 * @group hooks
 */
class Theme_Support_Tests extends Integration_Test_Case {

	/**
	 * Tests that the theme support features are present.
	 *
	 * @param string $feature Theme support feature.
	 *
	 * @dataProvider data_theme_support_features
	 */
	public function test_theme_support_features( string $feature ) {
		$this->assertTrue( current_theme_supports( $feature ) );
	}

	/**
	 * Gets the theme feature names to test for.
	 *
	 * @return array List of test datasets.
	 */
	public function data_theme_support_features() : array {
		return array(
			array(
				'automatic-feed-links',
			),
			array(
				'title-tag',
			),
			array(
				'post-thumbnails',
			),
			array(
				'html5',
			),
			array(
				'custom-background',
			),
			array(
				'customize-selective-refresh-widgets',
			),
			array(
				'responsive-embeds',
			),
			array(
				'custom-logo',
			),
			array(
				'wp-block-styles',
			),
			array(
				'align-wide',
			),
			array(
				'editor-color-palette',
			),
			array(
				'editor-font-sizes',
			),
			array(
				'amp',
			),
			array(
				'custom-header',
			),
		);
	}

	/**
	 * Tests that HTML5 theme support is added for all required areas.
	 */
	public function test_theme_support_html5() {
		$html5_support = get_theme_support( 'html5' );

		$this->assertInternalType( 'array', $html5_support );
		$this->assertEqualSets(
			array(
				'search-form',
				'comment-form',
				'comment-list',
				'gallery',
				'caption',
			),
			$html5_support[0]
		);
	}
}
