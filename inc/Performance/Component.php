<?php
/**
 * WP_Rig\WP_Rig\Performance\Component class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Performance;

use WP_Rig\WP_Rig\Component_Interface;
use WP_Rig\WP_Rig\Asset_Provider;
use function add_action;
use function add_filter;
use function remove_action;
use function remove_filter;
use function is_user_logged_in;
use function wp_dequeue_style;
use function wp_dequeue_script;
use function get_theme_file_path;
use function apply_filters;
use function wp_staticize_emoji;
use function wp_staticize_emoji_for_email;
use function esc_html;
use function __;

/**
 * Class for managing performance optimizations.
 */
class Component implements Component_Interface {

	/**
	 * Map of critical strategies.
	 *
	 * @var Critical_Strategy_Interface[]
	 */
	protected array $strategies = array();

	/**
	 * Gets the unique identifier for the theme component.
	 *
	 * @return string Component slug.
	 */
	public function get_slug(): string {
		return 'performance';
	}

	/**
	 * Adds the action and filter hooks to integrate with WordPress.
	 */
	public function initialize() {
		$config = $this->get_config();

		// Register default strategies.
		$this->register_strategy( new Cookie_Strategy() );

		if ( ! empty( $config['cleanup_emojis'] ) ) {
			add_action( 'init', array( $this, 'cleanup_emojis' ) );
		}

		if ( ! empty( $config['cleanup_dashicons'] ) ) {
			add_action( 'wp_enqueue_scripts', array( $this, 'cleanup_dashicons' ), 100 );
		}

		if ( ! empty( $config['cleanup_global_styles'] ) ) {
			add_action( 'wp_enqueue_scripts', array( $this, 'cleanup_global_styles' ), 100 );
		}

		// Provide a filter for 3rd party opt-outs.
		add_action( 'wp_enqueue_scripts', array( $this, 'process_opt_outs' ), 110 );

		// Initialize all registered strategies.
		foreach ( $this->strategies as $strategy ) {
			$strategy->initialize();
		}
	}

	/**
	 * Registers a critical asset loading strategy.
	 *
	 * @param Critical_Strategy_Interface $strategy Strategy instance.
	 */
	public function register_strategy( Critical_Strategy_Interface $strategy ) {
		$this->strategies[ $strategy->get_slug() ] = $strategy;
	}

	/**
	 * Retrieves a critical asset loading strategy by its slug.
	 *
	 * @param string $slug Strategy slug.
	 * @return Critical_Strategy_Interface|null Strategy instance, or null if not found.
	 */
	public function get_strategy( string $slug ): ?Critical_Strategy_Interface {
		return $this->strategies[ $slug ] ?? null;
	}

	/**
	 * Removes Emojis support from WordPress.
	 */
	public function cleanup_emojis() {
		remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
		remove_action( 'admin_print_scripts', 'print_emoji_detection_script' );
		remove_action( 'wp_print_styles', 'print_emoji_styles' );
		remove_action( 'admin_print_styles', 'print_emoji_styles' );
		remove_filter( 'the_content_feed', 'wp_staticize_emoji' );
		remove_filter( 'comment_text_rss', 'wp_staticize_emoji' );
		remove_filter( 'wp_mail', 'wp_staticize_emoji_for_email' );

		// Remove from TinyMCE.
		add_filter( 'tiny_mce_plugins', array( $this, 'remove_tinymce_emojis' ) );
		add_filter( 'wp_resource_hints', array( $this, 'remove_emoji_resource_hints' ), 10, 2 );
	}

	/**
	 * Removes the emoji plugin from TinyMCE.
	 *
	 * @param array $plugins Array of TinyMCE plugins.
	 * @return array Modified array of TinyMCE plugins.
	 */
	public function remove_tinymce_emojis( $plugins ) {
		if ( is_array( $plugins ) ) {
			return array_diff( $plugins, array( 'wpemoji' ) );
		}
		return array();
	}

	/**
	 * Removes emoji-related resource hints.
	 *
	 * @param array  $urls          URLs to print for resource hints.
	 * @param string $relation_type The relation type the URLs are printed for.
	 * @return array Modified URLs.
	 */
	public function remove_emoji_resource_hints( $urls, $relation_type ) {
		if ( 'dns-prefetch' === $relation_type ) {
			$emoji_svg_url = apply_filters( 'emoji_svg_url', 'https://s.w.org/images/core/emoji/14.0.0/svg/' );
			$urls          = array_diff( $urls, array( $emoji_svg_url ) );
		}
		return $urls;
	}

	/**
	 * Removes Dashicons for logged-out users.
	 */
	public function cleanup_dashicons() {
		if ( ! is_user_logged_in() ) {
			wp_dequeue_style( 'dashicons' );
		}
	}

	/**
	 * Removes Global Block Library styles (wp-block-library).
	 */
	public function cleanup_global_styles() {
		wp_dequeue_style( 'wp-block-library' );
		wp_dequeue_style( 'wp-block-library-theme' );
		wp_dequeue_style( 'wc-block-style' ); // WooCommerce block styles if present.
	}

	/**
	 * Processes 3rd party asset opt-outs via the `wp_rig_asset_opt_out` filter.
	 */
	public function process_opt_outs() {
		/**
		 * Filters the list of asset handles to be dequeued or delayed.
		 *
		 * @param array $opt_outs {
		 *     List of opt-outs.
		 *     @type array $styles  List of style handles to dequeue.
		 *     @type array $scripts List of script handles to dequeue.
		 * }
		 */
		$opt_outs = apply_filters(
			'wp_rig_asset_opt_out',
			array(
				'styles'  => array(),
				'scripts' => array(),
			)
		);

		if ( ! empty( $opt_outs['styles'] ) ) {
			foreach ( $opt_outs['styles'] as $handle ) {
				wp_dequeue_style( $handle );
			}
		}

		if ( ! empty( $opt_outs['scripts'] ) ) {
			foreach ( $opt_outs['scripts'] as $handle ) {
				wp_dequeue_script( $handle );
			}
		}
	}

	/**
	 * Retrieves the performance configuration.
	 *
	 * @return array Configuration settings.
	 */
	protected function get_config(): array {
		$config_path        = get_theme_file_path( '/config/config.default.json' );
		$custom_config_path = get_theme_file_path( '/config/config.json' );

		$config = array();
		if ( file_exists( $config_path ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			$config = json_decode( file_get_contents( $config_path ), true );
		}

		if ( file_exists( $custom_config_path ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			$custom_config = json_decode( file_get_contents( $custom_config_path ), true );
			if ( is_array( $custom_config ) ) {
				$config = array_replace_recursive( $config, $custom_config );
			}
		}

		return $config['performance'] ?? array(
			'cleanup_emojis'        => true,
			'cleanup_dashicons'     => true,
			'cleanup_global_styles' => false,
		);
	}
}
