<?php
/**
 * WP_Rig\WP_Rig\Lazyload\Component class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Lazyload;

use WP_Rig\WP_Rig\Component_Interface;
use function WP_Rig\WP_Rig\wp_rig;
use WP_Customize_Manager;
use function add_action;
use function add_filter;
use function is_admin;
use function get_theme_mod;
use function apply_filters;
use function wp_enqueue_script;
use function get_theme_file_uri;
use function get_theme_file_path;
use function wp_script_add_data;
use function remove_filter;
use function is_feed;
use function is_preview;
use function wp_kses_hair;

/**
 * Class for managing lazy-loading images.
 */
class Component implements Component_Interface {

	/**
	 * Gets the unique identifier for the theme component.
	 *
	 * @return string Component slug.
	 */
	public function get_slug() : string {
		return 'lazyload';
	}

	/**
	 * Adds the action and filter hooks to integrate with WordPress.
	 */
	public function initialize() {
		add_action( 'wp', [ $this, 'action_lazyload_images' ] );
		add_action( 'customize_register', [ $this, 'action_customize_register_lazyload' ] );
	}

	/**
	 * Initializes lazy-loading images functionality.
	 */
	public function action_lazyload_images() {

		// If this is the admin page, return early.
		if ( is_admin() ) {
			return;
		}

		// If lazy-load is disabled in Customizer, return early.
		if ( 'no-lazyload' === get_theme_mod( 'lazy_load_media' ) ) {
			return;
		}

		// If the Jetpack Lazy-Images module is active, return early.
		if ( ! apply_filters( 'lazyload_is_enabled', true ) ) {
			return;
		}

		// If the AMP plugin is active, return early.
		if ( wp_rig()->is_amp() ) {
			return;
		}

		add_action( 'wp_head', [ $this, 'action_add_lazyload_filters' ], PHP_INT_MAX );
		add_action( 'wp_enqueue_scripts', [ $this, 'action_enqueue_lazyload_assets' ] );

		// Do not lazy load avatar in admin bar.
		add_action( 'admin_bar_menu', [ $this, 'action_remove_lazyload_filters' ], 0 );
		add_filter( 'wp_kses_allowed_html', [ $this, 'filter_allow_lazyload_attributes' ] );
	}

	/**
	 * Adds a setting and control for lazy loading the Customizer.
	 *
	 * @param WP_Customize_Manager $wp_customize Customizer manager instance.
	 */
	public function action_customize_register_lazyload( WP_Customize_Manager $wp_customize ) {
		$lazyload_choices = [
			'lazyload'    => __( 'Lazy-load on (default)', 'wp-rig' ),
			'no-lazyload' => __( 'Lazy-load off', 'wp-rig' ),
		];

		$wp_customize->add_setting(
			'lazy_load_media',
			[
				'default'           => 'lazyload',
				'transport'         => 'postMessage',
				'sanitize_callback' => function( $input ) use ( $lazyload_choices ) : string {
					if ( array_key_exists( $input, $lazyload_choices ) ) {
						return $input;
					}

					return '';
				},
			]
		);

		$wp_customize->add_control(
			'lazy_load_media',
			[
				'label'           => __( 'Lazy-load images', 'wp-rig' ),
				'section'         => 'theme_options',
				'type'            => 'radio',
				'description'     => __( 'Lazy-loading images means images are loaded only when they are in view. Improves performance, but can result in content jumping around on slower connections.', 'wp-rig' ),
				'choices'         => $lazyload_choices,
			]
		);
	}

	/**
	 * Adds filters to enable lazy-loading of images.
	 */
	public function action_add_lazyload_filters() {
		add_filter( 'the_content', [ $this, 'filter_add_lazyload_placeholders' ], PHP_INT_MAX );
		add_filter( 'post_thumbnail_html', [ $this, 'filter_add_lazyload_placeholders' ], PHP_INT_MAX );
		add_filter( 'get_avatar', [ $this, 'filter_add_lazyload_placeholders' ], PHP_INT_MAX );
		add_filter( 'widget_text', [ $this, 'filter_add_lazyload_placeholders' ], PHP_INT_MAX );
		add_filter( 'get_image_tag', [ $this, 'filter_add_lazyload_placeholders' ], PHP_INT_MAX );
		add_filter( 'wp_get_attachment_image_attributes', [ $this, 'filter_lazyload_attributes' ], PHP_INT_MAX );
	}

	/**
	 * Enqueues and defer lazy-loading JavaScript.
	 */
	public function action_enqueue_lazyload_assets() {
		wp_enqueue_script(
			'wp-rig-lazy-load-images',
			get_theme_file_uri( '/assets/js/lazyload.min.js' ),
			[],
			wp_rig()->get_asset_version( get_theme_file_path( '/assets/js/lazyload.min.js' ) ),
			false
		);
		wp_script_add_data( 'wp-rig-lazy-load-images', 'defer', true );
		wp_script_add_data( 'wp-rig-lazy-load-images', 'precache', true );
	}

