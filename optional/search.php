<?php
/**
 * The template for displaying search results pages
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/#search-result
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig;

get_header();
?>
	<main id="primary" class="site-main">
		<?php
		if ( have_posts() ) {
			wp_print_styles( array( 'wp-rig-content' ) );
			get_template_part( 'template-parts/content/page_header' );

			while ( have_posts() ) {
				the_post();

				get_template_part( 'template-parts/content/entry', get_post_type() );
			}

			the_posts_pagination(
				array(
					'mid_size'           => 2,
					'prev_text'          => _x( 'Previous', 'previous set of search results', 'wp-rig' ),
					'next_text'          => _x( 'Next', 'next set of search results', 'wp-rig' ),
					'screen_reader_text' => __( 'Search results navigation', 'wp-rig' ),
				)
			);
		} else {
			get_template_part( 'template-parts/content/error' );
		}
		?>
	</main><!-- #primary -->
<?php
get_sidebar();
get_footer();
