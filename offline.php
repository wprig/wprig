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

get_header(); ?>

	<main id="primary" class="site-main">

		<section class="error-offline not-found">
			<header class="page-header">
				<h1 class="page-title"><?php esc_html_e( 'Oops! It looks like you&#8217;re offline.', 'wp-rig' ); ?></h1>
			</header><!-- .page-header -->

			<div class="page-content">
				<?php
				if ( function_exists( 'wp_service_worker_error_message_placeholder' ) ) {
					wp_service_worker_error_message_placeholder();
				}
				?>
			</div><!-- .page-content -->
		</section><!-- .error-offline -->

	</main><!-- #primary -->

<?php
get_footer();
