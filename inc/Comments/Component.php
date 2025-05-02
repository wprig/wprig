<?php
/**
 * WP_Rig\WP_Rig\Comments\Component class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Comments;

use WP_Rig\WP_Rig\Component_Interface;
use WP_Rig\WP_Rig\Templating_Component_Interface;
use function add_action;
use function is_singular;
use function comments_open;
use function get_option;
use function wp_enqueue_script;
use function wp_list_comments;
use function the_comments_navigation;

/**
 * Class for managing comments UI.
 *
 * Exposes template tags:
 * * `wp_rig()->the_comments( array $args = array() )`
 *
 */
class Component implements Component_Interface, Templating_Component_Interface {

	/**
	 * Gets the unique identifier for the theme component.
	 *
	 * @return string Component slug.
	 */
	public function get_slug(): string {
		return 'comments';
	}

	/**
	 * Adds the action and filter hooks to integrate with WordPress.
	 */
	public function initialize() {
		add_action( 'wp_enqueue_scripts', array( $this, 'action_enqueue_comment_reply_script' ) );
	}

	/**
	 * Gets template tags to expose as methods on the Template_Tags class instance, accessible through `wp_rig()`.
	 *
	 * @return array Associative array of $method_name => $callback_info pairs. Each $callback_info must either be
	 *               a callable or an array with key 'callable'. This approach is used to reserve the possibility of
	 *               adding support for further arguments in the future.
	 */
	public function template_tags(): array {
		return array(
			'the_comments' => array( $this, 'the_comments' ),
		);
	}

	/**
	 * Enqueues the WordPress core 'comment-reply' script as necessary.
	 */
	public function action_enqueue_comment_reply_script() {

		// Enqueue comment script on singular post/page views only.
		if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
			wp_enqueue_script( 'comment-reply' );
		}
	}

	/**
	 * Filters the comment form default arguments.
	 *
	 * Change the heading level to h2 when there are no comments.
	 *
	 * @param array $args The default comment form arguments.
	 * @return array      Modified comment form arguments.
	 */
	public function filter_comment_form_defaults( array $args ): array {
		if ( ! get_comments_number() ) {
			$args['title_reply_before'] = '<h2 id="reply-title" class="comment-reply-title">';
			$args['title_reply_after']  = '</h2>';
		}

		return $args;
	}

	/**
	 * Displays the list of comments for the current post.
	 *
	 * Internally this method calls `wp_list_comments()`. However, in addition to that it will render the wrapping
	 * element for the list, so that must not be added manually.
	 *
	 * @param array $args Optional. Array of arguments. See `wp_list_comments()` documentation for a list of supported
	 *                    arguments.
	 */
	public function the_comments( array $args = array() ) {
		$args = array_merge(
			$args,
			array(
				'style'      => 'ol',
				'short_ping' => true,
			)
		);

		?>
		<ol class="comment-list">
			<?php wp_list_comments( $args ); ?>
		</ol><!-- .comment-list -->
		<?php

		the_comments_navigation();
	}
}
