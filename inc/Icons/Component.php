<?php
/**
 * WP_Rig\WP_Rig\Icons\Component class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Icons;

use WP_Rig\WP_Rig\Component_Interface;
use WP_Rig\WP_Rig\Templating_Component_Interface;
use function WP_Rig\WP_Rig\wp_rig;
use function apply_filters;
use function esc_attr;

/**
 * Class for managing icons.
 *
 * Registers every SVG in the theme's `assets/icons/` directory with the native
 * WordPress 7.1 Icon API so the theme's icons are selectable in the editor's
 * Icon block, and exposes the `wprig_icon()` template tag for classic templates.
 *
 * Exposes template tags:
 * * `wp_rig()->wprig_icon( string $name, array $args = array() )`
 */
class Component implements Component_Interface, Templating_Component_Interface {

	/**
	 * Native icon collection slug registered with the WordPress Icon API.
	 *
	 * @var string
	 */
	const COLLECTION = 'wprig-icons';

	/**
	 * Theme-relative directory scanned for SVG icons.
	 *
	 * @var string
	 */
	const ICONS_DIR = 'assets/icons';

	/**
	 * Processed icons cache.
	 *
	 * @var array
	 */
	protected array $processed_icons = array();

	/**
	 * Gets the unique identifier for the theme component.
	 *
	 * @return string Component slug.
	 */
	public function get_slug(): string {
		return 'icons';
	}

	/**
	 * Adds the action and filter hooks to integrate with WordPress.
	 */
	public function initialize() {
		add_action( 'init', array( $this, 'register_icon_collection' ), 20 );
	}

	/**
	 * Gets template tags to expose as methods on the Template_Tags class instance, accessible through `wp_rig()`.
	 *
	 * @return array Associative array of $method_name => $callback_info pairs.
	 */
	public function template_tags(): array {
		return array(
			'wprig_icon' => array( $this, 'wprig_icon' ),
		);
	}

	/**
	 * Registers the theme's icons with the native WordPress Icon API.
	 *
	 * Silently no-ops on WordPress versions without the Icon API (pre-7.1), so
	 * the component remains safe in every paradigm. Registration can be disabled
	 * entirely via the `wp_rig_icons_register_collection` filter.
	 */
	public function register_icon_collection() {
		if ( ! function_exists( 'wp_register_icon_collection' ) || ! function_exists( 'wp_register_icon' ) ) {
			return;
		}

		/**
		 * Filters whether the theme's icons are registered with the native Icon API.
		 *
		 * @param bool $register Whether to register the icon collection. Default true.
		 */
		if ( ! apply_filters( 'wp_rig_icons_register_collection', true ) ) {
			return;
		}

		$registered = wp_register_icon_collection(
			self::COLLECTION,
			array(
				'label'       => esc_html__( 'WP Rig Icons', 'wp-rig' ),
				'description' => esc_html__( 'Icons from the theme\'s assets/icons directory.', 'wp-rig' ),
			)
		);

		if ( ! $registered ) {
			return;
		}

		foreach ( $this->get_icon_files() as $slug => $path ) {
			$content = $this->read_icon_svg( $path );

			if ( '' === $content ) {
				do_action( 'wp_rig_log', sprintf( '[WP Rig Icons] skipped "%s": no path/polygon markup after sanitization.', $slug ) );
				continue;
			}

			wp_register_icon(
				self::COLLECTION . '/' . $slug,
				array(
					'label'   => $this->humanize( $slug ),
					'content' => $content,
				)
			);
		}
	}

	/**
	 * Returns the SVG markup for a given icon.
	 *
	 * Prefers an icon registered with the native WordPress Icon API (so the same
	 * collection powers the editor's Icon block) and falls back to the theme's
	 * `assets/icons/` file when no such icon is registered.
	 *
	 * @param string $name Icon name (filename without extension).
	 * @param array  $args Optional. Arguments to modify the SVG output.
	 * @return string SVG markup, or empty string if not found.
	 */
	public function wprig_icon( string $name, array $args = array() ): string {
		$cache_key = md5( $name . wp_json_encode( $args ) );
		if ( isset( $this->processed_icons[ $cache_key ] ) ) {
			return $this->processed_icons[ $cache_key ];
		}

		$args = array_merge(
			array(
				'class'       => '',
				'aria_hidden' => true,
				'aria_label'  => '',
			),
			$args
		);

		$native_content = $this->get_native_icon( $name, $args );
		if ( null !== $native_content ) {
			$native_content = apply_filters( 'wp_rig_icon', $native_content, $name, $args );

			$this->processed_icons[ $cache_key ] = $native_content;

			return $native_content;
		}

		// Ensure we have the .svg extension.
		if ( ! str_ends_with( $name, '.svg' ) ) {
			$name .= '.svg';
		}

		$icon_content = wp_rig()->get_theme_asset( $name, 'icons', true );

		if ( ! $icon_content ) {
			return '';
		}

		// Simple attribute injection.
		// If the SVG already has a class, we might want to append to it, but for simplicity we'll just prepend our classes.
		if ( ! empty( $args['class'] ) ) {
			$icon_content = preg_replace( '/<svg([^>]+)class="([^"]+)"/', '<svg$1class="' . esc_attr( $args['class'] ) . ' $2"', $icon_content );
			if ( ! str_contains( $icon_content, 'class="' ) ) {
				$icon_content = str_replace( '<svg', '<svg class="' . esc_attr( $args['class'] ) . '"', $icon_content );
			}
		}

		if ( $args['aria_hidden'] && ! str_contains( $icon_content, 'aria-hidden="' ) ) {
			$icon_content = str_replace( '<svg', '<svg aria-hidden="true"', $icon_content );
		}

		if ( ! empty( $args['aria_label'] ) && ! str_contains( $icon_content, 'aria-label="' ) ) {
			$icon_content = str_replace( '<svg', '<svg aria-label="' . esc_attr( $args['aria_label'] ) . '"', $icon_content );
		}

		/**
		 * Filters the icon SVG markup.
		 *
		 * @param string $icon_content The SVG markup.
		 * @param string $name         The icon name.
		 * @param array  $args         The arguments passed to the icon.
		 */
		$icon_content = apply_filters( 'wp_rig_icon', $icon_content, $name, $args );

		$this->processed_icons[ $cache_key ] = $icon_content;

		return $icon_content;
	}

