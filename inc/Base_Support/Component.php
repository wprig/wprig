<?php
/**
 * WP_Rig\WP_Rig\Base_Support\Component class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Base_Support;

use WP_Rig\WP_Rig\Component_Interface;
use function add_action;
use function add_filter;
use function add_theme_support;
use function is_singular;
use function pings_open;
use function esc_url;
use function get_bloginfo;
use function wp_scripts;

/**
 * Class for adding basic theme support, most of which is mandatory to be implemented by all themes.
 *
 * Exposes template tags:
 * * `wp_rig()->get_version()`
 * * `wp_rig()->get_asset_version( string $filepath )`
 */
class Component implements Component_Interface {

	/**
	 * Gets the unique identifier for the theme component.
	 *
	 * @return string Component slug.
	 */
	public function get_slug(): string {
		return 'base_support';
	}

	/**
	 * Adds the action and filter hooks to integrate with WordPress.
	 */
	public function initialize() {
		add_action( 'init', array( $this, 'action_title_tag_support' ), -999 );
		add_action( 'after_setup_theme', array( $this, 'action_essential_theme_support' ), 1 );
		add_filter( 'theme_scandir_exclusions', array( $this, 'filter_scandir_exclusions_for_optional_templates' ) );
	}

	/**
	 * Adds title-tag theme support very early.
	 */
	public function action_title_tag_support() {
		add_theme_support( 'title-tag' );
	}

	/**
	 * Adds theme support for essential features.
	 */
	public function action_essential_theme_support() {
		// Add default RSS feed links to head.

		// Ensure WordPress theme features render in HTML5 markup.
		add_theme_support(
			'html5',
			array(
				'search-form',
				'comment-form',
				'comment-list',
				'gallery',
				'caption',
			)
		);

		// Add support for selective refresh for widgets.

		// Add support for responsive embedded content.
		add_theme_support( 'responsive-embeds' );
	}

				/**
	 * Excludes any directory named 'optional' from being scanned for theme template files.
	 *
	 * @link https://developer.wordpress.org/reference/hooks/theme_scandir_exclusions/
	 *
	 * @param array $exclusions the default directories to exclude.
	 * @return array Filtered exclusions.
	 */
	public function filter_scandir_exclusions_for_optional_templates( array $exclusions ): array {
		return array_merge(
			$exclusions,
			array( 'optional' )
		);
	}

	}
