<?php
/**
 * The template for displaying 500 pages (internal server errors)
 *
 * @link https://github.com/xwp/pwa-wp#offline--500-error-handling
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig;

get_header(); ?>

	<main id="primary" class="site-main">

		<section class="error-500 not-found">
			<header class="page-header">
				<h1 class="page-title"><?php esc_html_e( 'Oops! Something went wrong.', 'wp-rig' ); ?></h1>
			</header><!-- .page-header -->

			<div class="page-content">
				<p><?php esc_html_e( 'Something prevented the page from being rendered. Please try again.', 'wp-rig' ); ?></p>

				<?php
				if ( function_exists( 'wp_service_worker_error_details_template' ) ) {
					wp_service_worker_error_details_template();
				}
				?>
			</div><!-- .page-content -->
		</section><!-- .error-500 -->

	</main><!-- #primary -->

<?php
get_footer();
