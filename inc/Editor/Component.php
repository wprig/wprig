<?php
/**
 * WP_Rig\WP_Rig\Editor\Component class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Editor;

use WP_Rig\WP_Rig\Component_Interface;
use function add_action;
use function add_theme_support;

/**
 * Class for integrating with the block editor.
 *
 * @link https://wordpress.org/gutenberg/handbook/extensibility/theme-support/
 */
class Component implements Component_Interface {

	/**
	 * Gets the unique identifier for the theme component.
	 *
	 * @return string Component slug.
	 */
	public function get_slug() : string {
		return 'editor';
	}

	/**
	 * Adds the action and filter hooks to integrate with WordPress.
	 */
	public function initialize() {
		add_action( 'after_setup_theme', array( $this, 'action_add_editor_support' ) );
	}

	/**
	 * Adds support for various editor features.
	 */
	public function action_add_editor_support() {
		// Add support for default block styles.
		add_theme_support( 'wp-block-styles' );

		// Add support for wide-aligned images.
		add_theme_support( 'align-wide' );

		// Add support for color palettes.
		add_theme_support(
			'editor-color-palette',
			array(
				array(
					'name'  => __( 'Dusty orange', 'wp-rig' ),
					'slug'  => 'dusty-orange',
					'color' => '#ed8f5b',
				),
				array(
					'name'  => __( 'Dusty red', 'wp-rig' ),
					'slug'  => 'dusty-red',
					'color' => '#e36d60',
				),
				array(
					'name'  => __( 'Dusty wine', 'wp-rig' ),
					'slug'  => 'dusty-wine',
					'color' => '#9c4368',
				),
				array(
					'name'  => __( 'Dark sunset', 'wp-rig' ),
					'slug'  => 'dark-sunset',
					'color' => '#33223b',
				),
				array(
					'name'  => __( 'Almost black', 'wp-rig' ),
					'slug'  => 'almost-black',
					'color' => '#0a1c28',
				),
				array(
					'name'  => __( 'Dusty water', 'wp-rig' ),
					'slug'  => 'dusty-water',
					'color' => '#41848f',
				),
				array(
					'name'  => __( 'Dusty sky', 'wp-rig' ),
					'slug'  => 'dusty-sky',
					'color' => '#72a7a3',
				),
				array(
					'name'  => __( 'Dusty daylight', 'wp-rig' ),
					'slug'  => 'dusty-daylight',
					'color' => '#97c0b7',
				),
				array(
					'name'  => __( 'Dusty sun', 'wp-rig' ),
					'slug'  => 'dusty-sun',
					'color' => '#eee9d1',
				),
			)
		);

		/*
		 * Optional: Disable custom colors in color palettes.
		 *
		 * Uncomment the line below to disable the custom color picker in the editor.
		 *
		 * add_theme_support( 'disable-custom-colors' );
		 */

		// Add support for font sizes.
		add_theme_support(
			'editor-font-sizes',
			array(
				array(
					'name'      => __( 'small', 'wp-rig' ),
					'shortName' => __( 'S', 'wp-rig' ),
					'size'      => 16,
					'slug'      => 'small',
				),
				array(
					'name'      => __( 'regular', 'wp-rig' ),
					'shortName' => __( 'M', 'wp-rig' ),
					'size'      => 20,
					'slug'      => 'regular',
				),
				array(
					'name'      => __( 'large', 'wp-rig' ),
					'shortName' => __( 'L', 'wp-rig' ),
					'size'      => 36,
					'slug'      => 'large',
				),
				array(
					'name'      => __( 'larger', 'wp-rig' ),
					'shortName' => __( 'XL', 'wp-rig' ),
					'size'      => 48,
					'slug'      => 'larger',
				),
			)
		);

		/*
		 * Optional: Disable custom font sizes in block text settings.
		 *
		 * Uncomment the line below to disable the custom custom font sizes in the editor.
		 *
		 * add_theme_support( 'disable-custom-font-sizes' );
		 */
	}
}
