<?php
/**
 * The sidebar containing the main widget area
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig;

if ( ! class_exists( 'WP_Rig\WP_Rig\Sidebars\Component' ) || ! Sidebars\Component::is_active() || ! wp_rig()->is_primary_sidebar_active() ) {
	return;
}

wp_rig()->print_styles( 'wp-rig-sidebar', 'wp-rig-widgets' );

?>
<aside id="secondary" class="primary-sidebar widget-area" aria-label="Sidebar">
	<?php wp_rig()->display_primary_sidebar(); ?>
</aside><!-- #secondary -->
