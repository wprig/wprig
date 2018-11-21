<?php
/**
 * Custom Header feature
 *
 * @link https://developer.wordpress.org/themes/functionality/custom-headers/
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig;

/**
 * Set up the WordPress core custom header feature.
 *
 * @uses header_style()
 */
function setup_custom_header() {
	add_theme_support(
		'custom-header',
		apply_filters(
			'wp_rig_custom_header_args',
			array(
				'default-image'          => '',
				'default-text-color'     => '000000',
				'width'                  => 1600,
				'height'                 => 250,
				'flex-height'            => true,
				'wp-head-callback'       => __NAMESPACE__ . '\\header_style',
			)
		)
	);
}
add_action( 'after_setup_theme', __NAMESPACE__ . '\\setup_custom_header' );

if ( ! function_exists( __NAMESPACE__ . '\\header_style' ) ) :
	/**
	 * Styles the header image and text displayed on the blog.
	 *
	 * @see setup_custom_header().
	 */
	function header_style() {
		$header_text_color = get_header_textcolor();

		/*
		 * If no custom options for text are set, let's bail.
		 * get_header_textcolor() options: Any hex value, 'blank' to hide text. Default: add_theme_support( 'custom-header' ).
		 */
		if ( get_theme_support( 'custom-header', 'default-text-color' ) === $header_text_color ) {
			return;
		}

		// If we get this far, we have custom styles. Let's do this.
		?>
		<style type="text/css">
		<?php
		// Has the text been hidden?
		if ( ! display_header_text() ) :
			?>
			.site-title,
			.site-description {
				position: absolute;
				clip: rect(1px, 1px, 1px, 1px);
			}
			<?php
			// If the user has set a custom color for the text use that.
		else :
			?>
			.site-title a,
			.site-description {
				color: #<?php echo esc_attr( $header_text_color ); ?>;
			}
		<?php endif; ?>
		</style>
		<?php
	}
endif;
