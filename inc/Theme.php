<?php
/**
 * WP_Rig\WP_Rig\Theme class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig;

use InvalidArgumentException;
use function esc_html__;
use function esc_html;
use function get_stylesheet_directory;
use function apply_filters;

/**
 * Main class for the theme.
 *
 * This class takes care of initializing theme features and available template tags.
 */
class Theme {

	/**
	 * Associative array of theme components, keyed by their slug.
	 *
	 * @var array
	 */
	protected $components = array();

	/**
	 * Active Theme instance.
	 *
	 * @var Theme|null
	 */
	protected static ?Theme $instance = null;

	/**
	 * The template tags instance, providing access to all available template tags.
	 *
	 * @var \WP_Rig\WP_Rig\Template_Tags
	 */
	protected \WP_Rig\WP_Rig\Template_Tags $template_tags;

	/**
	 * Theme configuration.
	 *
	 * @var array
	 */
	protected array $config = array();

	/**
	 * Constructor.
	 *
	 * Sets the theme components.
	 *
	 * @param array $components Optional. List of theme components. Only intended for custom initialization, typically
	 *                          the theme components are declared by the theme itself. Each theme component must
	 *                          implement the Component_Interface interface.
	 *
	 * @throws InvalidArgumentException Thrown if one of the $components does not implement Component_Interface.
	 */
	public function __construct( array $components = array() ) {
		self::$instance = $this;

		if ( array() === $components ) {
			$components = $this->get_default_components();
		}

		// Set the components.
		foreach ( $components as $component ) {

			// Bail if a component is invalid.
			if ( ! $component instanceof Component_Interface ) {
				throw new InvalidArgumentException(
					sprintf(
						/* translators: 1: classname/type of the variable, 2: interface name */
						esc_html__( 'The theme component %1$s does not implement the %2$s interface.', 'wp-rig' ),
						esc_html( gettype( $component ) ),
						Component_Interface::class
					)
				);
			}

			if ( isset( $this->components[ $component->get_slug() ] ) ) {
				_doing_it_wrong(
					__METHOD__,
					sprintf(
						/* translators: %s: component slug */
						esc_html__( 'Theme component slug collision: "%s" already exists and will be overwritten.', 'wp-rig' ),
						esc_html( $component->get_slug() )
					),
					'WP Rig 2.0.0'
				);
			}

			$this->components[ $component->get_slug() ] = $component;
		}

		// Instantiate the template tags instance for all theme templating components.
		$this->template_tags = new Template_Tags(
			array_filter(
				$this->components,
				function ( Component_Interface $component ) {
					return $component instanceof Templating_Component_Interface;
				}
			)
		);
	}

	/**
	 * Adds the action and filter hooks to integrate with WordPress.
	 *
	 * This method must only be called once in the request lifecycle.
	 */
	public function initialize() {
		array_walk(
			$this->components,
			function ( Component_Interface $component ) {
				$component->initialize();
			}
		);
	}

	/**
	 * Retrieves the active Theme instance if one exists.
	 *
	 * @return Theme|null Theme instance or null.
	 */
	public static function get_instance(): ?Theme {
		return self::$instance;
	}

	/**
	 * Retrieves the template tags instance, the entry point exposing template tag methods.
	 *
	 * Calling `wp_rig()` is a short-hand for calling this method on the main theme instance. The instance then allows
	 * for actual template tag methods to be called. For example, if there is a template tag called `posted_on`, it can
	 * be accessed via `wp_rig()->posted_on()`.
	 *
	 * @return Template_Tags Template tags instance.
	 */
	public function template_tags(): Template_Tags {
		return $this->template_tags;
	}

	/**
	 * Retrieves the theme configuration, merged with defaults.
	 *
	 * @param string $filename Optional. The configuration filename. Default 'config.json'.
	 * @return array Merged configuration array.
	 */
	public function get_config( string $filename = 'config.json' ): array {
		if ( isset( $this->config[ $filename ] ) ) {
			return $this->config[ $filename ];
		}

		$config = array();

		// Handle config.json specifically with its default.json counterpart.
		if ( 'config.json' === $filename ) {
			$config = get_config_content( 'config.default.json' ) ?? array();
		}

		$custom_config = get_config_content( $filename );
		if ( is_array( $custom_config ) ) {
			$config = array_replace_recursive( $config, $custom_config );
		}

		/**
		 * Filters the theme configuration.
		 *
		 * @param array  $config   The merged configuration.
		 * @param string $filename The configuration filename.
		 */
		$this->config[ $filename ] = apply_filters( 'wprig_theme_config', $config, $filename );

		return $this->config[ $filename ];
	}

	/**
	 * Retrieves the theme components.
	 *
	 * @return array List of theme components, keyed by their slug.
	 */
	public function get_components(): array {
		return $this->components;
	}

