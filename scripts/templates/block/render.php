<?php
/**
 * Render callback for the block.
 *
 * @param array  $attributes Block attributes.
 * @param string $content    Block content (if any).
 * @param object $block      WP_Block instance.
 * @return string Rendered HTML.
 */
function wprig_block_render_callback( $attributes, $content, $block ) {
	$attrs = wp_parse_args( (array) $attributes, array() );
	$title = isset( $attrs['title'] ) ? sanitize_text_field( $attrs['title'] ) : '';
	$classes = isset( $attrs['className'] ) ? sanitize_html_class( $attrs['className'] ) : '';
	ob_start();
	?>
	<div class="wp-block <?php echo esc_attr( $classes ); ?>">
		<?php if ( $title ) : ?>
			<h3><?php echo esc_html( $title ); ?></h3>
		<?php endif; ?>
		<?php echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
	</div>
	<?php
	return ob_get_clean();
}
