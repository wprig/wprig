<?php
/**
 * Custom template tags for this theme
 *
 * Eventually, some of the functionality here could be replaced by core features.
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig;

use WP_Post;

/**
 * Prints the header of the current displayed page based on its contents.
 */
function index_header() {
	if ( is_home() && ! is_front_page() ) {
		?>
		<header>
			<h1 class="page-title screen-reader-text"><?php single_post_title(); ?></h1>
		</header>
		<?php
	} elseif ( is_search() ) {
		?>
		<header class="page-header">
			<h1 class="page-title">
			<?php
				/* translators: %s: search query. */
				printf( esc_html__( 'Search Results for: %s', 'wp-rig' ), '<span>' . get_search_query() . '</span>' );
			?>
			</h1>
		</header><!-- .page-header -->
		<?php
	} elseif ( is_archive() ) {
		?>
		<header class="page-header">
			<?php
				the_archive_title( '<h1 class="page-title">', '</h1>' );
				the_archive_description( '<div class="archive-description">', '</div>' );
			?>
		</header><!-- .page-header -->
		<?php
	}
}

/**
 * Prints HTML with meta information for the current post-date/time.
 */
function posted_on() {
	$time_string = '<time class="entry-date published updated" datetime="%1$s">%2$s</time>';
	if ( get_the_time( 'U' ) !== get_the_modified_time( 'U' ) ) {
		$time_string = '<time class="entry-date published" datetime="%1$s">%2$s</time><time class="updated" datetime="%3$s">%4$s</time>';
	}

	$time_string = sprintf(
		$time_string,
		esc_attr( get_the_date( 'c' ) ),
		esc_html( get_the_date() ),
		esc_attr( get_the_modified_date( 'c' ) ),
		esc_html( get_the_modified_date() )
	);

	$posted_on = sprintf(
		/* translators: %s: post date. */
		esc_html_x( 'Posted on %s', 'post date', 'wp-rig' ),
		'<a href="' . esc_url( get_permalink() ) . '" rel="bookmark">' . $time_string . '</a>'
	);

	echo '<span class="posted-on">' . $posted_on . ' </span>'; // WPCS: XSS OK.

}

/**
 * Prints HTML with meta information for the current author.
 */
function posted_by() {
	$byline = sprintf(
		/* translators: %s: post author. */
		esc_html_x( 'by %s', 'post author', 'wp-rig' ),
		'<span class="author vcard"><a class="url fn n" href="' . esc_url( get_author_posts_url( get_the_author_meta( 'ID' ) ) ) . '">' . esc_html( get_the_author() ) . '</a></span>'
	);

	echo '<span class="byline"> ' . $byline . ' </span>'; // WPCS: XSS OK.
}

/**
 * Prints a link list of the current categories for the post.
 *
 * If additional post types should display categories, add them to the conditional statement at the top.
 */
function post_categories() {
	// Only show categories on post types that have categories.
	if ( 'post' === get_post_type() ) {
		/* translators: used between list items, there is a space after the comma */
		$categories_list = get_the_category_list( esc_html__( ', ', 'wp-rig' ) );
		if ( $categories_list ) {
			/* translators: 1: list of categories. */
			printf( '<span class="cat-links">' . esc_html__( 'Posted in %1$s', 'wp-rig' ) . ' </span>', $categories_list ); // WPCS: XSS OK.
		}
	}
}

/**
 * Prints a link list of the current tags for the post.
 *
 * If additional post types should display tags, add them to the conditional statement at the top.
 */
function post_tags() {
	// Only show tags on post types that have categories.
	if ( 'post' === get_post_type() ) {
		/* translators: used between list items, there is a space after the comma */
		$tags_list = get_the_tag_list( '', esc_html_x( ', ', 'list item separator', 'wp-rig' ) );
		if ( $tags_list ) {
			/* translators: 1: list of tags. */
			printf( '<span class="tags-links">' . esc_html__( 'Tagged %1$s', 'wp-rig' ) . ' </span>', $tags_list ); // WPCS: XSS OK.
		}
	}
}

