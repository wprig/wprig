<?php
/**
 * WP_Rig\WP_Rig\JavaScript\Component class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\JavaScript;

use WP_Rig\WP_Rig\Component_Interface;
use WP_Rig\WP_Rig\Templating_Component_Interface;
use function WP_Rig\WP_Rig\wp_rig;
use function add_action;
use function add_filter;
use function wp_enqueue_script;
use function wp_register_script;
use function wp_script_add_data;
use function get_theme_file_uri;
use function get_theme_file_path;
use function wp_scripts;
use function esc_attr;
use function esc_url;
use function wp_script_is;
use function _doing_it_wrong;
use function esc_html;
use function wp_print_scripts;
use function post_password_required;
use function is_singular;
use function comments_open;
use function get_comments_number;
use function apply_filters;
use function add_query_arg;

/**
 * Class for managing stylesheets.
 *
 * Exposes template tags:
 * * `wp_rig()->print_javascript()`
 */
class Component implements Component_Interface, Templating_Component_Interface {

	/**
	 * Associative array of JS files, as $handle => $data pairs.
	 * $data must be an array with keys 'file' (file path relative to 'assets/js' directory), and optionally 'global'
	 * (whether the file should immediately be enqueued instead of just being registered) and 'preload_callback'
	 * (callback function determining whether the file should be preloaded for the current request).
	 *
	 * Do not access this property directly, instead use the `get_js_files()` method.
	 *
	 * @var array
	 */
	protected $js_files;

	/**
	 * Gets the unique identifier for the theme component.
	 *
	 * @return string Component slug.
	 */
	public function get_slug() : string {
		return 'scripts';
	}

	/**
	 * Adds the action and filter hooks to integrate with WordPress.
	 */
	public function initialize() {
		add_action( 'wp_enqueue_scripts', array( $this, 'action_enqueue_scripts' ) );
		add_action( 'wp_head', array( $this, 'action_preload_scripts' ) );

		// No add_editor_scripts
		// add_action( 'after_setup_theme', array( $this, 'action_add_editor_styles' ) );
		// add_filter( 'wp_resource_hints', array( $this, 'filter_resource_hints' ), 10, 2 );
	}

	/**
	 * Gets template tags to expose as methods on the Template_Tags class instance, accessible through `wp_rig()`.
	 *
	 * @return array Associative array of $method_name => $callback_info pairs. Each $callback_info must either be
	 *               a callable or an array with key 'callable'. This approach is used to reserve the possibility of
	 *               adding support for further arguments in the future.
	 */
	public function template_tags() : array {
		return array(
			'print_scripts' => array( $this, 'print_scripts' ),
		);
	}

	/**
	 * Registers or enqueues js.
	 *
	 * JSs that are global are enqueued. All other JSs are only registered, to be enqueued later.
	 */
	public function action_enqueue_scripts() {

		$js_uri = get_theme_file_uri( '/assets/js/' );
		$js_dir = get_theme_file_path( '/assets/js/' );

		$preloading_scripts_enabled = $this->preloading_scripts_enabled();

		$js_files = $this->get_js_files();
		foreach ( $js_files as $handle => $data ) {
			$src     = $js_uri . $data['file'];
			$version = wp_rig()->get_asset_version( $js_dir . $data['file'] );

			/*
			 * Enqueue global JSs immediately and register the other ones for later use
			 * (unless preloading JSs is disabled, in which case JSs should be immediately
			 * enqueued based on whether they are necessary for the page content).
			 */
			if ( $data['global'] || ! $preloading_scripts_enabled && is_callable( $data['preload_callback'] ) && call_user_func( $data['preload_callback'] ) ) {
				wp_enqueue_script( $handle, $src, array(), $version, $data['media'] );
			} else {
				wp_register_script( $handle, $src, array(), $version, $data['media'] );
			}

			wp_script_add_data( $handle, 'precache', true );
		}
	}

