<?php
/**
 * WP_Rig\WP_Rig\Tests\Unit\Theme\Theme_Test class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Tests\Unit\Theme;

use Brain\Monkey\Functions;
use WP_Rig\WP_Rig\Tests\Framework\Unit_Test_Case;
use WP_Rig\WP_Rig\Theme;

/**
 * Tests the merged config chain (config.default.json -> config.json ->
 * config.local.json) used for paradigm resolution.
 *
 * @group config
 * @group paradigm
 */
class Theme_Test extends Unit_Test_Case {

	/**
	 * Builds a Theme that skips component discovery so the config merge can be
	 * tested in isolation without bootstrapping the full component graph.
	 *
	 * @return Theme
	 */
	private function configOnlyTheme(): Theme {
		return new class() extends Theme {
			/**
			 * Skips discovery — returns no components.
			 *
			 * @return array
			 */
			protected function get_default_components(): array {
				return array();
			}
		};
	}

	/**
	 * Mocks get_config_content() to return per-file fixture contents.
	 *
	 * @param array $defaults config.default.json contents.
	 * @param array $custom   config.json contents.
	 * @param array $local    config.local.json contents.
	 */
	private function mockConfigFiles( array $defaults, array $custom, array $local ): void {
		Functions\when( 'WP_Rig\WP_Rig\get_config_content' )
			->alias(
				static function ( string $filename ) use ( $defaults, $custom, $local ) {
					switch ( $filename ) {
						case 'config.default.json':
							return $defaults;
						case 'config.json':
							return $custom;
						case 'config.local.json':
							return $local;
						default:
							return null;
					}
				}
			);
	}

	/**
	 * Tests that config.local.json is the top override in the merge chain.
	 *
	 * @covers \WP_Rig\WP_Rig\Theme::get_config()
	 */
	public function test_config_local_overrides_custom_and_default() {
		$this->mockConfigFiles(
			array(
				'theme' => array(
					'themeType' => 'classic',
					'name'      => 'Default',
				),
			),
			array(
				'theme' => array( 'themeType' => 'universal' ),
			),
			array(
				'theme' => array( 'themeType' => 'block-based' ),
			)
		);

		$config = $this->configOnlyTheme()->get_config( 'config.json' );

		$this->assertSame( 'block-based', $config['theme']['themeType'] );
		// Deep keys from the default layer survive when untouched by overrides.
		$this->assertSame( 'Default', $config['theme']['name'] );
	}

	/**
	 * Tests that a missing config.local.json leaves the custom layer intact.
	 *
	 * @covers \WP_Rig\WP_Rig\Theme::get_config()
	 */
	public function test_config_resolves_without_local_file() {
		$this->mockConfigFiles(
			array(
				'theme' => array( 'themeType' => 'classic' ),
			),
			array(
				'theme' => array( 'themeType' => 'universal' ),
			),
			array()
		);

		$config = $this->configOnlyTheme()->get_config( 'config.json' );

		$this->assertSame( 'universal', $config['theme']['themeType'] );
	}
}
