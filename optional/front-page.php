<?php
/**
 * Render your site front page, whether the front page displays the blog posts index or a static page.
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/#front-page-display
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig;

get_header();
?>
	<main id="primary" class="site-main">
		<?php
		wp_print_styles( array( 'wp-rig-content', 'wp-rig-front-page' ) );

		while ( have_posts() ) {
			the_post();

			get_template_part( 'template-parts/content/entry', get_post_type() );
		}

		the_posts_navigation();
		?>
	</main><!-- #primary -->
<?php
get_sidebar();
get_footer();
