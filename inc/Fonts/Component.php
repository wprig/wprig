<?php
/**
 * WP_Rig\WP_Rig\Fonts\Component class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Fonts;

use WP_Error;
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
					'name'          => __( 'Local Fonts', 'wp-rig' ),
					'font_families' => array(
						array(
							'family' => 'My Local Font',
							'file'   => get_template_directory_uri() . '/assets/fonts/my-local-font/my-local-font.woff2',
							'weight' => '400',
							'style'  => 'normal',
						),
					),
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
			'Montserrat'       => array( '100', '100i', '300', '500', '500i', '700', '700i' ),
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


	/**
	 * Downloads Google Fonts found in the `get_google_fonts()` method.
	 *
	 * @param string $font_dir Relative directory within the active theme to store font files. Default 'assets/fonts'.
	 * @param string $css_dir Relative directory within the active theme to store the CSS file. Default 'assets/css/src'.
	 * @return string|\WP_Error URL of the saved CSS file on success, or WP_Error on failure.
	 */
	public function download_all_google_fonts( string $font_dir = 'assets/fonts', string $css_dir = 'assets/css/src' ) {
		// Get the list of Google Fonts.
		$google_fonts = $this->get_google_fonts();

		// Prepare an array for fonts to download.
		$fonts_to_download = array();

		foreach ( array_keys( $google_fonts ) as $font_name ) {
			// Skip if font already exists locally.
			if ( $this->get_local_font_path( $font_name ) ) {
				continue;
			}

			// Add font with all variants (just include full range for simplicity).
			$fonts_to_download[ $font_name ] = array( 'ital,wght@0,100..900' );
		}

		// Download and save all fonts locally in one go.
		if ( array() !== $fonts_to_download ) {
			return $this->download_google_fonts_to_local( $fonts_to_download, $font_dir, $css_dir );
		}

		return new \WP_Error( 'no_fonts_to_download', 'No Google Fonts were found to download.' );
	}

	/**
	 * Downloads Google Fonts and saves them locally in the specified directory.
	 *
	 * This function fetches Google Fonts CSS, extracts font file URLs, downloads
	 * font files, updates the CSS to use local URLs, and saves both the font files
	 * and the modified CSS file into the active theme's directory.
	 *
	 * @param array  $fonts An array where keys are font family names and values
	 *                          are arrays of font variants to be downloaded. If no
	 *                          valid fonts are provided, an error is returned.
	 * @param string $font_dir The relative directory path within the theme where
	 *                         font files will be stored (default is 'assets/fonts').
	 * @param string $css_dir The relative directory path within the theme where
	 *                        the CSS file will be stored (default is 'assets/css/src').
	 *
	 * @return string|\WP_Error The URL of the locally saved CSS file or a WP_Error
	 *                          object if the process fails.
	 */
	public function download_google_fonts_to_local( $fonts = array(), $font_dir = 'assets/fonts', $css_dir = 'assets/css/src' ): WP_Error|string {
		// Base URL for Google Fonts.
		$google_fonts_base_url = 'https://fonts.googleapis.com/css2?';
		$query_fonts           = array();

		// Loop through each font to build the query with a fixed variant range.
		foreach ( $fonts as $font_family => $font_variants ) {
			// Simply include the full range of italic and weight variants for each font family.
			$query_fonts[] = 'family=' . str_replace( ' ', '+', $font_family ) . ':ital,wght@0,100..900';
		}

		// If no fonts were added, return an error.
		if ( array() === $query_fonts ) {
			return new \WP_Error( 'invalid_fonts', 'No valid fonts were provided.' );
		}

		// Build the full Google Fonts URL.
		$google_fonts_url = $google_fonts_base_url . implode( '&', $query_fonts ) . '&display=swap';

		// Fetch the Google Fonts CSS.
		$response = wp_remote_get(
			$google_fonts_url,
			array(
				'headers' => array(
					// Use a modern User-Agent to ensure `.woff2` is returned.
					'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5906.69 Safari/537.36',
				),
			)
		);

		// Check for request errors.
		if ( is_wp_error( $response ) || wp_remote_retrieve_response_code( $response ) !== 200 ) {
			return new \WP_Error( 'font_download_failed', 'Could not fetch Google Fonts CSS.' );
		}

		$css_content = wp_remote_retrieve_body( $response );

		// Extract font file URLs from CSS.
		preg_match_all(
			'/@font-face\s*\{[^}]*font-family\s*:\s*[\'"]?([^\'";}\n]+)[\'"]?[^}]*url\s*\(\s*[\'"]?(https:\/\/fonts\.gstatic\.com\/[^)"\']+\.woff2)[\'"]?\s*\)/i',
			$css_content,
			$matches,
			PREG_SET_ORDER
		);

		// Initialize an empty array to store fonts and their respective URLs.
		$fonts_with_urls = array();

		if ( empty( $matches ) ) {
			return new \WP_Error( 'font_parse_failed', 'No font files found in CSS.' );
		}

		// Loop through matches and structure the array.
		foreach ( $matches as $match ) {
			$font_name = trim( $match[1] ); // Extract `font-family` name.
			$font_url  = $match[2];       // Extract the `.woff2` file URL.

			// Group URLs by font-family.
			if ( ! isset( $fonts_with_urls[ $font_name ] ) ) {
				$fonts_with_urls[ $font_name ] = array();
			}
			$fonts_with_urls[ $font_name ][] = $font_url;
		}

		$theme_dir     = get_stylesheet_directory(); // Gets the current theme directory.
		$font_dir_path = trailingslashit( $theme_dir ) . $font_dir;
		if ( ! file_exists( $font_dir_path ) ) {
			wp_mkdir_p( $font_dir_path );
		}

		foreach ( $fonts_with_urls as $font_name => $font_urls ) {
			foreach ( $font_urls as $font_url ) {
				// Extract font file name and font name.
				$font_file_name = basename( $font_url );
				preg_match( '/family=([^&]+)/', $font_url, $font_name_match );
				$font_name_clean = sanitize_title_with_dashes( $font_name ); // Make it filesystem-safe.

				// Create font-specific folder.
				$font_family_dir = trailingslashit( $font_dir_path ) . $font_name_clean;
				if ( ! file_exists( $font_family_dir ) ) {
					wp_mkdir_p( $font_family_dir );
				}

				// Save font file to the directory.
				$local_font_path = trailingslashit( $font_family_dir ) . $font_file_name;

				if ( ! file_exists( $local_font_path ) ) {
					$font_response = wp_remote_get(
						$font_url,
						array(
							'sslverify' => false,
						)
					);

					if ( is_wp_error( $font_response ) || wp_remote_retrieve_response_code( $font_response ) !== 200 ) {
						continue; // Skip if the font file couldn't be downloaded.
					}

					// Initialize WP_Filesystem.
					global $wp_filesystem;
					if ( ! $wp_filesystem ) {
						require_once ABSPATH . '/wp-admin/includes/file.php';
						WP_Filesystem();
					}
					$wp_filesystem->put_contents( $local_font_path, wp_remote_retrieve_body( $font_response ), FS_CHMOD_FILE );
				}

				// Calculate the relative path from CSS directory to font directory.
				$css_to_font_relative_path = $this->get_relative_path( $css_dir, $font_dir );

				// Build the relative path to the font file.
				$relative_font_path = trailingslashit( $css_to_font_relative_path ) .
					trailingslashit( $font_name_clean ) .
					$font_file_name;

				// Update the CSS content to point to the relative font path.
				$css_content = str_replace( $font_url, $relative_font_path, $css_content );
			}
		}

		// Save the CSS file in the specified CSS directory.
		$css_file_name = 'google-fonts.css';

		// Ensure the CSS directory exists.
		$css_dir_path = trailingslashit( $theme_dir ) . $css_dir;
		if ( ! file_exists( $css_dir_path ) ) {
			wp_mkdir_p( $css_dir_path );
		}

		$local_css_path = trailingslashit( $css_dir_path ) . $css_file_name;
		// Initialize WP_Filesystem if not already initialized.
		global $wp_filesystem;
		if ( ! $wp_filesystem ) {
			require_once ABSPATH . '/wp-admin/includes/file.php';
			WP_Filesystem();
		}
		$wp_filesystem->put_contents( $local_css_path, $css_content, FS_CHMOD_FILE );

		return trailingslashit( get_stylesheet_directory_uri() ) . $css_dir . '/' . $css_file_name;
	}

	/**
	 * Checks if the requested font is available locally.
	 *
	 * @param string $font_name The name of the font, e.g., 'Roboto'.
	 * @param string $variants Font weights or styles, e.g., '400;700'.
	 * @return string|false Path to the local font CSS, or false if not available.
	 */
	protected function get_local_font_path( string $font_name, string $variants = '400;700' ) {
		// Directory where fonts are stored.
		$upload_dir = wp_upload_dir();
		$font_dir   = trailingslashit( $upload_dir['basedir'] ) . 'fonts';

		// Check if the font CSS exists locally.
		$css_file_name  = strtolower( str_replace( ' ', '-', $font_name ) ) . '.css';
		$local_css_path = trailingslashit( $font_dir ) . $css_file_name;

		return file_exists( $local_css_path ) ? trailingslashit( $upload_dir['baseurl'] ) . 'fonts/' . $css_file_name : false;
	}

	/**
	 * Calculates the relative path from one directory to another.
	 *
	 * @param string $from Source directory path (relative to theme root).
	 * @param string $to Target directory path (relative to theme root).
	 * @return string The relative path from $from to $to.
	 */
	protected function get_relative_path( string $from, string $to ): string {
		// Convert paths to arrays.
		$from_parts = explode( '/', trim( $from, '/' ) );
		$to_parts   = explode( '/', trim( $to, '/' ) );

		// Find common path.
		$common_length = 0;
		$max           = min( count( $from_parts ), count( $to_parts ) );

		for ( $i = 0; $i < $max; $i++ ) {
			if ( $from_parts[ $i ] === $to_parts[ $i ] ) {
				++$common_length;
			} else {
				break;
			}
		}

		// Calculate number of directories to go up from source.
		$up_levels = count( $from_parts ) - $common_length;

		// Build the relative path.
		$relative_path = str_repeat( '../', $up_levels );

		// Add the path down to the target.
		if ( $common_length < count( $to_parts ) ) {
			$relative_path .= implode( '/', array_slice( $to_parts, $common_length ) );
		}

		return $relative_path;
	}
}