	/**
	 * Preloads in-body JSs depending on what templates are being used.
	 *
	 * Only JSs that have a 'preload_callback' provided will be considered. If that callback evaluates to true
	 * for the current request, the JS will be preloaded.
	 *
	 * @link https://developer.mozilla.org/en-US/docs/Web/HTML/Preloading_content
	 */
	public function action_preload_scripts() {

		// If preloading scripts is disabled, return early.
		if ( ! $this->preloading_scripts_enabled() ) {
			return;
		}

		$wp_scripts = wp_scripts();

		$js_files = $this->get_js_files();
		foreach ( $js_files as $handle => $data ) {

			// Skip if JS not registered.
			if ( ! isset( $wp_scripts->registered[ $handle ] ) ) {
				continue;
			}

			// Skip if no preload callback provided.
			if ( ! is_callable( $data['preload_callback'] ) ) {
				continue;
			}

			// Skip if preloading is not necessary for this request.
			if ( ! call_user_func( $data['preload_callback'] ) ) {
				continue;
			}

			$preload_uri = $wp_scripts->registered[ $handle ]->src . '?ver=' . $wp_scripts->registered[ $handle ]->ver;

			echo '<script rel="preload" id="' . esc_attr( $handle ) . '-preload" href="' . esc_url( $preload_uri ) . '" as="script" type="text/javascript></script>';
			echo "\n";
		}
	}

	/**
	 * Enqueues WordPress theme styles for the editor.
	 * FIXME: Find js version solution.
	 */
	// public function action_add_editor_styles() {

	// 	// Enqueue Google Fonts.
	// 	$google_fonts_url = $this->get_google_fonts_url();
	// 	if ( ! empty( $google_fonts_url ) ) {
	// 		add_editor_style( $this->get_google_fonts_url() );
	// 	}

	// 	// Enqueue block editor stylesheet.
	// 	add_editor_style( 'assets/css/editor/editor-styles.min.css' );
	// }

	/**
	 * Adds preconnect resource hint for Google Fonts.
	 * TODO: use to include external style sheets?
	 *
	 * @param array  $urls          URLs to print for resource hints.
	 * @param string $relation_type The relation type the URLs are printed.
	 * @return array URLs to print for resource hints.
	 */
	// public function filter_resource_hints( array $urls, string $relation_type ) : array {
	// 	if ( 'preconnect' === $relation_type && wp_style_is( 'wp-rig-fonts', 'queue' ) ) {
	// 		$urls[] = array(
	// 			'href' => 'https://fonts.gstatic.com',
	// 			'crossorigin',
	// 		);
	// 	}

	// 	return $urls;
	// }

	/**
	 * Prints js script tags directly.
	 *
	 * This should be used for JSs that aren't global and thus should only be loaded if the HTML markup
	 * they are responsible for is actually present. Template parts should use this method when the related markup
	 * requires a specific JS to be loaded. If preloading JSs is disabled, this method will not do
	 * anything.
	 *
	 * If the `<script>` tag for a given stylesheet has already been printed, it will be skipped.
	 *
	 * @param string ...$handles One or more JS handles.
	 */
	public function print_scripts( string ...$handles ) {

		// If preloading scripts is disabled (and thus they have already been enqueued), return early.
		if ( ! $this->preloading_scripts_enabled() ) {
			return;
		}

		$js_files = $this->get_js_files();
		$handles   = array_filter(
			$handles,
			function( $handle ) use ( $js_files ) {
				$is_valid = isset( $js_files[ $handle ] ) && ! $js_files[ $handle ]['global'];
				if ( ! $is_valid ) {
					/* translators: %s: JS handle */
					_doing_it_wrong( __CLASS__ . '::print_scripts()', esc_html( sprintf( __( 'Invalid theme JS handle: %s', 'wp-rig' ), $handle ) ), 'WP Rig 2.0.0' );
				}
				return $is_valid;
			}
		);

		if ( empty( $handles ) ) {
			return;
		}

		wp_print_scriptss( $handles );
	}

