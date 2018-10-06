<?php
/**
 * The sidebar containing the main widget area
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package wp_rig
 */

if ( ! is_active_sidebar( 'sidebar-1' ) ) {
	return;
}
?>

<?php wp_print_styles( array( 'wp-rig-sidebar', 'wp-rig-widgets' ) ); ?>
<aside id="secondary" class="primary-sidebar widget-area">
	<?php dynamic_sidebar( 'sidebar-1' ); ?>
</aside><!-- #secondary -->
