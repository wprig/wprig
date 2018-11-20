<?php
/**
 * WP Rig Assets Management
 *
 * @package wp_rig
 */

/**
 * Get asset version.
 *
 * Returns filemtime when WP_DEBUG is true, otherwise the theme version.
 *
 * @param string $file  Asset in the stylesheet directory.
 * @return string       Version number.
 */
function wp_rig_get_asset_version( $file ) {
	return WP_DEBUG ? filemtime( $file ) : '2.0.0';
}

 /**
  * WP Rig CSS Files
  *
  * @return array
  */
function wp_rig_get_css_files() {

	$wp_rig_css_files = array(
		'global',
		'comments',
		'content',
		'sidebar',
		'widgets',
		'front-page',
	);

	/*
	 * Filters default CSS files.
	 *
	 * @param array $wp_rig_css_files array of CSS files
	 * to register and enqueue with WordPress.
	 */
	return apply_filters( 'wp_rig_css_files', $wp_rig_css_files );
}

/**
 * Register and enqueue styles.
 */
function wp_rig_styles() {

	// Add custom fonts, used in the main stylesheet.
	$fonts_url = wp_rig_fonts_url();
	if ( ! empty( $fonts_url ) ) {
		wp_enqueue_style( 'wp-rig-fonts', $fonts_url, array(), null ); // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
	}

	// Register component styles that are printed as needed.
	$wp_rig_theme_css_dir = get_theme_file_path( '/assets/css/' );
	$wp_rig_theme_css_uri = get_theme_file_uri( '/assets/css/' );

	$wp_rig_css_files = wp_rig_get_css_files();

	foreach ( $wp_rig_css_files as $wp_rig_css_file ) {
		/*
		* Enqueue global styles and register
		* the rest as they are called conditionally
		* on an as-needed basis.
		*/
		if ( 'global' === $wp_rig_css_file ) {
			wp_enqueue_style(
				'wp-rig-' . $wp_rig_css_file,
				$wp_rig_theme_css_uri . $wp_rig_css_file . '.min.css',
				array(),
				wp_rig_get_asset_version( $wp_rig_theme_css_dir . $wp_rig_css_file . '.min.css' )
			);
		} else {
			wp_register_style(
				'wp-rig-' . $wp_rig_css_file,
				$wp_rig_theme_css_uri . $wp_rig_css_file . '.min.css',
				array(),
				wp_rig_get_asset_version( $wp_rig_theme_css_dir . $wp_rig_css_file . '.min.css' )
			);
		}
	}

}
add_action( 'wp_enqueue_scripts', 'wp_rig_styles' );

/**
 * Generate preload markup for stylesheets.
 *
 * @param object $wp_styles Registered styles.
 * @param string $handle The style handle.
 */
function wp_rig_get_preload_stylesheet_uri( $wp_styles, $handle ) {
	$preload_uri = $wp_styles->registered[ $handle ]->src . '?ver=' . $wp_styles->registered[ $handle ]->ver;
	return $preload_uri;
}

/**
 * Adds preload for in-body stylesheets depending on what templates are being used.
 * Disabled when AMP is active as AMP injects the stylesheets inline.
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/HTML/Preloading_content
 */
function wp_rig_add_body_style() {

	// If AMP is active, do nothing.
	if ( wp_rig_is_amp() ) {
		return;
	}

	// Get registered styles.
	$wp_styles = wp_styles();

	$preloads = array();

	// Preload content.css.
	$preloads['wp-rig-content'] = wp_rig_get_preload_stylesheet_uri( $wp_styles, 'wp-rig-content' );

	// Preload sidebar.css and widget.css.
	if ( is_active_sidebar( 'sidebar-1' ) ) {
		$preloads['wp-rig-sidebar'] = wp_rig_get_preload_stylesheet_uri( $wp_styles, 'wp-rig-sidebar' );
		$preloads['wp-rig-widgets'] = wp_rig_get_preload_stylesheet_uri( $wp_styles, 'wp-rig-widgets' );
	}

	// Preload comments.css.
	if ( ! post_password_required() && is_singular() && ( comments_open() || get_comments_number() ) ) {
		$preloads['wp-rig-comments'] = wp_rig_get_preload_stylesheet_uri( $wp_styles, 'wp-rig-comments' );
	}

	// Preload front-page.css.
	global $template;
	if ( 'front-page.php' === basename( $template ) ) {
		$preloads['wp-rig-front-page'] = wp_rig_get_preload_stylesheet_uri( $wp_styles, 'wp-rig-front-page' );
	}

	// Output the preload markup in <head>.
	foreach ( $preloads as $handle => $src ) {
		echo '<link rel="preload" id="' . esc_attr( $handle ) . '-preload" href="' . esc_url( $src ) . '" as="style" />';
		echo "\n";
	}

}
add_action( 'wp_head', 'wp_rig_add_body_style' );

/**
 * Enqueue scripts.
 */
function wp_rig_scripts() {

	// If the AMP plugin is active, return early.
	if ( wp_rig_is_amp() ) {
		return;
	}

	// Enqueue the navigation script.
	wp_enqueue_script(
		'wp-rig-navigation',
		get_theme_file_uri( '/assets/js/navigation.min.js' ),
		array(),
		wp_rig_get_asset_version( get_stylesheet_directory() . '/assets/js/navigation.min.js' ),
		false
	);
	wp_script_add_data( 'wp-rig-navigation', 'async', true );
	wp_localize_script(
		'wp-rig-navigation',
		'wpRigScreenReaderText',
		array(
			'expand'   => __( 'Expand child menu', 'wp-rig' ),
			'collapse' => __( 'Collapse child menu', 'wp-rig' ),
		)
	);

	// Enqueue skip-link-focus script.
	wp_enqueue_script(
		'wp-rig-skip-link-focus-fix',
		get_theme_file_uri( '/assets/js/skip-link-focus-fix.min.js' ),
		array(),
		wp_rig_get_asset_version( get_stylesheet_directory() . '/assets/js/skip-link-focus-fix.min.js' ),
		false
	);
	wp_script_add_data( 'wp-rig-skip-link-focus-fix', 'defer', true );

	// Enqueue comment script on singular post/page views only.
	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'wp_rig_scripts' );

/**
 * Adds async/defer attributes to enqueued / registered scripts.
 *
 * If #12009 lands in WordPress, this function can no-op since it would be handled in core.
 *
 * @link https://core.trac.wordpress.org/ticket/12009
 * @param string $tag    The script tag.
 * @param string $handle The script handle.
 * @return array
 */
function wp_rig_filter_script_loader_tag( $tag, $handle ) {

	foreach ( array( 'async', 'defer' ) as $attr ) {
		if ( ! wp_scripts()->get_data( $handle, $attr ) ) {
			continue;
		}

		// Prevent adding attribute when already added in #12009.
		if ( ! preg_match( ":\s$attr(=|>|\s):", $tag ) ) {
			$tag = preg_replace( ':(?=></script>):', " $attr", $tag, 1 );
		}

		// Only allow async or defer, not both.
		break;
	}

	return $tag;
}
add_filter( 'script_loader_tag', 'wp_rig_filter_script_loader_tag', 10, 2 );

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
	wp_enqueue_style( 'wp-rig-editor-styles', get_theme_file_uri( '/assets/css/editor/editor-styles.min.css' ), array(), filemtime( get_stylesheet_directory() . '/assets/css/editor/editor-styles.min.css' ) );
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
