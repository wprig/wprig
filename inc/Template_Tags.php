<?php
/**
 * WP_Rig\WP_Rig\Template_Tags class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig;

use InvalidArgumentException;
use BadMethodCallException;
use RuntimeException;

/**
 * Template tags entry point.
 *
 * This class provides access to all available template tag methods.
 *
 * Its instance can be accessed through `wp_rig()`. For example, if there is a template tag called `posted_on`, it can
 * be accessed via `wp_rig()->posted_on()`.
 */
class Template_Tags {

	use Versioning_Trait;

	/**
	 * Associative array of all available template tags.
	 *
	 * Method names are the keys, their callback information the values.
	 *
	 * @var array
	 */
	protected $template_tags = array();

	/**
	 * Constructor.
	 *
	 * Sets the theme components.
	 *
	 * @param array $components Optional. List of theme templating components. Each of these must implement the
	 *                          Templating_Component_Interface interface.
	 *
	 * @throws InvalidArgumentException Thrown if one of the $components does not implement
	 *                                  Templating_Component_Interface.
	 */
	public function __construct( array $components = array() ) {

		// Set the template tags for the components.
		foreach ( $components as $component ) {

			// Bail if a templating component is invalid.
			if ( ! $component instanceof Templating_Component_Interface ) {
				throw new InvalidArgumentException(
					sprintf(
						/* translators: 1: classname/type of the variable, 2: interface name */
						esc_html__( 'The theme templating component %1$s does not implement the %2$s interface.', 'wp-rig' ),
						esc_html( gettype( $component ) ),
						Templating_Component_Interface::class
					)
				);
			}

			$this->set_template_tags( $component );
		}
	}

	/**
	 * Magic call method.
	 *
	 * Will proxy to the template tag $method, unless it is not available, in which case an exception will be thrown.
	 *
	 * @param string $method Template tag name.
	 * @param array  $args   Template tag arguments.
	 * @return mixed Template tag result, or null if template tag only outputs markup.
	 *
	 * @throws BadMethodCallException Thrown if the template tag does not exist.
	 */
	public function __call( string $method, array $args ) {
		if ( ! isset( $this->template_tags[ $method ] ) ) {
			throw new BadMethodCallException(
				sprintf(
					/* translators: %s: template tag name */
					esc_html__( 'The template tag %s does not exist.', 'wp-rig' ),
					'wp_rig()->' . esc_html( $method ) . '()'
				)
			);
		}

		return call_user_func_array( $this->template_tags[ $method ]['callback'], $args );
	}

	/**
	 * Sets template tags for a given theme templating component.
	 *
	 * @param Templating_Component_Interface $component Theme templating component.
	 *
	 * @throws InvalidArgumentException Thrown when one of the template tags is invalid.
	 */
	protected function set_template_tags( Templating_Component_Interface $component ) {
		$tags = $component->template_tags();

		foreach ( $tags as $method_name => $callback ) {
			if ( is_callable( $callback ) ) {
				$callback = array( 'callback' => $callback );
			}

			if ( ! is_array( $callback ) || ! isset( $callback['callback'] ) ) {
				throw new InvalidArgumentException(
					sprintf(
						/* translators: 1: template tag method name, 2: component class name */
						esc_html__( 'The template tag method %1$s registered by theme component %2$s must either be a callable or an array.', 'wp-rig' ),
						esc_html( $method_name ),
						esc_html( get_class( $component ) )
					)
				);
			}

			if ( isset( $this->template_tags[ $method_name ] ) ) {
				// Log a warning instead of throwing a fatal exception to prevent site crashes.
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_trigger_error
					trigger_error(
						sprintf(
							/* translators: 1: template tag method name, 2: component class name */
							esc_html__( 'The template tag method %1$s registered by theme component %2$s conflicts with an already registered template tag of the same name. Skipping to avoid collision.', 'wp-rig' ),
							esc_html( $method_name ),
							esc_html( get_class( $component ) )
						),
						E_USER_WARNING
					);
				}
				continue;
			}

			$this->template_tags[ $method_name ] = $callback;
		}
	}


	/**
	 * Gets a theme asset from the assets directory.
	 *
	 * @param string $filename The name of the asset file (with extension).
	 * @param string $type The asset type/subdirectory (e.g., 'images', 'svg').
	 * @param bool   $content Whether to return the file contents (true) or URL (false).
	 * @return string|null The asset URL/contents or null if not found.
	 *
	 * @throws RuntimeException If the asset file cannot be read.
	 */
	public function get_theme_asset( string $filename, string $type = 'images', bool $content = false ): ?string {
		static $asset_cache = array();
		$cache_key          = md5( $filename . $type . ( $content ? 'content' : 'uri' ) );

		if ( isset( $asset_cache[ $cache_key ] ) ) {
			return $asset_cache[ $cache_key ];
		}

		$child_asset_path = get_stylesheet_directory() . '/assets/' . trim( $type, '/' ) . '/' . $filename;
		$child_asset_uri  = get_stylesheet_directory_uri() . '/assets/' . trim( $type, '/' ) . '/' . $filename;

		if ( file_exists( $child_asset_path ) ) {
			$asset_path = $child_asset_path;
			$asset_uri  = $child_asset_uri;
		} else {
			$asset_path = get_template_directory() . '/assets/' . trim( $type, '/' ) . '/' . $filename;
			$asset_uri  = get_template_directory_uri() . '/assets/' . trim( $type, '/' ) . '/' . $filename;
		}

		if ( ! file_exists( $asset_path ) ) {
			$asset_cache[ $cache_key ] = null;
			return null;
		}

		if ( $content ) {
			$file_contents = get_asset_content( $asset_path );

			$result = ( false !== $file_contents ) ? $file_contents : null;
		} else {
			$result = $asset_uri;
		}

		$asset_cache[ $cache_key ] = $result;
		return $result;
	}
}
