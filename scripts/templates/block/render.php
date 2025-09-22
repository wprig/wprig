<?php
/**
 * Template for dynamic block rendering.
 * Variables available in scope:
 * - $attributes (array)
 * - $content (string)
 * - $block (WP_Block)
 */

$attrs   = wp_parse_args( (array) $attributes, array() );
$title   = isset( $attrs['title'] ) ? sanitize_text_field( $attrs['title'] ) : '';
$classes = isset( $attrs['className'] ) ? sanitize_html_class( $attrs['className'] ) : '';
?>
<div class="wp-block <?php echo esc_attr( $classes ); ?>">
	<?php if ( $title ) : ?>
		<h3><?php echo esc_html( $title ); ?></h3>
	<?php endif; ?>
	<?php
	// $content is produced by inner blocks, already escaped appropriately upstream.
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo $content;
	?>
</div>
