<?php
/**
 * WP Rig Assets Management
 *
 * @package wprig
 */

/**
 * Enqueue styles.
 */
function wprig_styles() {

	// Add custom fonts, used in the main stylesheet.
	$fonts_url = wprig_fonts_url();
	if ( ! empty( $fonts_url ) ) {
		wp_enqueue_style( 'wprig-fonts', $fonts_url, array(), null );
	}

	// Enqueue main stylesheet.
	wp_enqueue_style( 'wprig-base-style', get_stylesheet_uri(), array(), '20180514' );

	// Register component styles that are printed as needed.
	wp_register_style( 'wprig-comments', get_theme_file_uri( '/css/comments.css' ), array(), '20180514' );
	wp_register_style( 'wprig-content', get_theme_file_uri( '/css/content.css' ), array(), '20180514' );
	wp_register_style( 'wprig-sidebar', get_theme_file_uri( '/css/sidebar.css' ), array(), '20180514' );
	wp_register_style( 'wprig-widgets', get_theme_file_uri( '/css/widgets.css' ), array(), '20180514' );
	wp_register_style( 'wprig-front-page', get_theme_file_uri( '/css/front-page.css' ), array(), '20180514' );
}
add_action( 'wp_enqueue_scripts', 'wprig_styles' );

/**
 * Enqueue scripts.
 */
function wprig_scripts() {

	// If the AMP plugin is active, return early.
	if ( wprig_is_amp() ) {
		return;
	}

	// Enqueue the navigation script.
	wp_enqueue_script( 'wprig-navigation', get_theme_file_uri( '/js/navigation.js' ), array(), '20180514', false );
	wp_script_add_data( 'wprig-navigation', 'async', true );
	wp_localize_script( 'wprig-navigation', 'wprigScreenReaderText', array(
		'expand'   => __( 'Expand child menu', 'wprig' ),
		'collapse' => __( 'Collapse child menu', 'wprig' ),
	));

	// Enqueue skip-link-focus script.
	wp_enqueue_script( 'wprig-skip-link-focus-fix', get_theme_file_uri( '/js/skip-link-focus-fix.js' ), array(), '20180514', false );
	wp_script_add_data( 'wprig-skip-link-focus-fix', 'defer', true );

	// Enqueue comment script on singular post/page views only.
	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'wprig_scripts' );

/**
 * Enqueue WordPress theme styles within Gutenberg.
 */
function wprig_gutenberg_styles() {

	// Add custom fonts, used in the main stylesheet.
	$fonts_url = wprig_fonts_url();
	if ( ! empty( $fonts_url ) ) {
		wp_enqueue_style( 'wprig-fonts', $fonts_url, array(), null );
	}

	// Enqueue main stylesheet.
	wp_enqueue_style( 'wprig-base-style', get_theme_file_uri( '/css/editor-styles.css' ), array(), '20180514' );
}
add_action( 'enqueue_block_editor_assets', 'wprig_gutenberg_styles' );

/**
 * Returns Google Fonts used in theme.
 *
 * Has filter "wprig_google_fonts".
 *
 * @return array
 */
function wprig_get_google_fonts() {

	$fonts_default = array(
		'Roboto Condensed' => array( '400', '400i', '700', '700i' ),
		'Crimson Text'     => array( '400', '400i', '600', '600i' ),
	);

	/*
	 * Filters default Google fonts.
	 *
	 * @param array $fonts_default array of fonts to use
	 */
	return apply_filters( 'wprig_google_fonts', $fonts_default );
}

/**
 * Register Google Fonts
 */
function wprig_fonts_url() {

	$fonts_register = wprig_get_google_fonts();

	if ( empty( $fonts_register ) ) {
		return '';
	}

	$font_families = array();

	foreach ( $fonts_register as $font_name => $font_variants ) {
		if ( ! empty( $font_variants ) ) {

			// Make sure its an array.
			if ( ! is_array( $font_variants ) ) {
				$font_variants = explode( ',', str_replace( ' ', '', $font_variants ) );
			}

			$font_families[] = $font_name . ':' . implode( ',', $font_variants );

		} else {
			$font_families[] = $font_name;
		}
	}

	$query_args = array(
		'family' => implode( '|', $font_families ),
		'subset' => 'latin-ext',
	);

	return add_query_arg( $query_args, 'https://fonts.googleapis.com/css' );
}

/**
 * Add preconnect for Google Fonts.
 *
 * @since Twenty Seventeen 1.0
 *
 * @param array  $urls           URLs to print for resource hints.
 * @param string $relation_type  The relation type the URLs are printed.
 * @return array $urls           URLs to print for resource hints.
 */
function wprig_resource_hints( $urls, $relation_type ) {
	if ( wp_style_is( 'wprig-fonts', 'queue' ) && 'preconnect' === $relation_type ) {
		$urls[] = array(
			'href' => 'https://fonts.gstatic.com',
			'crossorigin',
		);
	}
	return $urls;
}
add_filter( 'wp_resource_hints', 'wprig_resource_hints', 10, 2 );