	/**
	 * Renders an icon through the native WordPress Icon API when available.
	 *
	 * Returns null when the API is unavailable or the icon is not registered, so
	 * the caller falls back to the theme's own `assets/icons/` files.
	 *
	 * @param string $name Icon name (with or without the .svg extension).
	 * @param array  $args Icon arguments (class, aria_hidden, aria_label).
	 * @return string|null Native icon SVG markup, or null when unavailable.
	 */
	protected function get_native_icon( string $name, array $args ): ?string {
		if ( ! function_exists( 'wp_get_icon' ) ) {
			return null;
		}

		$slug = strtolower( pathinfo( $name, PATHINFO_FILENAME ) );
		if ( '' === $slug ) {
			return null;
		}

		$markup = wp_get_icon(
			self::COLLECTION . '/' . $slug,
			array(
				'class' => $args['class'],
				'label' => $args['aria_label'],
			)
		);

		if ( ! is_string( $markup ) || '' === $markup ) {
			return null;
		}

		return $markup;
	}

	/**
	 * Discovers the bundled icon files as `slug => absolute path`.
	 *
	 * Child theme icons take precedence over parent theme icons of the same name.
	 *
	 * @return array<string, string> Icon slug (no extension) => file path.
	 */
	protected function get_icon_files(): array {
		$directories = array_unique(
			array(
				trailingslashit( get_stylesheet_directory() ) . self::ICONS_DIR,
				trailingslashit( get_template_directory() ) . self::ICONS_DIR,
			)
		);

		$icons = array();

		foreach ( $directories as $directory ) {
			$files = glob( trailingslashit( $directory ) . '*.svg' );

			if ( false === $files ) {
				continue;
			}

			foreach ( $files as $file ) {
				$slug = strtolower( basename( $file, '.svg' ) );

				if ( '' === $slug || isset( $icons[ $slug ] ) ) {
					continue;
				}

				$icons[ $slug ] = $file;
			}
		}

		ksort( $icons );

		return $icons;
	}

	/**
	 * Reads and sanitizes an SVG file for registration.
	 *
	 * Strips the XML prolog, comments, and width/height attributes (so
	 * `wp_get_icon()` controls sizing) and collapses whitespace. Core's icon
	 * registry sanitizes registered content down to `<path>`/`<polygon>` only,
	 * so icons built solely from other primitives (rect, circle, line, …) are
	 * rejected here rather than registered as blank icons.
	 *
	 * @param string $path Absolute path to the SVG file.
	 * @return string Sanitized `<svg>…</svg>` markup, or an empty string.
	 */
	protected function read_icon_svg( string $path ): string {
		$svg = file_get_contents( $path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Component-owned icon files.

		if ( false === $svg ) {
			return '';
		}

		$svg = preg_replace( '/<\?xml[^>]*\?>/i', '', $svg );
		$svg = preg_replace( '/<!--[\s\S]*?-->/', '', $svg );
		$svg = preg_replace_callback(
			'/<svg\b[^>]*>/i',
			static function ( $matches ) {
				return preg_replace( '/\s(?:width|height)="[^"]*"/i', '', $matches[0] );
			},
			(string) $svg
		);
		$svg = trim( preg_replace( '/\s+/', ' ', (string) $svg ) );

		if ( ! str_starts_with( strtolower( $svg ), '<svg' ) ) {
			return '';
		}

		if ( ! preg_match( '/<(path|polygon)\b/i', $svg ) ) {
			return '';
		}

		return $svg;
	}

	/**
	 * Converts a file slug into a human-readable icon label.
	 *
	 * @param string $slug Icon slug.
	 * @return string Label.
	 */
	protected function humanize( string $slug ): string {
		return ucwords( str_replace( array( '-', '_' ), ' ', $slug ) );
	}
}