	/**
	 * Gets the asset manifests from all components.
	 *
	 * @param string $type Asset type ('styles' or 'scripts').
	 * @return array Aggregated asset manifests.
	 */
	public function get_asset_manifests( string $type ): array {
		$manifests = array();

		foreach ( $this->components as $component ) {
			if ( $component instanceof Asset_Provider ) {
				$manifest = $component->get_asset_manifest();
				if ( ! empty( $manifest[ $type ] ) ) {
					foreach ( $manifest[ $type ] as $handle => $data ) {
						$manifests[ $handle ] = $data;
					}
				}
			}
		}

		return $manifests;
	}

	/**
	 * Retrieves the component for a given slug.
	 *
	 * This should typically not be used from outside of the theme classes infrastructure.
	 *
	 * @param string $slug Slug identifying the component.
	 * @return Component_Interface Component for the slug.
	 *
	 * @throws InvalidArgumentException Thrown when no theme component with the given slug exists.
	 */
	public function component( string $slug ): Component_Interface {
		if ( ! isset( $this->components[ $slug ] ) ) {
			throw new InvalidArgumentException(
				sprintf(
					/* translators: %s: slug */
					esc_html__( 'No theme component with the slug %s exists.', 'wp-rig' ),
					esc_html( $slug )
				)
			);
		}

		return $this->components[ $slug ];
	}

	/**
	 * Gets the default theme components.
	 *
	 * This method is called if no components are passed to the constructor, which is the common scenario.
	 *
	 * It dynamically scans the `inc/` directory for subdirectories containing a `Component.php` file
	 * and instantiates each component class that follows the standard naming convention.
	 *
	 * @return array List of theme components to use by default.
	 */
	protected function get_default_components(): array {
		static $cached_components = null;

		if ( null !== $cached_components ) {
			return $cached_components;
		}
		$components = array();
		// Get the stylesheet/theme directory path.
		$inc_dir       = get_stylesheet_directory() . '/inc';
		$manifest_file = $inc_dir . '/components-manifest.json';

		$manifest = array();
		if ( file_exists( $manifest_file ) ) {
			$manifest_json = get_asset_content( $manifest_file );
			$manifest      = $manifest_json ? json_decode( $manifest_json, true ) : array();
		}

		$component_classes = array();

		// Use manifest-driven approach if manifest exists and is not empty.
		if ( ! empty( $manifest ) && is_array( $manifest ) ) {
			foreach ( array_keys( $manifest ) as $component_name ) {
				$normalized_name                       = $this->normalize_component_name( $component_name );
				$component_classes[ $normalized_name ] = __NAMESPACE__ . '\\' . $normalized_name . '\\Component';
			}
		} else {
			// Fallback to directory scanning if no manifest is found.
			// Iterate through subdirectories in the inc/ directory.
			$directories = glob( $inc_dir . '/*', GLOB_ONLYDIR );

			foreach ( $directories as $directory ) {
				$component_name  = basename( $directory );
				$normalized_name = $this->normalize_component_name( $component_name );

				// Only add if Component.php exists.
				if ( file_exists( $directory . '/Component.php' ) ) {
					$component_classes[ $normalized_name ] = __NAMESPACE__ . '\\' . $normalized_name . '\\Component';
				}
			}
		}

		// Instantiate all identified components.
		foreach ( $component_classes as $component_class ) {
			// Check if the component class exists and implements Component_Interface.
			// The class name is resolved by the registered theme autoloader, either Composer PSR-4 or WP Rig's fallback autoloader.
			if ( class_exists( $component_class ) ) {
				// Check for optional is_active() static method to support conditional loading.
				if ( method_exists( $component_class, 'is_active' ) && ! $component_class::is_active() ) {
					continue;
				}
				$components[] = new $component_class();
			}
		}

		/**
		 * Filters the default theme components.
		 *
		 * This filter allows adding or removing theme components at runtime.
		 *
		 * @param array $components List of theme component instances.
		 */
		$components = apply_filters( 'wprig_theme_components', $components );

		$cached_components = $components;

		return $components;
	}

	/**
	 * Normalizes a component name to PascalCase with underscores.
	 *
	 * @param string $name Component name (slug or directory name).
	 * @return string Normalized component name.
	 */
	protected function normalize_component_name( string $name ): string {
		$normalized = str_replace( ' ', '_', ucwords( str_replace( array( '-', '_' ), ' ', $name ) ) );

		// Ensure the name is a valid PHP identifier.
		// If it starts with a number, prepend an underscore.
		if ( preg_match( '/^\d/', $normalized ) ) {
			$normalized = '_' . $normalized;
		}

		return $normalized;
	}
}
