<?php
/**
 * The template for displaying all pages
 *
 * @link https://codex.wordpress.org/Template_Hierarchy
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig;

get_header();

/*
 * Include the component stylesheet for the content.
 * This call runs only once on index and archive pages.
 * At some point, override functionality should be built in similar to the template part below.
 *
 * Note: If this was already done it will be skipped.
 */
wp_print_styles( array( 'wp-rig-content' ) );

?>
	<main id="primary" class="site-main">
		<?php

		while ( have_posts() ) {
			the_post();

			get_template_part( 'template-parts/content/entry', 'page' );
		}
		?>
	</main><!-- #primary -->
<?php
get_sidebar();
get_footer();
