<?php
/**
 * WP Rig Theme Customizer
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig;

use WP_Customize_Manager;

/**
 * Adds postMessage support for site title and description, plus a custom Theme Options section to the Customizer.
 *
 * @param WP_Customize_Manager $wp_customize Customizer manager instance.
 */
function customize_register( WP_Customize_Manager $wp_customize ) {
	$wp_customize->get_setting( 'blogname' )->transport         = 'postMessage';
	$wp_customize->get_setting( 'blogdescription' )->transport  = 'postMessage';
	$wp_customize->get_setting( 'header_textcolor' )->transport = 'postMessage';

	if ( isset( $wp_customize->selective_refresh ) ) {
		$wp_customize->selective_refresh->add_partial(
			'blogname',
			array(
				'selector'        => '.site-title a',
				'render_callback' => function() {
					bloginfo( 'name' );
				},
			)
		);
		$wp_customize->selective_refresh->add_partial(
			'blogdescription',
			array(
				'selector'        => '.site-description',
				'render_callback' => function() {
					bloginfo( 'description' );
				},
			)
		);
	}

	/**
	 * Theme options.
	 */
	$wp_customize->add_section(
		'theme_options',
		array(
			'title'    => __( 'Theme Options', 'wp-rig' ),
			'priority' => 130, // Before Additional CSS.
		)
	);
}
add_action( 'customize_register', __NAMESPACE__ . '\\customize_register' );

/**
 * Binds JS handlers to make Theme Customizer preview reload changes asynchronously.
 */
function enqueue_customize_preview_js() {
	wp_enqueue_script(
		'wp-rig-customizer',
		get_theme_file_uri( '/js/customizer.js' ),
		array( 'customize-preview' ),
		get_asset_version( get_stylesheet_directory() . '/js/customizer.js' ),
		true
	);
}
add_action( 'customize_preview_init', __NAMESPACE__ . '\\enqueue_customize_preview_js' );
