<?php
/**
 * Template part for displaying the header navigation menu
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig;

if ( ! wp_rig()->is_primary_nav_menu_active() ) {
	return;
}

?>
<div class="primary-menu-container flex-grow">
	<div class="mobile-menu-header">
		<?php get_template_part( 'template-parts/header/mobile-menu-toggle' ); ?>
		<?php get_template_part( 'template-parts/header/branding' ); ?>
	</div>
	<nav id="<?php echo apply_filters( 'wp_rig_site_navigation_id', 'site-navigation' ); /* phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped */ ?>" class="<?php echo apply_filters( 'wp_rig_site_navigation_classes', 'main-navigation nav--toggle-sub nav--toggle-small' ); /* phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped */ ?>" aria-label="<?php esc_attr_e( 'Main menu', 'wp-rig' ); ?>">
		<?php wp_rig()->display_primary_nav_menu( array( 'menu_id' => 'primary-menu' ) ); ?>
	</nav><!-- #site-navigation -->
</div>
