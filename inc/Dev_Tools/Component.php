<?php
/**
 * WP_Rig\WP_Rig\Dev_Tools\Component class
 *
 * Handles development-only template boundary comments, diagnostics, and Dev Toolbar enqueuing.
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Dev_Tools;

use WP_Rig\WP_Rig\Component_Interface;
use WP_Rig\WP_Rig\Versioning_Trait;
use function WP_Rig\WP_Rig\get_config;
use function add_action;
use function add_filter;
use function wp_enqueue_script;
use function wp_enqueue_style;
use function wp_localize_script;
use function admin_url;
use function wp_create_nonce;
use function get_theme_file_uri;
use function get_theme_file_path;
use function esc_html;
use function defined;
use function sanitize_text_field;
use function wp_unslash;

/**
 * Class for managing development-only tools and the Dev Toolbar.
 */
class Component implements Component_Interface {

	use Versioning_Trait;

	/**
	 * Gets the unique identifier for the theme component.
	 *
	 * @return string Component slug.
	 */
	public function get_slug(): string {
		return 'dev_tools';
	}

	/**
	 * Checks if the component is active.
	 *
	 * @return bool True if debug mode is active or local development environment.
	 */
	public static function is_active(): bool {
		$config = get_config( 'config.json' );
		if ( isset( $config['dev']['devTools'] ) && false === $config['dev']['devTools'] ) {
			return false;
		}

		if ( isset( $config['dev']['devTools'] ) && true === $config['dev']['devTools'] ) {
			return true;
		}

		// Return true if WPRIG_DEBUG is defined and true.
		if ( defined( 'WPRIG_DEBUG' ) && WPRIG_DEBUG ) {
			return true;
		}

		// Fallback check for localhost or standard dev hostnames.
		if ( isset( $_SERVER['HTTP_HOST'] ) ) {
			$host = sanitize_text_field( wp_unslash( $_SERVER['HTTP_HOST'] ) );
			if ( 'localhost' === $host || false !== strpos( $host, '127.0.0.1' ) || false !== strpos( $host, '.test' ) || false !== strpos( $host, '.local' ) || false !== strpos( $host, '.dev' ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Adds the action and filter hooks to integrate with WordPress.
	 */
	public function initialize() {
		// Register HTML boundary comments for template parts.
		add_action( 'get_template_part', array( $this, 'inject_template_start_comment' ), 10, 2 );

		// Register HTML boundary comments for Gutenberg blocks.
		add_filter( 'render_block', array( $this, 'inject_block_boundary_comments' ), 10, 2 );

		// Register the root template tracker.
		add_filter( 'template_include', array( $this, 'track_root_template' ) );

		// Enqueue the Developer Toolbar scripts and styles in the footer.
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );

		// Register AJAX handler for cache purging.
		add_action( 'wp_ajax_wprig_purge_cache', array( $this, 'ajax_purge_cache' ) );
	}

	/**
	 * Handles AJAX request to purge theme transients and object cache.
	 */
	public function ajax_purge_cache() {
		if ( ! self::is_active() ) {
			wp_send_json_error( array( 'message' => 'Dev tools not active' ) );
		}

		if ( function_exists( 'wp_cache_flush' ) ) {
			wp_cache_flush();
		}

		wp_send_json_success( array( 'message' => 'Caches purged successfully' ) );
	}

	/**
	 * Injects a boundary start comment before a template part loads.
	 *
	 * @param string      $slug The template slug.
	 * @param string|null $name The template name.
	 */
	public function inject_template_start_comment( string $slug, ?string $name = null ) {
		$template = $name ? "{$slug}-{$name}.php" : "{$slug}.php";
		echo "\n<!-- WPRIG_TEMPLATE_START: " . esc_html( $template ) . " -->\n";
	}

	/**
	 * Wraps Gutenberg block content in boundary comments.
	 *
	 * @param string $block_content The rendered block content.
	 * @param array  $block         The block details.
	 * @return string Filtered block content.
	 */
	public function inject_block_boundary_comments( string $block_content, array $block ): string {
		if ( empty( $block['blockName'] ) ) {
			return $block_content;
		}
		$block_name = $block['blockName'];
		return "\n<!-- WPRIG_BLOCK_START: " . esc_html( $block_name ) . " -->\n" . $block_content . "\n<!-- WPRIG_BLOCK_END: " . esc_html( $block_name ) . " -->\n";
	}

	/**
	 * Tracks and outputs the root template file name.
	 *
	 * @param string $template The resolved page template path.
	 * @return string Unchanged page template path.
	 */
	public function track_root_template( string $template ): string {
		$relative_template = str_replace( get_theme_file_path() . '/', '', $template );
		add_action(
			'wp_head',
			function () use ( $relative_template ) {
				echo "\n<!-- WPRIG_ROOT_TEMPLATE: " . esc_html( $relative_template ) . " -->\n";
			}
		);
		return $template;
	}

	/**
	 * Enqueues the Dev Toolbar scripts and styles.
	 */
	public function enqueue_assets() {
		$js_uri  = get_theme_file_uri( '/assets/js/build/dev-toolbar.js' );
		$js_path = get_theme_file_path( '/assets/js/build/dev-toolbar.js' );

		$css_uri  = get_theme_file_uri( '/assets/css/dev-toolbar.css' );
		$css_path = get_theme_file_path( '/assets/css/dev-toolbar.css' );

		// Only enqueue if the compiled assets exist to prevent 404s.
		if ( file_exists( $js_path ) ) {
			wp_enqueue_script(
				'wprig-dev-toolbar',
				$js_uri,
				array(),
				$this->get_asset_version( $js_path ),
				true // Load in footer.
			);

			wp_localize_script(
				'wprig-dev-toolbar',
				'wprigDevToolbarData',
				array(
					'cssUri'  => $css_uri,
					'ajaxUrl' => admin_url( 'admin-ajax.php' ),
					'nonce'   => wp_create_nonce( 'wprig_dev_toolbar_nonce' ),
				)
			);
		}

		if ( file_exists( $css_path ) ) {
			wp_enqueue_style(
				'wprig-dev-toolbar-css',
				$css_uri,
				array(),
				$this->get_asset_version( $css_path )
			);
		}
	}
}
