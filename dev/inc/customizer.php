<?php
/**
 * WP Rig Theme Customizer
 *
 * @package wprig
 */

/**
 * Add postMessage support for site title and description for the Theme Customizer.
 *
 * @param WP_Customize_Manager $wp_customize Theme Customizer object.
 */
function wprig_customize_register( $wp_customize ) {
	$wp_customize->get_setting( 'blogname' )->transport         = 'postMessage';
	$wp_customize->get_setting( 'blogdescription' )->transport  = 'postMessage';
	$wp_customize->get_setting( 'header_textcolor' )->transport = 'postMessage';

	if ( isset( $wp_customize->selective_refresh ) ) {
		$wp_customize->selective_refresh->add_partial(
			'blogname', array(
				'selector'        => '.site-title a',
				'render_callback' => 'wprig_customize_partial_blogname',
			)
		);
		$wp_customize->selective_refresh->add_partial(
			'blogdescription', array(
				'selector'        => '.site-description',
				'render_callback' => 'wprig_customize_partial_blogdescription',
			)
		);
	}

	/**
	 * Theme options.
	 */
	$wp_customize->add_section(
		'theme_options', array(
			'title'    => __( 'Theme Options', 'wprig' ),
			'priority' => 130, // Before Additional CSS.
		)
	);

	if ( function_exists( 'wprig_lazyload_images' ) ) {
		$wp_customize->add_setting(
			'lazy_load_media', array(
				'default'           => 'lazyload',
				'sanitize_callback' => 'wprig_sanitize_lazy_load_media',
				'transport'         => 'postMessage',
			)
		);

		$wp_customize->add_control(
			'lazy_load_media', array(
				'label'           => __( 'Lazy-load images', 'wprig' ),
				'section'         => 'theme_options',
				'type'            => 'radio',
				'description'     => __( 'Lazy-loading images means images are loaded only when they are in view. Improves performance, but can result in content jumping around on slower connections.', 'wprig' ),
				'choices'         => array(
					'lazyload'    => __( 'Lazy-load on (default)', 'wprig' ),
					'no-lazyload' => __( 'Lazy-load off', 'wprig' ),
				),
			)
		);
	}
}
add_action( 'customize_register', 'wprig_customize_register' );

/**
 * Render the site title for the selective refresh partial.
 *
 * @return void
 */
function wprig_customize_partial_blogname() {
	bloginfo( 'name' );
}

/**
 * Render the site tagline for the selective refresh partial.
 *
 * @return void
 */
function wprig_customize_partial_blogdescription() {
	bloginfo( 'description' );
}

/**
 * Binds JS handlers to make Theme Customizer preview reload changes asynchronously.
 */
function wprig_customize_preview_js() {
	wp_enqueue_script( 'wprig-customizer', get_theme_file_uri( '/js/customizer.js' ), array( 'customize-preview' ), '20151215', true );
}
add_action( 'customize_preview_init', 'wprig_customize_preview_js' );

/**
 * Sanitize the lazy-load media options.
 *
 * @param string $input Lazy-load setting.
 */
function wprig_sanitize_lazy_load_media( $input ) {
	$valid = array(
		'lazyload' => __( 'Lazy-load images', 'wprig' ),
		'no-lazyload' => __( 'Load images immediately', 'wprig' ),
	);

	if ( array_key_exists( $input, $valid ) ) {
		return $input;
	}

	return '';
}
