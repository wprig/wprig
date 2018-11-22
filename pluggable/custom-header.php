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
				'default-image'      => '',
				'default-text-color' => '000000',
				'width'              => 1600,
				'height'             => 250,
				'flex-height'        => true,
				'wp-head-callback'   => function() {
					$header_text_color = get_header_textcolor();

					if ( get_theme_support( 'custom-header', 'default-text-color' ) === $header_text_color ) {
						return;
					}

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
				},
			)
		)
	);
}
add_action( 'after_setup_theme', __NAMESPACE__ . '\\setup_custom_header' );
