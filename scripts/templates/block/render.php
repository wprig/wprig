<?php
/**
 * Dynamic block render template.
 *
 * WordPress includes this file when block.json contains: "render": "file:./render.php"
 * Variables provided by core at include-time:
 * - $attributes (array) Block attributes from block.json and user input.
 * - $content (string)   Rendered inner blocks HTML (if the block supports innerBlocks).
 * - $block (WP_Block)   Block instance (may be null in some contexts).
 *
 * This template echoes markup; WordPress captures the output as the block’s HTML.
 *
 * @link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#render
 * @package wp_rig
 */

declare( strict_types=1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use function WP_Rig\WP_Rig\wp_rig;

// Normalize core-provided variables with sane defaults.
$attributes = is_array( $attributes ?? null ) ? $attributes : array();
$content    = is_string( $content ?? null ) ? $content : '';
/** @var WP_Block|null $block */
$block      = ( isset( $block ) && $block instanceof WP_Block ) ? $block : null;

// Derive the block title via namespaced helper with smart fallbacks.
$title     = wp_rig()->block_get_title( $block );
$has_title = '' !== $title;

// Build wrapper attributes via namespaced helper (it handles core fallback internally).
$wrapper_attrs = wp_rig()->block_wrapper_attributes( array(), $attributes );

?>
<div <?php echo $wrapper_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<?php if ( $has_title ) : ?>
		<h3 class="wp-block-heading"><?php echo esc_html( $title ); ?></h3>
	<?php endif; ?>

	<?php
	// Inner blocks/content: already prepared by WordPress and safe to output as-is.
	// See https://developer.wordpress.org/reference/functions/render_block/
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo $content;
	?>
</div>
