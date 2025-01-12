<?php
/**
 * WP_Rig\WP_Rig\Fonts\Component class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Fonts;

use WP_Rig\WP_Rig\Component_Interface;
use WP_Rig\WP_Rig\Templating_Component_Interface;

/**
 * Class for adding basic theme support, most of which is mandatory to be implemented by all themes.
 *
 * Exposes template tags:
 * * `wp_rig()->get_version()`
 * * `wp_rig()->get_asset_version( string $filepath )`
 */
class Component implements Component_Interface, Templating_Component_Interface {

	/**
	 * Associative array of Google Fonts to load, as $font_name => $font_variants pairs.
	 *
	 * Do not access this property directly, instead use the `get_google_fonts()` method.
	 *
	 * @var array
	 */
	protected $google_fonts;

	/**
	 * Gets the unique identifier for the theme component.
	 *
	 * @return string Component slug.
	 */
	public function get_slug(): string {
		return 'fonts';
	}

	/**
	 * Adds the action and filter hooks to integrate with WordPress.
	 */
	public function initialize(): void {
		add_action( 'wp_enqueue_scripts', array( $this, 'action_enqueue_fonts' ) );
		add_action( 'after_setup_theme', array( $this, 'action_add_editor_fonts' ) );
		add_action( 'init', array( $this, 'wprig_register_fonts' ) );
		add_filter( 'wp_resource_hints', array( $this, 'filter_resource_hints' ), 10, 2 );
	}

	/**
	 * Gets template tags to expose as methods on the Template_Tags class instance, accessible through `wp_rig()`.
	 *
	 * @return array Associative array of $method_name => $callback_info pairs. Each $callback_info must either be
	 *               a callable or an array with key 'callable'. This approach is used to reserve the possibility of
	 *               adding support for further arguments in the future.
	 */
	public function template_tags(): array {
		return array();
	}

	/**
	 * Gets the theme version.
	 *
	 * @return string Theme version number.
	 */
	public function get_version(): string {
		static $theme_version = null;

		if ( null === $theme_version ) {
			$theme_version = wp_get_theme( get_template() )->get( 'Version' );
		}

		return $theme_version;
	}

	/**
	 * Gets the version for a given asset.
	 *
	 * Returns filemtime when WP_DEBUG is true, otherwise the theme version.
	 *
	 * @param string $filepath Asset file path.
	 * @return string Asset version number.
	 */
	public function get_asset_version( string $filepath ): string {
		if ( WP_DEBUG ) {
			return (string) filemtime( $filepath );
		}

		return $this->get_version();
	}

	/**
	 * Registers font collections with WordPress if the wp_register_font_collection function exists.
	 */
	public function wprig_register_fonts(): void {
		if ( function_exists( 'wp_register_font_collection' ) ) {
			wp_register_font_collection(
				'modern-stacks',
				array(
					'name'          => __( 'Modern Stacks', 'wp-rig' ),
					'description'   => __( 'A collection of modern system fonts.', 'wp-rig' ),
					'font_families' => array(
						array(
							'font_family_settings' => array(
								'fontFamily' => 'system-ui, sans-serif',
								'slug'       => 'system-ui',
								'name'       => __( 'System UI', 'wp-rig' ),
							),
							'categories'           => array( 'sans-serif' ),
						),
						array(
							'font_family_settings' => array(
								'fontFamily' => "Charter, 'Bitstream Charter', 'Sitka Text', Cambria, serif",
								'slug'       => 'transitional',
								'name'       => __( 'Transitional', 'wp-rig' ),
							),
							'categories'           => array( 'serif' ),
						),
						array(
							'font_family_settings' => array(
								'fontFamily' => "'Nimbus Mono PS', 'Courier New', monospace",
								'slug'       => 'monospace-slab-serif',
								'name'       => __( 'Monospace Slab Serif', 'wp-rig' ),
							),
							'categories'           => array( 'monospace', 'serif' ),
						),
						array(
							'font_family_settings' => array(
								'fontFamily' => "'Segoe Print', 'Bradley Hand', Chilanka, TSCu_Comic, casual, cursive",
								'slug'       => 'handwritten',
								'name'       => __( 'Handwritten', 'wp-rig' ),
							),
							'categories'           => array( 'handwriting' ),
						),
					),
					'categories'    => array(
						array(
							'name' => __( 'Handwriting', 'wp-rig' ),
							'slug' => 'handwriting',
						),
						array(
							'name' => __( 'Monospace', 'wp-rig' ),
							'slug' => 'monospace',
						),
						array(
							'name' => __( 'Sans Serif', 'wp-rig' ),
							'slug' => 'sans-serif',
						),
						array(
							'name' => __( 'Serif', 'wp-rig' ),
							'slug' => 'serif',
						),
					),
				)
			);

			wp_register_font_collection(
				'local-fonts',
				array(
					'name'   => __( 'Local Fonts', 'wp-rig' ),
					'font_families' => array(
						array(
							'family' => 'My Local Font',
							'file'   => get_template_directory_uri() . '/assets/fonts/my-local-font/my-local-font.woff2',
							'weight' => '400',
							'style'  => 'normal',
						),
					)
				)
			);
		}
	}

