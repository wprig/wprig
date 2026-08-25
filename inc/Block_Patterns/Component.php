<?php
/**
 * WP_Rig\WP_Rig\Block_Patterns\Component class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Block_Patterns;

use WP_Rig\WP_Rig\Component_Interface;
use WP_Rig\WP_Rig\Paradigm_Component_Trait;
use function add_action;
use function apply_filters;
use function get_file_data;
use function get_stylesheet_directory;
use function register_block_pattern;
use function register_block_pattern_category;
use function sanitize_title;
use function trailingslashit;
use function WP_Rig\WP_Rig\get_config;

/**
 * Class for managing block patterns as a native-first registry/organizer.
 *
 * Registers filterable, config-seeded pattern categories and registers block
 * patterns shipped inside installed components' bundled `patterns/` directories
 * (e.g. OCR components in Wave 2). WordPress' auto-registration of the theme's
 * own `patterns/` folder is left untouched, so bundled component patterns never
 * collide with theme-authored patterns.
 *
 * The WP core function `register_block_patterns_from_directory()` does not exist
 * (confirmed against WP 7.1 core), so the equivalent directory registration is
 * implemented locally here, mirroring `WP_Theme::get_block_patterns()` parsing.
 *
 * @since 3.5.0
 */
class Component implements Component_Interface {

	use Paradigm_Component_Trait;

	/**
	 * The paradigm tag gating this component.
	 *
	 * @var string
	 */
	const PARADIGM = 'block-based';

	/**
	 * Pattern file header keys mirroring `WP_Theme::get_block_patterns()`.
	 *
	 * @var array
	 */
	const PATTERN_HEADERS = array(
		'title'         => 'Title',
		'slug'          => 'Slug',
		'description'   => 'Description',
		'viewportWidth' => 'Viewport Width',
		'inserter'      => 'Inserter',
		'categories'    => 'Categories',
		'keywords'      => 'Keywords',
		'blockTypes'    => 'Block Types',
		'postTypes'     => 'Post Types',
		'templateTypes' => 'Template Types',
	);

	/**
	 * Pattern headers that are parsed as comma-separated lists.
	 *
	 * @var array
	 */
	const PROPERTIES_TO_PARSE = array(
		'categories',
		'keywords',
		'blockTypes',
		'postTypes',
		'templateTypes',
	);

	/**
	 * Gets the unique identifier for the theme component.
	 *
	 * @return string Component slug.
	 */
	public function get_slug(): string {
		return 'block_patterns';
	}

	/**
	 * Adds the action and filter hooks to integrate with WordPress.
	 */
	public function initialize() {
		add_action( 'init', array( $this, 'register_pattern_categories' ), 9 );
		add_action( 'init', array( $this, 'register_component_patterns' ) );
	}

	/**
	 * Registers the config-seeded, filterable pattern categories.
	 */
	public function register_pattern_categories() {
		$config     = get_config( 'config.json' );
		$categories = $config['patterns']['categories'] ?? array();

		/**
		 * Filters the pattern categories to register.
		 *
		 * @param array $categories Associative array of $category_slug => $label pairs.
		 */
		$categories = apply_filters( 'wprig_block_pattern_categories', $categories );

		foreach ( $categories as $slug => $label ) {
			if ( ! is_string( $slug ) || ! is_string( $label ) || '' === trim( $label ) ) {
				continue;
			}

			register_block_pattern_category(
				$slug,
				array(
					'label' => $label,
				)
			);
		}
	}

	/**
	 * Registers block patterns bundled in installed components' `patterns/` dirs.
	 */
	public function register_component_patterns() {
		$directories = $this->get_component_pattern_directories();

		/**
		 * Filters the list of component pattern directories to register.
		 *
		 * Lets OCR components (and themes) ship starter patterns without
		 * touching the theme's own `patterns/` folder.
		 *
		 * @param array $directories Absolute paths to `patterns/` directories.
		 */
		$directories = apply_filters( 'wprig_block_patterns', $directories );

		foreach ( $directories as $directory ) {
			$this->register_patterns_from_directory( $directory );
		}
	}

	/**
	 * Collects bundled `patterns/` directories from every installed component.
	 *
	 * @return array List of absolute `patterns/` directory paths.
	 */
	protected function get_component_pattern_directories(): array {
		$directories = array();
		$inc_dir     = trailingslashit( get_stylesheet_directory() ) . 'inc';

		if ( ! is_dir( $inc_dir ) ) {
			return $directories;
		}

		foreach ( glob( $inc_dir . '/*', GLOB_ONLYDIR ) as $component_dir ) {
			$patterns_dir = trailingslashit( $component_dir ) . 'patterns';

			if ( is_dir( $patterns_dir ) ) {
				$directories[] = $patterns_dir;
			}
		}

		return $directories;
	}

	/**
	 * Registers every pattern found in the given directory.
	 *
	 * Local equivalent of the non-existent core function
	 * `register_block_patterns_from_directory()`. Mirrors the header parsing in
	 * `WP_Theme::get_block_patterns()` and registers each pattern via
	 * `register_block_pattern()` with a `filePath` so content is resolved lazily.
	 *
	 * @param string $directory Absolute path to a `patterns/` directory.
	 */
	protected function register_patterns_from_directory( string $directory ) {
		$directory = trailingslashit( $directory );
		$files     = glob( $directory . '*.php' );

		if ( empty( $files ) ) {
			return;
		}

		// Namespace component patterns by their owning component directory so two
		// components shipping the same bare slug never collide. Core namespaces
		// theme patterns by stylesheet; this mirrors that for bundled components.
		$namespace = sanitize_title( basename( dirname( rtrim( $directory, '/' ) ) ) );

		foreach ( $files as $file ) {
			$pattern = get_file_data( $file, self::PATTERN_HEADERS );

			if ( empty( $pattern['slug'] ) || empty( $pattern['title'] ) ) {
				continue;
			}

			$pattern['filePath'] = $file;

			foreach ( self::PROPERTIES_TO_PARSE as $property ) {
				if ( ! empty( $pattern[ $property ] ) ) {
					$pattern[ $property ] = array_filter( wp_parse_list( (string) $pattern[ $property ] ) );
				} else {
					unset( $pattern[ $property ] );
				}
			}

			if ( ! empty( $pattern['viewportWidth'] ) ) {
				$pattern['viewportWidth'] = (int) $pattern['viewportWidth'];
			} else {
				unset( $pattern['viewportWidth'] );
			}

			if ( ! empty( $pattern['inserter'] ) ) {
				$pattern['inserter'] = in_array(
					strtolower( (string) $pattern['inserter'] ),
					array( 'yes', 'true' ),
					true
				);
			} else {
				unset( $pattern['inserter'] );
			}

			// Slugs carrying an explicit namespace are kept as authored; bare
			// slugs are prefixed with the owning component slug.
			$pattern_name = false !== strpos( (string) $pattern['slug'], '/' )
				? (string) $pattern['slug']
				: $namespace . '/' . $pattern['slug'];

			register_block_pattern( $pattern_name, $pattern );
		}
	}
}
