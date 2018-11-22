<?php
/**
 * WP Rig Hooks_Tests integration test class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Tests\Integration;

use WP_Rig\WP_Rig\Tests\Framework\Integration_Test_Case;

/**
 * Class integration-testing the hooks registered by the theme.
 *
 * @group hooks
 */
class Hooks_Tests extends Integration_Test_Case {

	/**
	 * Tests that the theme required actions are present.
	 *
	 * @param string   $hook_name Hook name.
	 * @param callable $callback  Callback attached to the hook.
	 * @param int      $priority  Optional. Hook callback priority. Default 10.
	 *
	 * @dataProvider data_added_actions
	 */
	public function test_added_actions( string $hook_name, callable $callback, int $priority = 10 ) {
		$result = has_action( $hook_name, $callback );

		$this->assertNotFalse( 'integer', $result );
		$this->assertSame( $priority, $result );
	}

	/**
	 * Gets the actions, callbacks and priorities to test for.
	 *
	 * @return array List of test datasets.
	 */
	public function data_added_actions() : array {
		return [
			[
				'after_setup_theme',
				'WP_Rig\\WP_Rig\\setup_theme',
				10,
			],
			[
				'widgets_init',
				'WP_Rig\\WP_Rig\\widgets_init',
				10,
			],
			[
				'wp_enqueue_scripts',
				'WP_Rig\\WP_Rig\\enqueue_styles',
				10,
			],
			[
				'wp_head',
				'WP_Rig\\WP_Rig\\preload_styles',
				10,
			],
			[
				'wp_enqueue_scripts',
				'WP_Rig\\WP_Rig\\enqueue_scripts',
				10,
			],
			[
				'enqueue_block_editor_assets',
				'WP_Rig\\WP_Rig\\enqueue_block_editor_styles',
				10,
			],
			[
				'after_setup_theme',
				'WP_Rig\\WP_Rig\\setup_custom_header',
				10,
			],
			[
				'wp_head',
				'WP_Rig\\WP_Rig\\add_pingback_header',
				10,
			],
			[
				'customize_register',
				'WP_Rig\\WP_Rig\\customize_register',
				10,
			],
			[
				'customize_preview_init',
				'WP_Rig\\WP_Rig\\enqueue_customize_preview_js',
				10,
			],
			[
				'wp',
				'WP_Rig\\WP_Rig\\lazyload_images',
				10,
			],
		];
	}

	/**
	 * Tests that the theme required filters are present.
	 *
	 * @param string   $hook_name Hook name.
	 * @param callable $callback  Callback attached to the hook.
	 * @param int      $priority  Optional. Hook callback priority. Default 10.
	 *
	 * @dataProvider data_added_filters
	 */
	public function test_added_filters( string $hook_name, callable $callback, int $priority = 10 ) {
		$result = has_filter( $hook_name, $callback );

		$this->assertNotFalse( 'integer', $result );
		$this->assertSame( $priority, $result );
	}

	/**
	 * Gets the filters, callbacks and priorities to test for.
	 *
	 * @return array List of test datasets.
	 */
	public function data_added_filters() : array {
		return [
			[
				'embed_defaults',
				'WP_Rig\\WP_Rig\\filter_embed_dimensions',
				10,
			],
			[
				'script_loader_tag',
				'WP_Rig\\WP_Rig\\filter_script_loader_tag',
				10,
			],
			[
				'wp_resource_hints',
				'WP_Rig\\WP_Rig\\filter_resource_hints',
				10,
			],
			[
				'wp_calculate_image_sizes',
				'WP_Rig\\WP_Rig\\filter_content_image_sizes_attr',
				10,
			],
			[
				'get_header_image_tag',
				'WP_Rig\\WP_Rig\\filter_header_image_tag',
				10,
			],
			[
				'wp_get_attachment_image_attributes',
				'WP_Rig\\WP_Rig\\filter_post_thumbnail_sizes_attr',
				10,
			],
			[
				'body_class',
				'WP_Rig\\WP_Rig\\filter_body_classes',
				10,
			],
			[
				'walker_nav_menu_start_el',
				'WP_Rig\\WP_Rig\\filter_primary_menu_dropdown_symbol',
				10,
			],
			[
				'nav_menu_link_attributes',
				'WP_Rig\\WP_Rig\\filter_nav_menu_link_attributes_aria_current',
				10,
			],
			[
				'page_menu_link_attributes',
				'WP_Rig\\WP_Rig\\filter_nav_menu_link_attributes_aria_current',
				10,
			],
			[
				'theme_scandir_exclusions',
				'WP_Rig\\WP_Rig\\exclude_optional_templates',
				10,
			],
		];
	}
}
