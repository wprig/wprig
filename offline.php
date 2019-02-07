<?php
/**
 * The template for displaying offline pages
 *
 * @link https://github.com/xwp/pwa-wp#offline--500-error-handling
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig;

// Prevent showing nav menus.
add_filter( 'has_nav_menu', '__return_false' );

get_header();

/*
 * Include the component stylesheet for the content.
 * Note: If this was already done it will be skipped.
 */
wp_print_styles( array( 'wp-rig-content' ) );

?>
	<main id="primary" class="site-main">
		<?php get_template_part( 'template-parts/content/error', 'offline' ); ?>
	</main><!-- #primary -->
<?php
get_footer();
