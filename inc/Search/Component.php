<?php
/**
 * WP_Rig\WP_Rig\Search\Component class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Search;

use WP_Rig\WP_Rig\Component_Interface;
use WP_Customize_Manager;
use function add_action;

/**
 * Class for managing search results display.
 */
class Component implements Component_Interface {

	/**
	 * Gets the unique identifier for the theme component.
	 *
	 * @return string Component slug.
	 */
	public function get_slug() : string {
		return 'search';
	}

	/**
	 * Adds the action and filter hooks to integrate with WordPress.
	 */
	public function initialize() {
		add_action( 'customize_register', array( $this, 'action_customize_register_search' ) );
	}

	/**
	 * Adds a setting and control for search results in the Customizer.
	 *
	 * @param WP_Customize_Manager $wp_customize Customizer manager instance.
	 */
	public function action_customize_register_search( WP_Customize_Manager $wp_customize ) {
		$search_choices = array(
			'1' => __( 'Summary (default)', 'wp-rig' ),
			'0' => __( 'Full text', 'wp-rig' ),
		);

		$wp_customize->add_setting(
			'search_use_excerpt',
			array(
				'default'           => '1',
				'transport'         => 'postMessage',
				'sanitize_callback' => function( $input ) use ( $search_choices ) : string {
					if ( array_key_exists( $input, $search_choices ) ) {
						return $input;
					}

					return '';
				},
			)
		);

		$wp_customize->add_control(
			'search_use_excerpt',
			array(
				'label'           => __( 'Search results', 'wp-rig' ),
				'section'         => 'theme_options',
				'type'            => 'radio',
				'choices'         => $search_choices,
			)
		);
	}
}
