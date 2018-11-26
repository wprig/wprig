<?php
/**
 * Lazy-load images.
 *
 * Modified version of Lazy Images module in Jetpack.
 *
 * @link https://github.com/Automattic/jetpack/blob/master/modules/lazy-images/lazy-images.php
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig;

use WP_Customize_Manager;

/**
 * Main function. Runs everything.
 */
function lazyload_images() {

	// If this is the admin page, do nothing.
	if ( is_admin() ) {
		return;
	}

	// If lazy-load is disabled in Customizer, do nothing.
	if ( 'no-lazyload' === get_theme_mod( 'lazy_load_media' ) ) {
		return;
	}

	// If the Jetpack Lazy-Images module is active, do nothing.
	if ( ! apply_filters( 'lazyload_is_enabled', true ) ) {
		return;
	}

	// If AMP is active, do nothing.
	if ( is_amp() ) {
		return;
	}

	add_action( 'wp_head', __NAMESPACE__ . '\\lazyload_add_filters', PHP_INT_MAX );
	add_action( 'wp_enqueue_scripts', __NAMESPACE__ . '\\lazyload_enqueue_assets' );

	// Do not lazy load avatar in admin bar.
	add_action( 'admin_bar_menu', __NAMESPACE__ . '\\lazyload_remove_filters', 0 );
	add_filter( 'wp_kses_allowed_html', __NAMESPACE__ . '\\lazyload_allow_attributes' );

}
add_action( 'wp', __NAMESPACE__ . '\\lazyload_images' );

/**
 * Adds a setting and control for lazy loading the Customizer.
 *
 * @param WP_Customize_Manager $wp_customize Customizer manager instance.
 */
