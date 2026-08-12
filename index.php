<?php
/**
 * The main template file
 *
 * This is the most generic template file in a WordPress theme.
 * It is used to display a page when nothing more specific matches a query.
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig;

get_header();

wp_rig()->print_styles( 'wp-rig-content' );
?>

<main id="primary" class="site-main">
	<?php
	if ( have_posts() ) {

		get_template_part( 'template-parts/content/page_header' );

		while ( have_posts() ) {
			the_post();

			get_template_part( 'template-parts/content/entry', get_post_type() );
		}

		if ( ! is_singular() ) {
			get_template_part( 'template-parts/content/pagination' );
		}
	} else {
		get_template_part( 'template-parts/content/error' );
	}
	?>
</main><!-- #primary -->

<?php
get_sidebar();
get_footer();
