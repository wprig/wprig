<?php
/**
 * Template part for displaying a post's footer
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig;

?>
<footer class="entry-footer">
	<?php get_template_part( 'template-parts/content/entry_taxonomies', get_post_type() ); ?>

	<?php get_template_part( 'template-parts/content/entry_actions', get_post_type() ); ?>
</footer><!-- .entry-footer -->