	/**
	 * Removes filters for images that should not be lazy-loaded.
	 */
	public function action_remove_lazyload_filters() {
		remove_filter( 'the_content', [ $this, 'filter_add_lazyload_placeholders' ], PHP_INT_MAX );
		remove_filter( 'post_thumbnail_html', [ $this, 'filter_add_lazyload_placeholders' ], PHP_INT_MAX );
		remove_filter( 'get_avatar', [ $this, 'filter_add_lazyload_placeholders' ], PHP_INT_MAX );
		remove_filter( 'widget_text', [ $this, 'filter_add_lazyload_placeholders' ], PHP_INT_MAX );
		remove_filter( 'get_image_tag', [ $this, 'filter_add_lazyload_placeholders' ], PHP_INT_MAX );
		remove_filter( 'wp_get_attachment_image_attributes', [ $this, 'filter_lazyload_attributes' ], PHP_INT_MAX );
	}

	/**
	 * Ensures that lazy-loading image attributes are not filtered out of image tags.
	 *
	 * @param array $allowed_tags The allowed tags and their attributes.
	 * @return array Filtered allowed tags.
	 */
	public function filter_allow_lazyload_attributes( array $allowed_tags ) : array {
		if ( ! isset( $allowed_tags['img'] ) ) {
			return $allowed_tags;
		}

		// But, if images are allowed, ensure that our attributes are allowed!
		$allowed_tags['img'] = array_merge(
			$allowed_tags['img'],
			[
				'data-src'    => 1,
				'data-srcset' => 1,
				'data-sizes'  => 1,
				'class'       => 1,
			]
		);

		return $allowed_tags;
	}

	/**
	 * Finds image elements that should be lazy-loaded.
	 *
	 * @param string $content The content.
	 * @return string Filtered content.
	 */
	public function filter_add_lazyload_placeholders( string $content ) : string {
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

				$old_attributes = $this->flatten_kses_hair_data( $old_attributes_kses_hair );
				$new_attributes = $this->filter_lazyload_attributes( $old_attributes );

				// If we didn't add lazy attributes, just return the original image source.
				if ( empty( $new_attributes['data-src'] ) ) {
					return $matches[0];
				}

				$new_attributes_str = $this->build_attributes_string( $new_attributes );

				return sprintf( '<img %1$s><noscript>%2$s</noscript>', $new_attributes_str, $matches[0] );
			},
			$content
		);

		return $content;
	}

	/**
	 * Given an array of image attributes, updates the `src`, `srcset`, and `sizes` attributes so
	 * that they load lazily.
	 *
	 * @param array $attributes Attributes of the current <img> element.
	 * @return array The updated image attributes array with lazy load attributes.
	 */
	public function filter_lazyload_attributes( array $attributes ) : array {
		if ( empty( $attributes['src'] ) ) {
			return $attributes;
		}

		if ( ! empty( $attributes['class'] ) && $this->should_skip_image_with_blacklisted_class( $attributes['class'] ) ) {
			return $attributes;
		}

		$old_attributes = $attributes;

		// Add the lazy class to the img element.
		$attributes['class'] = $this->lazyload_class( $attributes );

		// Set placeholder and lazy-src.
		$attributes['src'] = $this->lazyload_get_placeholder_image();

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
	 * Returns true when a given string of classes contains a class signifying image
	 * should not be lazy-loaded
	 *
	 * @param string $classes A string of space-separated classes.
	 * @return bool Whether the classes contain a class indicating that lazyloading should be skipped.
	 */
	protected function should_skip_image_with_blacklisted_class( string $classes ) : bool {
		$blacklisted_classes = [
			'skip-lazy',
			'custom-logo',
		];

		foreach ( $blacklisted_classes as $class ) {
			if ( false !== strpos( $classes, $class ) ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Appends a 'lazy' class to <img> elements for lazy-loading.
	 *
	 * @param array $attributes <img> element attributes.
	 * @return string Classes string including a 'lazy' class.
	 */
	protected function lazyload_class( array $attributes ) : string {
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
	protected function lazyload_get_placeholder_image() : string {
		return get_theme_file_uri( '/assets/images/placeholder.svg' );
	}

	/**
	 * Flattens an attribute list into key value pairs.
	 *
	 * @param array $attributes Array of attributes.
	 * @return array Flattened attributes as $attr => $attr_value pairs.
	 */
	protected function flatten_kses_hair_data( array $attributes ) : array {
		$flattened_attributes = [];
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
	protected function build_attributes_string( array $attributes ) : string {
		$string = [];
		foreach ( $attributes as $name => $value ) {
			if ( '' === $value ) {
				$string[] = sprintf( '%s', $name );
			} else {
				$string[] = sprintf( '%s="%s"', $name, esc_attr( $value ) );
			}
		}

		return implode( ' ', $string );
	}
}
