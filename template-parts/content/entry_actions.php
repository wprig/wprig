<?php
/**
 * Template part for displaying a post's comment and edit links
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig;

?>
<div class="entry-actions">
	<?php
	if ( ! is_singular( get_post_type() ) && ! post_password_required() && post_type_supports( get_post_type(), 'comments' ) && comments_open() ) {
		?>
		<span class="comments-link">
			<?php
			comments_popup_link(
				sprintf(
					wp_kses(
						/* translators: %s: post title */
						__( 'Leave a Comment<span class="screen-reader-text"> on %s</span>', 'wp-rig' ),
						[
							'span' => [
								'class' => [],
							],
						]
					),
					get_the_title()
				)
			);
			?>
		</span>
		<?php
	}

	edit_post_link(
		sprintf(
			wp_kses(
				/* translators: %s: post title */
				__( 'Edit <span class="screen-reader-text">%s</span>', 'wp-rig' ),
				[
					'span' => [
						'class' => [],
					],
				]
			),
			get_the_title()
		),
		'<span class="edit-link">',
		' </span>'
	);
	?>
</div><!-- .entry-actions -->