function lazyload_customize_register( WP_Customize_Manager $wp_customize ) {
	$lazyload_choices = array(
		'lazyload'    => __( 'Lazy-load on (default)', 'wp-rig' ),
		'no-lazyload' => __( 'Lazy-load off', 'wp-rig' ),
	);

	$wp_customize->add_setting(
		'lazy_load_media',
		array(
			'default'           => 'lazyload',
			'transport'         => 'postMessage',
			'sanitize_callback' => function( $input ) use ( $lazyload_choices ) : string {
				if ( array_key_exists( $input, $lazyload_choices ) ) {
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
			'choices'         => $lazyload_choices,
		)
	);
}
add_action( 'customize_register', __NAMESPACE__ . '\\lazyload_customize_register' );

/**
 * Setup filters to enable lazy-loading of images.
 */
function lazyload_add_filters() {
	add_filter( 'the_content', __NAMESPACE__ . '\\add_image_placeholders', PHP_INT_MAX );
	add_filter( 'post_thumbnail_html', __NAMESPACE__ . '\\add_image_placeholders', PHP_INT_MAX );
	add_filter( 'get_avatar', __NAMESPACE__ . '\\add_image_placeholders', PHP_INT_MAX );
	add_filter( 'widget_text', __NAMESPACE__ . '\\add_image_placeholders', PHP_INT_MAX );
	add_filter( 'get_image_tag', __NAMESPACE__ . '\\add_image_placeholders', PHP_INT_MAX );
	add_filter( 'wp_get_attachment_image_attributes', __NAMESPACE__ . '\\process_image_attributes', PHP_INT_MAX );
}

/**
 * Remove filters for images that should not be lazy-loaded.
 */
function lazyload_remove_filters() {
	remove_filter( 'the_content', __NAMESPACE__ . '\\add_image_placeholders', PHP_INT_MAX );
	remove_filter( 'post_thumbnail_html', __NAMESPACE__ . '\\add_image_placeholders', PHP_INT_MAX );
	remove_filter( 'get_avatar', __NAMESPACE__ . '\\add_image_placeholders', PHP_INT_MAX );
	remove_filter( 'widget_text', __NAMESPACE__ . '\\add_image_placeholders', PHP_INT_MAX );
	remove_filter( 'get_image_tag', __NAMESPACE__ . '\\add_image_placeholders', PHP_INT_MAX );
	remove_filter( 'wp_get_attachment_image_attributes', __NAMESPACE__ . '\\process_image_attributes', PHP_INT_MAX );
}

/**
 * Ensure that our lazy image attributes are not filtered out of image tags.
 *
 * @param array $allowed_tags The allowed tags and their attributes.
 * @return array Filtered allowed tags.
 */
function lazyload_allow_attributes( array $allowed_tags ) : array {
	if ( ! isset( $allowed_tags['img'] ) ) {
		return $allowed_tags;
	}

	// But, if images are allowed, ensure that our attributes are allowed!
	$img_attributes      = array_merge(
		$allowed_tags['img'],
		array(
			'data-src'    => 1,
			'data-srcset' => 1,
			'data-sizes'  => 1,
			'class'       => 1,
		)
	);
	$allowed_tags['img'] = $img_attributes;

	return $allowed_tags;
}

/**
 * Find image elements that should be lazy-loaded.
 *
 * @param string $content The content.
 * @return string Filtered content.
 */
function add_image_placeholders( string $content ) : string {
	// Don't lazyload for feeds, previews.
	if ( is_feed() || is_preview() ) {
		return $content;
	}

	// Don't lazy-load if the content has already been run through previously.
	if ( false !== strpos( $content, 'data-src' ) ) {
		return $content;
	}

	// Find all <img> elements via regex, add lazy-load attributes.
	$content = preg_replace_callback(
		'#<(img)([^>]+?)(>(.*?)</\\1>|[\/]?>)#si',
		function( array $matches ) : string {
			$old_attributes_str       = $matches[2];
			$old_attributes_kses_hair = wp_kses_hair( $old_attributes_str, wp_allowed_protocols() );
			if ( empty( $old_attributes_kses_hair['src'] ) ) {
				return $matches[0];
			}

			$old_attributes = flatten_kses_hair_data( $old_attributes_kses_hair );
			$new_attributes = process_image_attributes( $old_attributes );
			// If we didn't add lazy attributes, just return the original image source.
			if ( empty( $new_attributes['data-src'] ) ) {
				return $matches[0];
			}
			$new_attributes_str = build_attributes_string( $new_attributes );

			return sprintf( '<img %1$s><noscript>%2$s</noscript>', $new_attributes_str, $matches[0] );
		},
		$content
	);

	return $content;
}

/**
 * Returns true when a given string of classes contains a class signifying image
 * should not be lazy-loaded
 *
 * @param string $classes A string of space-separated classes.
 * @return bool Whether the classes contain a class indicating that lazyloading should be skipped.
 */
function should_skip_image_with_blacklisted_class( string $classes ) : bool {
	$blacklisted_classes = array(
		'skip-lazy',
	);

	foreach ( $blacklisted_classes as $class ) {
		if ( false !== strpos( $classes, $class ) ) {
			return true;
		}
	}
	return false;
}

/**
 * Given an array of image attributes, updates the `src`, `srcset`, and `sizes` attributes so
 * that they load lazily.
 *
 * @param array $attributes Attributes of the current <img> element.
 * @return array The updated image attributes array with lazy load attributes.
 */
function process_image_attributes( array $attributes ) : array {
	if ( empty( $attributes['src'] ) ) {
		return $attributes;
	}
	if ( ! empty( $attributes['class'] ) && should_skip_image_with_blacklisted_class( $attributes['class'] ) ) {
		return $attributes;
	}
	// Exclude custom logo from lazy loading.
	if ( preg_match( '/\bcustom-logo\b/', $attributes['class'] ) ) {
		return $attributes;
	}

	$old_attributes = $attributes;

	// Add the lazy class to the img element.
	$attributes['class'] = lazyload_class( $attributes );

	// Set placeholder and lazy-src.
	$attributes['src'] = lazyload_get_placeholder_image();

	// Set data-src to the original source uri.
	$attributes['data-src'] = $old_attributes['src'];

	// Process `srcset` attribute.
	if ( ! empty( $attributes['srcset'] ) ) {
		$attributes['data-srcset'] = $old_attributes['srcset'];
		unset( $attributes['srcset'] );
	}
	// Process `sizes` attribute.
	if ( ! empty( $attributes['sizes'] ) ) {
		$attributes['data-sizes'] = $old_attributes['sizes'];
		unset( $attributes['sizes'] );
	}

	return $attributes;
}

/**
 * Appends a 'lazy' class to <img> elements for lazy-loading.
 *
 * @param array $attributes <img> element attributes.
 * @return string Classes string including a 'lazy' class.
 */
function lazyload_class( array $attributes ) : string {
	if ( array_key_exists( 'class', $attributes ) ) {
		$classes  = $attributes['class'];
		$classes .= ' lazy';
	} else {
		$classes = 'lazy';
	}

	return $classes;
}

/**
 * Gets the placeholder image URL.
 *
 * @return string The URL to the placeholder image.
 */
function lazyload_get_placeholder_image() : string {
	return get_theme_file_uri( '/images/placeholder.svg' );
}

/**
 * Flattens an attribute list into key value pairs.
 *
 * @param array $attributes Array of attributes.
 * @return array Flattened attributes as $attr => $attr_value pairs.
 */
function flatten_kses_hair_data( array $attributes ) : array {
	$flattened_attributes = array();
	foreach ( $attributes as $name => $attribute ) {
		$flattened_attributes[ $name ] = $attribute['value'];
	}
	return $flattened_attributes;
}

/**
 * Builds a string of attributes for an HTML element.
 *
 * @param array $attributes Array of attributes.
 * @return string HTML attribute string.
 */
function build_attributes_string( array $attributes ) : string {
	$string = array();
	foreach ( $attributes as $name => $value ) {
		if ( '' === $value ) {
			$string[] = sprintf( '%s', $name );
		} else {
			$string[] = sprintf( '%s="%s"', $name, esc_attr( $value ) );
		}
	}

	return implode( ' ', $string );
}

/**
 * Enqueue and defer lazyload script.
 */
function lazyload_enqueue_assets() {
	wp_enqueue_script(
		'wp-rig-lazy-load-images',
		get_theme_file_uri( '/pluggable/lazyload/js/lazyload.js' ),
		array(),
		get_asset_version( get_stylesheet_directory() . '/pluggable/lazyload/js/lazyload.js' ),
		false
	);
	wp_script_add_data( 'wp-rig-lazy-load-images', 'defer', true );
}