	/**
	 * Enqueues Google Fonts for the theme.
	 */
	public function action_enqueue_fonts(): void {
		// Enqueue Google Fonts.
		$google_fonts_url = $this->get_google_fonts_url();
		if ( '' !== $google_fonts_url && '0' !== $google_fonts_url ) {
			wp_enqueue_style( 'wp-rig-fonts', $google_fonts_url, array(), null ); // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
		}
	}

	/**
	 * Enqueues the Google Fonts for the WordPress editor.
	 *
	 * Retrieves the URL for the Google Fonts and, if it is not empty,
	 * adds the editor styles to the WordPress editor.
	 */
	public function action_add_editor_fonts(): void {
		// Enqueue Google Fonts.
		$google_fonts_url = $this->get_google_fonts_url();
		if ( '' !== $google_fonts_url && '0' !== $google_fonts_url ) {
			add_editor_style( $this->get_google_fonts_url() );
		}
	}

	/**
	 * Adds preconnect resource hint for Google Fonts.
	 *
	 * @param array  $urls          URLs to print for resource hints.
	 * @param string $relation_type The relation type the URLs are printed.
	 * @return array URLs to print for resource hints.
	 */
	public function filter_resource_hints( array $urls, string $relation_type ): array {
		if ( 'preconnect' === $relation_type && wp_style_is( 'wp-rig-fonts', 'queue' ) ) {
			$urls[] = array(
				'href' => 'https://fonts.gstatic.com',
				'crossorigin',
			);
		}

		return $urls;
	}

	/**
	 * Returns Google Fonts used in theme.
	 *
	 * @return array Associative array of $font_name => $font_variants pairs.
	 */
	protected function get_google_fonts(): array {
		if ( is_array( $this->google_fonts ) ) {
			return $this->google_fonts;
		}

		$google_fonts = array(
			'Roboto Condensed' => array( '400', '400i', '700', '700i' ),
			'Crimson Text'     => array( '400', '400i', '600', '600i' ),
		);

		/**
		 * Filters default Google Fonts.
		 *
		 * @param array $google_fonts Associative array of $font_name => $font_variants pairs.
		 */
		$this->google_fonts = (array) apply_filters( 'wp_rig_google_fonts', $google_fonts );

		return $this->google_fonts;
	}

	/**
	 * Returns the Google Fonts URL to use for enqueuing Google Fonts CSS.
	 *
	 * Uses `latin` subset by default. To use other subsets, add a `subset` key to $query_args and the desired value.
	 *
	 * @return string Google Fonts URL, or empty string if no Google Fonts should be used.
	 */
	protected function get_google_fonts_url(): string {
		$google_fonts = $this->get_google_fonts();

		if ( array() === $google_fonts ) {
			return '';
		}

		$font_families = array();

		foreach ( $google_fonts as $font_name => $font_variants ) {
			if ( ! empty( $font_variants ) ) {
				if ( ! is_array( $font_variants ) ) {
					$font_variants = explode( ',', str_replace( ' ', '', $font_variants ) );
				}

				$font_families[] = $font_name . ':' . implode( ',', $font_variants );
				continue;
			}

			$font_families[] = $font_name;
		}

		$query_args = array(
			'family'  => implode( '|', $font_families ),
			'display' => 'swap',
		);

		return add_query_arg( $query_args, 'https://fonts.googleapis.com/css' );
	}
}