/**
 * Prints comments link when comments are enabled.
 */
function comments_link() {
	if ( ! is_single() && ! post_password_required() && ( comments_open() || get_comments_number() ) ) {
		echo '<span class="comments-link">';
		comments_popup_link(
			sprintf(
				wp_kses(
					/* translators: %s: post title */
					__( 'Leave a Comment<span class="screen-reader-text"> on %s</span>', 'wp-rig' ),
					array(
						'span' => array(
							'class' => array(),
						),
					)
				),
				get_the_title()
			)
		);
		echo ' </span>';
	}
}

/**
 * Prints edit post/page link when a user with sufficient priveleges is logged in.
 */
function edit_post_link() {
	\edit_post_link(
		sprintf(
			wp_kses(
				/* translators: %s: Name of current post. Only visible to screen readers */
				__( 'Edit <span class="screen-reader-text">%s</span>', 'wp-rig' ),
				array(
					'span' => array(
						'class' => array(),
					),
				)
			),
			get_the_title()
		),
		'<span class="edit-link">',
		' </span>'
	);
}

/**
 * Displays an optional post thumbnail.
 *
 * Wraps the post thumbnail in an anchor element on index views, or a div
 * element when on single views.
 */
function post_thumbnail() {
	if ( post_password_required() || is_attachment() || ! has_post_thumbnail() ) {
		return;
	}

	if ( is_singular() ) :
		?>

		<div class="post-thumbnail">
			<?php the_post_thumbnail( 'full', array( 'class' => 'skip-lazy' ) ); ?>
		</div><!-- .post-thumbnail -->

		<?php
	else :
		?>

		<a class="post-thumbnail" href="<?php the_permalink(); ?>" aria-hidden="true">
			<?php
			global $wp_query;
			if ( 0 === $wp_query->current_post ) {
				the_post_thumbnail(
					'full',
					array(
						'class' => 'skip-lazy',
						'alt'   => the_title_attribute(
							array(
								'echo' => false,
							)
						),
					)
				);
			} else {
				the_post_thumbnail(
					'post-thumbnail',
					array(
						'alt' => the_title_attribute(
							array(
								'echo' => false,
							)
						),
					)
				);
			}
			?>
		</a>

		<?php
	endif; // End is_singular().
}

/**
 * Prints HTML with title and link to original post where attachment was added.
 *
 * @param WP_Post $post object.
 */
function attachment_in( WP_Post $post ) {
	if ( ! empty( $post->post_parent ) ) :
		$postlink = sprintf(
			/* translators: %s: original post where attachment was added. */
			esc_html_x( 'in %s', 'original post', 'wp-rig' ),
			'<a href="' . esc_url( get_permalink( $post->post_parent ) ) . '">' . esc_html( get_the_title( $post->post_parent ) ) . '</a>'
		);

		echo '<span class="attachment-in"> ' . $postlink . ' </span>'; // WPCS: XSS OK.

	endif;

}

/**
 * Prints HTML with for navigation to previous and next attachment if available.
 */
function the_attachment_navigation() {
	?>
	<nav class="navigation post-navigation" role="navigation">
		<h2 class="screen-reader-text"><?php echo esc_html__( 'Post navigation', 'wp-rig' ); ?></h2>
		<div class="nav-links">
			<div class="nav-previous">
				<div class="post-navigation-sub">
					<?php echo esc_html__( 'Previous attachment:', 'wp-rig' ); ?>
				</div>
				<?php previous_image_link( false ); ?>
			</div><!-- .nav-previous -->
			<div class="nav-next">
				<div class="post-navigation-sub">
					<?php echo esc_html__( 'Next attachment:', 'wp-rig' ); ?>
				</div>
				<?php next_image_link( false ); ?>
			</div><!-- .nav-next -->
		</div><!-- .nav-links -->
	</nav><!-- .navigation .attachment-navigation -->
	<?php
}
