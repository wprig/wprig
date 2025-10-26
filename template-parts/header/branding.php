<?php
/**
 * Displays the site branding.
 *
 * @package WP_Rig
 */

namespace WP_Rig\WP_Rig;

?>
<div class="site-branding flex-1">

	<?php the_custom_logo(); ?>

	<?php
	// Check if the "Display Site Title and Tagline" customizer setting is checked.
	if ( get_theme_mod( 'display_header_text', true ) ) {
		?>

		<?php if ( is_front_page() && is_home() ) : ?>
			<h1 class="site-title"><a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home"><?php bloginfo( 'name' ); ?></a></h1>
		<?php else : ?>
			<p class="site-title"><a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home"><?php bloginfo( 'name' ); ?></a></p>
		<?php endif; ?>

		<?php
		$wprig_description = get_bloginfo( 'description', 'display' );
		if ( $wprig_description || is_customize_preview() ) :
			?>
			<p class="site-description">
				<?php echo $wprig_description; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			</p>
		<?php endif; ?>

	<?php } // End of the display_header_text check. ?>

</div>
