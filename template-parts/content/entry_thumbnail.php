<?php
/**
 * Template part for displaying a post's featured image
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig;

// Audio or video attachments can have featured images, so they need to be specifically checked.
$support_slug = get_post_type();
if ( 'attachment' === $support_slug ) {
	if ( wp_attachment_is( 'audio' ) ) {
		$support_slug .= ':audio';
	} elseif ( wp_attachment_is( 'video' ) ) {
		$support_slug .= ':video';
	}
}

if ( post_password_required() || ! post_type_supports( $support_slug, 'thumbnail' ) || ! has_post_thumbnail() ) {
	return;
}

if ( is_singular( get_post_type() ) ) {
	?>
	<div class="post-thumbnail">
		<?php the_post_thumbnail( 'wp-rig-featured', [ 'class' => 'skip-lazy' ] ); ?>
	</div><!-- .post-thumbnail -->
	<?php
} else {
	?>
	<a class="post-thumbnail" href="<?php the_permalink(); ?>" aria-hidden="true">
		<?php
		global $wp_query;
		if ( 0 === $wp_query->current_post ) {
			the_post_thumbnail(
				'post-thumbnail',
				[
					'class' => 'skip-lazy',
					'alt'   => the_title_attribute(
						[
							'echo' => false,
						]
					),
				]
			);
		} else {
			the_post_thumbnail(
				'post-thumbnail',
				[
					'alt' => the_title_attribute(
						[
							'echo' => false,
						]
					),
				]
			);
		}
		?>
	</a><!-- .post-thumbnail -->
	<?php
}
