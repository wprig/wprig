<?php
/**
 * Content to display in Theme Settings admin page.
 * React loads in the app container div wp-rig-settings-page.
 *
 * @package wp_rig
 */

wp_enqueue_style(
	'wp-components'
);
?>
<div class="wrap">
	<h1><?php esc_html_e( 'Theme Settings', 'wp-rig' ); ?></h1>
	<div id="wp-rig-settings-page"></div>
</div><?php