	/**
	 * Determines whether to preload JSs and inject their link tags directly within the page content.
	 *
	 * Using this technique generally improves performance, however may not be preferred under certain circumstances.
	 * For example, since AMP will include all style rules directly in the head, it must not be used in that context.
	 * By default, this method returns true unless the page is being served in AMP. The
	 * {@see 'wp_rig_preloading_styles_enabled'} filter can be used to tweak the return value.
	 *
	 * @return bool True if preloading stylesheets and injecting them is enabled, false otherwise.
	 */
	protected function preloading_scripts_enabled() {
		$preloading_scripts_enabled = ! wp_rig()->is_amp();

		/**
		 * Filters whether to preload stylesheets and inject their link tags within the page content.
		 *
		 * @param bool $preloading_styles_enabled Whether preloading stylesheets and injecting them is enabled.
		 */
		return apply_filters( 'wp_rig_preloading_scripts_enabled', $preloading_scripts_enabled );
	}

	/**
	 * Gets all JS files.
	 *
	 * @return array Associative array of $handle => $data pairs.
	 */
	protected function get_js_files() : array {
		if ( is_array( $this->js_files ) ) {
			return $this->js_files;
		}

		$js_files = array(
			'test-js'     => array(
				'file'   => 'custom.min.js',
				'global' => true,
			),
		);

		/**
		 * Filters default JS files.
		 *
		 * @param array $js_files Associative array of JS files, as $handle => $data pairs.
		 *                         $data must be an array with keys 'file' (file path relative to 'assets/js'
		 *                         directory), and optionally 'global' (whether the file should immediately be
		 *                         enqueued instead of just being registered) and 'preload_callback' (callback)
		 *                         function determining whether the file should be preloaded for the current request).
		 */
		$js_files = apply_filters( 'wp_rig_js_files', $js_files );

		$this->js_files = array();
		foreach ( $js_files as $handle => $data ) {
			if ( is_string( $data ) ) {
				$data = array( 'file' => $data );
			}

			if ( empty( $data['file'] ) ) {
				continue;
			}

			$this->js_files[ $handle ] = array_merge(
				array(
					'global'           => false,
					'preload_callback' => null,
					'media'            => 'all',
				),
				$data
			);
		}

		return $this->js_files;
	}

	/**
	 * Returns Google Fonts used in theme.
	 * FIXME: maybe use for other JS resources
	 * @return array Associative array of $font_name => $font_variants pairs.
	 */
	// protected function get_google_fonts() : array {
	// 	if ( is_array( $this->google_fonts ) ) {
	// 		return $this->google_fonts;
	// 	}

	// 	$google_fonts = array(
	// 		'Roboto Condensed' => array( '400', '400i', '700', '700i' ),
	// 		'Crimson Text'     => array( '400', '400i', '600', '600i' ),
	// 	);

		/**
		 * Filters default Google Fonts.
		 *
		 * @param array $google_fonts Associative array of $font_name => $font_variants pairs.
		 */
	// 	$this->google_fonts = (array) apply_filters( 'wp_rig_google_fonts', $google_fonts );

	// 	return $this->google_fonts;
	// }

	/**
	 * Returns the Google Fonts URL to use for enqueuing Google Fonts CSS.
	 *
	 * Uses `latin` subset by default. To use other subsets, add a `subset` key to $query_args and the desired value.
	 *
	 * @return string Google Fonts URL, or empty string if no Google Fonts should be used.
	 */
	// protected function get_google_fonts_url() : string {
	// 	$google_fonts = $this->get_google_fonts();

	// 	if ( empty( $google_fonts ) ) {
	// 		return '';
	// 	}

	// 	$font_families = array();

	// 	foreach ( $google_fonts as $font_name => $font_variants ) {
	// 		if ( ! empty( $font_variants ) ) {
	// 			if ( ! is_array( $font_variants ) ) {
	// 				$font_variants = explode( ',', str_replace( ' ', '', $font_variants ) );
	// 			}

	// 			$font_families[] = $font_name . ':' . implode( ',', $font_variants );
	// 			continue;
	// 		}

	// 		$font_families[] = $font_name;
	// 	}

	// 	$query_args = array(
	// 		'family'  => implode( '|', $font_families ),
	// 		'display' => 'swap',
	// 	);

	// 	return add_query_arg( $query_args, 'https://fonts.googleapis.com/css' );
	// }
}
