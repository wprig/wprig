<?php
/**
 * Template part for displaying the page content when a 500 error has occurred
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig;

?>
<section class="error">
	<header class="page-header">
		<h1 class="page-title">
			<?php esc_html_e( 'Oops! Something went wrong.', 'wp-rig' ); ?>
		</h1>
	</header><!-- .page-header -->

	<div class="page-content">
		<?php
		if ( function_exists( 'wp_service_worker_error_message_placeholder' ) ) {
			wp_service_worker_error_message_placeholder();
		}
		if ( function_exists( 'wp_service_worker_error_details_template' ) ) {
			wp_service_worker_error_details_template();
		}
		?>
	</div><!-- .page-content -->
</section><!-- .error -->
