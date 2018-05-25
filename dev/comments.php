<?php
/**
 * The template for displaying comments
 *
 * This is the template that displays the area of the page that contains both the current comments
 * and the comment form.
 *
 * @link https://codex.wordpress.org/Template_Hierarchy
 *
 * @package wprig
 */

/*
 * If the current post is protected by a password and
 * the visitor has not yet entered the password we will
 * return early without loading the comments.
 */
if ( post_password_required() ) {
	return;
}
?>

<?php wp_print_styles( array( 'wprig-comments' ) ); ?>
<div id="comments" class="comments-area">

	<?php
	// You can start editing here -- including this comment!
	if ( have_comments() ) :
		?>
		<h2 class="comments-title">
			<?php
			$comment_count = get_comments_number();
			if ( 1 === $comment_count ) {
				printf(
					/* translators: 1: title. */
					esc_html_e( 'One thought on &ldquo;%1$s&rdquo;', 'wprig' ),
					'<span>' . get_the_title() . '</span>'
				);
			} else {
				printf( // WPCS: XSS OK.
					/* translators: 1: comment count number, 2: title. */
					esc_html( _nx( '%1$s thought on &ldquo;%2$s&rdquo;', '%1$s thoughts on &ldquo;%2$s&rdquo;', $comment_count, 'comments title', 'wprig' ) ),
					number_format_i18n( $comment_count ),
					'<span>' . get_the_title() . '</span>'
				);
			}
			?>
		</h2><!-- .comments-title -->

		<?php the_comments_navigation(); ?>

		<?php if ( wprig_using_amp_live_list_comments() ) : ?>
			<amp-live-list
				id="amp-live-comments-list-<?php the_ID(); ?>"
				<?php echo ( 'asc' === get_option( 'comment_order' ) ) ? ' sort="ascending" ' : ''; ?>
				data-poll-interval="<?php echo esc_attr( MINUTE_IN_SECONDS * 1000 ); ?>"
				data-max-items-per-page="<?php echo esc_attr( get_option( 'page_comments' ) ? get_option( 'comments_per_page' ) : 10000 ); ?>"
			>
		<?php endif; ?>

		<ol class="comment-list" <?php echo wprig_using_amp_live_list_comments() ? 'items' : ''; ?>>
			<?php
				wp_list_comments(
					array(
						'style'      => 'ol',
						'short_ping' => true,
					)
				);
			?>
		</ol><!-- .comment-list -->

		<?php
		if ( wprig_using_amp_live_list_comments() ) {
			add_filter( 'navigation_markup_template', 'wprig_add_amp_live_list_pagination_attribute' );
		}

		the_comments_navigation();

		if ( wprig_using_amp_live_list_comments() ) {
			remove_filter( 'navigation_markup_template', 'wprig_add_amp_live_list_pagination_attribute' );
		}
		?>
		<?php if ( wprig_using_amp_live_list_comments() ) : ?>
			<div update>
				<button class="button" on="tap:amp-live-comments-list-<?php the_ID(); ?>.update"><?php esc_html_e( 'New comment(s)', 'wprig' ); ?></button>
			</div>
			</amp-live-list>
		<?php endif; ?>

		<?php
		// If comments are closed and there are comments, let's leave a little note, shall we?
		if ( ! comments_open() ) :
			?>
			<p class="no-comments"><?php esc_html_e( 'Comments are closed.', 'wprig' ); ?></p>
			<?php
		endif;

	endif; // Check for have_comments().

	comment_form();
	?>

</div><!-- #comments -->
