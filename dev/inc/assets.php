<?php
/**
 * WP Rig Assets Management
 *
 * @package wp_rig
 */

/**
 * Enqueue styles.
 */
function wp_rig_styles() {

	// Add custom fonts, used in the main stylesheet.
	$fonts_url = wp_rig_fonts_url();
	if ( ! empty( $fonts_url ) ) {
		wp_enqueue_style( 'wp-rig-fonts', $fonts_url, array(), null ); // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
	}

	// Enqueue main stylesheet.
	wp_enqueue_style( 'wp-rig-base-style', get_stylesheet_uri(), array(), '20180514' );

	// Register component styles that are printed as needed.
	wp_register_style( 'wp-rig-comments', get_theme_file_uri( '/css/comments.css' ), array(), '20180514' );
	wp_register_style( 'wp-rig-content', get_theme_file_uri( '/css/content.css' ), array(), '20180514' );
	wp_register_style( 'wp-rig-sidebar', get_theme_file_uri( '/css/sidebar.css' ), array(), '20180514' );
	wp_register_style( 'wp-rig-widgets', get_theme_file_uri( '/css/widgets.css' ), array(), '20180514' );
	wp_register_style( 'wp-rig-front-page', get_theme_file_uri( '/css/front-page.css' ), array(), '20180514' );
}
add_action( 'wp_enqueue_scripts', 'wp_rig_styles' );

/**
 * Enqueue scripts.
 */
function wp_rig_scripts() {

	// If the AMP plugin is active, return early.
	if ( wp_rig_is_amp() ) {
		return;
	}

	// Enqueue the navigation script.
	wp_enqueue_script( 'wp-rig-navigation', get_theme_file_uri( '/js/navigation.js' ), array(), '20180514', false );
	wp_script_add_data( 'wp-rig-navigation', 'async', true );
	wp_localize_script(
		'wp-rig-navigation',
		'wpRigScreenReaderText',
		array(
			'expand'   => __( 'Expand child menu', 'wp-rig' ),
			'collapse' => __( 'Collapse child menu', 'wp-rig' ),
		)
	);

	// Enqueue comment script on singular post/page views only.
	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'wp_rig_scripts' );

/**
 * Fix skip link focus in IE11.
 *
 * This does not enqueue the script because it is tiny and because it is only for IE11,
 * thus it does not warrant having an entire dedicated blocking script being loaded.
 *
 * @link https://git.io/vWdr2
 */
function wp_rig_fix_skip_link_focus() {
	if ( wp_rig_is_amp() ) {
		return; // See <https://github.com/ampproject/amphtml/issues/18671>.
	}
	$skip_link_focus_fix_js_file = get_template_directory() . '/js/skip-link-focus-fix.js';
	if ( ! file_exists( $skip_link_focus_fix_js_file ) ) {
		_doing_it_wrong( __FUNCTION__, esc_html__( 'Unable to locate js/skip-link-focus-fix.js, perhaps due to not performing a build. If not desired, please unhook wp_rig_fix_skip_link_focus from the wp_print_footer_scripts.', '2.0' ) );
		return;
	}
	echo '<script>';
	echo file_get_contents( $skip_link_focus_fix_js_file );
	echo '</script>';
}
add_action( 'wp_print_footer_scripts', 'wp_rig_fix_skip_link_focus' );

/**
 * Enqueue WordPress theme styles within Gutenberg.
 */
function wp_rig_gutenberg_styles() {

	// Add custom fonts, used in the main stylesheet.
	$fonts_url = wp_rig_fonts_url();
	if ( ! empty( $fonts_url ) ) {
		wp_enqueue_style( 'wp-rig-fonts', $fonts_url, array(), null ); // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
	}

	// Enqueue main stylesheet.
	wp_enqueue_style( 'wp-rig-base-style', get_theme_file_uri( '/css/editor-styles.css' ), array(), '20180514' );
}
add_action( 'enqueue_block_editor_assets', 'wp_rig_gutenberg_styles' );

/**
 * Returns Google Fonts used in theme.
 *
 * Has filter "wp_rig_google_fonts".
 *
 * @return array
 */
function wp_rig_get_google_fonts() {

	$fonts_default = array(
		'Roboto Condensed' => array( '400', '400i', '700', '700i' ),
		'Crimson Text'     => array( '400', '400i', '600', '600i' ),
	);

	/*
	 * Filters default Google fonts.
	 *
	 * @param array $fonts_default array of fonts to use
	 */
	return apply_filters( 'wp_rig_google_fonts', $fonts_default );
}

/**
 * Register Google Fonts
 */
function wp_rig_fonts_url() {

	$fonts_register = wp_rig_get_google_fonts();

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
function wp_rig_resource_hints( $urls, $relation_type ) {
	if ( wp_style_is( 'wp-rig-fonts', 'queue' ) && 'preconnect' === $relation_type ) {
		$urls[] = array(
			'href' => 'https://fonts.gstatic.com',
			'crossorigin',
		);
	}
	return $urls;
}
add_filter( 'wp_resource_hints', 'wp_rig_resource_hints', 10, 2 );
