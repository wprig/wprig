<?php
/**
 * WP_Rig\WP_Rig\Jetpack\Component class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Jetpack;

use WP_Rig\WP_Rig\Component_Interface;
use function add_action;
use function add_theme_support;
use function have_posts;
use function the_post;
use function is_search;
use function get_template_part;
use function get_post_type;

/**
 * Class for adding Jetpack plugin support.
 */
class Component implements Component_Interface {

	/**
	 * Gets the unique identifier for the theme component.
	 *
	 * @return string Component slug.
	 */
	public function get_slug() : string {
		return 'jetpack';
	}

	/**
	 * Adds the action and filter hooks to integrate with WordPress.
	 */
	public function initialize() {
		add_action( 'after_setup_theme', [ $this, 'action_add_jetpack_support' ] );
	}

	/**
	 * Adds theme support for the Jetpack plugin.
	 *
	 * See: https://jetpack.com/support/infinite-scroll/
	 * See: https://jetpack.com/support/responsive-videos/
	 * See: https://jetpack.com/support/content-options/
	 */
	public function action_add_jetpack_support() {

		// Add theme support for Infinite Scroll.
		add_theme_support(
			'infinite-scroll',
			[
				'container' => 'primary',
				'footer'    => 'page',
				'render'    => function() {
					while ( have_posts() ) {
						the_post();
						if ( is_search() ) {
							get_template_part( 'template-parts/content/entry', 'search' );
						} else {
							get_template_part( 'template-parts/content/entry', get_post_type() );
						}
					}
				},
			]
		);

		// Add theme support for Responsive Videos.
		add_theme_support( 'jetpack-responsive-videos' );

		// Add theme support for Content Options.
		add_theme_support(
			'jetpack-content-options',
			[
				'post-details' => [
					'stylesheet' => 'wp-rig-content',
					'date'       => '.posted-on',
					'categories' => '.category-links',
					'tags'       => '.tag-links',
					'author'     => '.posted-by',
					'comment'    => '.comments-link',
				],
			]
		);
	}
}
