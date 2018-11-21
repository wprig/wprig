<?php
/**
 * WP Rig Theme Customizer
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig;

use WP_Customize_Manager;

/**
 * Adds postMessage support for site title and description, plus further integration with the Customizer.
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

	if ( function_exists( __NAMESPACE__ . '\\lazyload_images' ) ) {
		$wp_customize->add_setting(
			'lazy_load_media',
			array(
				'default'           => 'lazyload',
				'transport'         => 'postMessage',
				'sanitize_callback' => function( $input ) : string {
					$valid = array(
						'lazyload' => __( 'Lazy-load images', 'wp-rig' ),
						'no-lazyload' => __( 'Load images immediately', 'wp-rig' ),
					);

					if ( array_key_exists( $input, $valid ) ) {
						return $input;
					}

					return '';
				},
			)
		);

		$wp_customize->add_control(
			'lazy_load_media',
			array(
				'label'           => __( 'Lazy-load images', 'wp-rig' ),
				'section'         => 'theme_options',
				'type'            => 'radio',
				'description'     => __( 'Lazy-loading images means images are loaded only when they are in view. Improves performance, but can result in content jumping around on slower connections.', 'wp-rig' ),
				'choices'         => array(
					'lazyload'    => __( 'Lazy-load on (default)', 'wp-rig' ),
					'no-lazyload' => __( 'Lazy-load off', 'wp-rig' ),
				),
			)
		);
	}
}
add_action( 'customize_register', __NAMESPACE__ . '\\customize_register' );

/**
 * Binds JS handlers to make Theme Customizer preview reload changes asynchronously.
 */
function enqueue_customize_preview_js() {
	wp_enqueue_script( 'wp-rig-customizer', get_theme_file_uri( '/js/customizer.js' ), array( 'customize-preview' ), '20151215', true );
}
add_action( 'customize_preview_init', __NAMESPACE__ . '\\enqueue_customize_preview_js' );
