<?php
/**
 * WP_Rig\WP_Rig\Base_Support\Component class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Options;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use WP_Rig\WP_Rig\Component_Interface;
use WP_Rig\WP_Rig\Templating_Component_Interface;
use function add_action;

/**
 * Class for adding basic theme support, most of which is mandatory to be implemented by all themes.
 *
 * Exposes template tags:
 * * `wp_rig()->get_version()`
 * * `wp_rig()->get_asset_version( string $filepath )`
 */
class Component implements Component_Interface, Templating_Component_Interface {

	/**
	 * Gets the unique identifier for the theme component.
	 *
	 * @return string Component slug.
	 */
	public function get_slug(): string {
		return 'options';
	}

	/**
	 * Adds the action and filter hooks to integrate with WordPress.
	 */
	public function initialize() {
		add_action( 'admin_enqueue_scripts', array( $this, 'theme_options_enqueue_scripts' ) );
		add_action( 'admin_menu', array( $this, 'add_admin_menu' ) );
		add_action( 'rest_api_init', array( $this, 'register_settings_endpoint' ) );
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
	 * Enqueues the theme options admin scripts.
	 */
	public function theme_options_enqueue_scripts(): void {
		wp_enqueue_script(
			'wp-rig-theme-settings',
			get_template_directory_uri() . '/assets/js/admin/index.min.js',
			array( 'wp-element', 'wp-components', 'wp-data' ),
			filemtime( get_template_directory() . '/assets/js/admin/index.min.js' ),
			true
		);

		wp_enqueue_style(
			'wp-rig-theme-settings',
			get_template_directory_uri() . '/assets/css/admin/theme-settings.min.css',
			array(),
			filemtime( get_template_directory() . '/assets/css/admin/theme-settings.min.css' ),
		);

		$settings = get_option( 'wp_rig_theme_settings', '' );

		wp_localize_script(
			'wp-rig-theme-settings',
			'wpRigThemeSettings',
			array(
				'nonce'    => wp_create_nonce( 'wp_rest' ),
				'settings' => $settings,
			)
		);
	}

	/**
	 * Adds an admin menu page for WP Rig settings.
	 */
	public function add_admin_menu(): void {
		add_menu_page(
			__( 'WP Rig Settings', 'wp-rig' ),
			__( 'WP Rig Settings', 'wp-rig' ),
			'manage_options',
			'wp-rig-settings',
			array( $this, 'render_settings_page' )
		);
	}

	/**
	 * Renders the settings page by including the settings-page.php file from the theme's inc/Options directory.
	 */
	public function render_settings_page(): void {
		require get_template_directory() . '/inc/Options/settings-page.php';
	}

	/**
	 * Registers the settings endpoint for the REST API.
	 */
	public function register_settings_endpoint(): void {
		register_rest_route(
			'my-theme/v1',
			'/settings',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'update_settings' ),
				'permission_callback' => array( $this, 'settings_permissions_check' ),
			)
		);
	}

	/**
	 * Updates settings based on the provided request.
	 *
	 * @param WP_REST_Request $request The request object containing 'settings' parameter.
	 *
	 * @return WP_REST_Response|WP_Error WP_REST_Response on success, or WP_Error on failure due to invalid settings.
	 */
	public function update_settings( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$settings = $request->get_param( 'settings' );

		if ( ! is_array( $settings ) ) {
			return new WP_Error( 'invalid_settings', 'Invalid settings.', array( 'status' => 400 ) );
		}

		$settings = $this->sanitize_theme_settings( $settings );

		update_option( 'wp_rig_theme_settings', $settings );

		return new WP_REST_Response(
			array(
				'success'  => true,
				'settings' => $settings,
			),
			200
		);
	}

	/**
	 * Sanitizes theme settings by key.
	 *
	 * @param array $settings The settings array to be sanitized.
	 *
	 * @return array The sanitized settings array.
	 */
	public function sanitize_theme_settings( array $settings ): array {
		$sanitized_settings = array();
		foreach ( $settings as $key => $value ) {
			$sanitized_key = sanitize_key( $key );

			switch ( $sanitized_key ) {
				case 'email_option':
					$sanitized_settings[ $sanitized_key ] = sanitize_email( $value );
					break;
				case 'url_option':
					$sanitized_settings[ $sanitized_key ] = esc_url_raw( $value );
					break;
				default:
					$sanitized_settings[ $sanitized_key ] = sanitize_text_field( $value );
					break;
			}
		}

		return $sanitized_settings;
	}

	/**
	 * Checks whether the current user has permission to manage settings.
	 *
	 * @param WP_REST_Request $request The current request instance.
	 *
	 * @return bool True if the user has the 'manage_options' capability, false otherwise.
	 */
	public function settings_permissions_check( WP_REST_Request $request ): bool {
		return current_user_can( 'manage_options' );
	}
}
