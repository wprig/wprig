<?php
/**
 * WP_Rig\WP_Rig\EZ_Customizer\Component class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\EZ_Customizer;

use WP_Customize_Color_Control;
use WP_Customize_Date_Time_Control;
use WP_Customize_Media_Control;
use WP_Customize_control;
use WP_Rig\WP_Rig\Component_Interface;
use function add_action;
use function get_theme_file_path;

/**
 * Class for managing Customizer integration.
 */
class Component implements Component_Interface {

	/**
	 * All theme settings - from JSON file.
	 *
	 * @var $theme_settings array
	 */
	public $theme_settings;

	/**
	 * The wp_customize class instance.
	 *
	 * @var $wp_customize object
	 */
	private $wp_customize;

	/**
	 * The settings_id for set of settings.
	 *
	 * @var $settings_id string
	 */
	private $settings_id;

	/**
	 * Gets the unique identifier for the theme component.
	 *
	 * @return string Component slug.
	 */
	public function get_slug() : string {
		return 'ez_customizer';
	}

	/**
	 * Adds the action and filter hooks to integrate with WordPress.
	 */
	public function initialize() {
		$this->get_theme_settings_config();
		$this->settings_id = $this->theme_settings['settings_id'];
		$this->hooks();
	}

	/**
	 * Setup all hooks for the class.
	 */
	private function hooks() {
		add_action( 'customize_register', array( $this, 'ez_customizer_settings_register' ) );
	}

	/**
	 * Triggers the registering of all sections and settings passed in from the JSON file.
	 *
	 * @param object $wp_customize WP_Customize main class.
	 */
	public function ez_customizer_settings_register( $wp_customize ) {
		$this->wp_customize = $wp_customize;
		$this->register_sections();
		$this->add_settings();
	}

	/**
	 * Retrieves the theme settings from the JSON file and stores them in class-level variable.
	 */
	private function get_theme_settings_config() {
		$theme_settings_json  = file_get_contents( get_theme_file_path() . '/inc/EZ_Customizer/themeCustomizeSettings.json' );
		$this->theme_settings = apply_filters( 'wp_rig_customizer_settings', json_decode( $theme_settings_json, FILE_USE_INCLUDE_PATH ) );
	}

	/**
	 * Registers all sections.
	 */
	private function register_sections() {
		foreach ( $this->theme_settings['sections'] as $section ) {
			$section_id   = $this->settings_id . '_' . $section['id'] . '_section';
			$section_args = $section;
			$this->wp_customize->add_section( $section_id, $section_args );
		}
	}

	/**
	 * Registers all settings.
	 */
	private function add_settings() {
		foreach ( $this->theme_settings['settings'] as $setting ) {
			$setting_args = $this->get_settings_args( $setting );
			$setting      = $this->clean_setting_array( $setting );
			$this->wp_customize->add_setting( $setting['id'], $setting_args );

			if ( ! isset( $setting['type'] ) ) {
				$control = array(
					'id'      => $this->theme_settings['theme_name'] . '_theme_' . $setting['id'],
					'label'   => $setting['label'],
					'section' => $args['section'] = $this->settings_id . '_' . $setting['section'] . '_section',
				);
				$this->wp_customize->add_control( $setting['id'], $control );
			} else {
				$this->wp_customize->add_control( $this->get_type_control( $setting ) );
			}
		}
	}

	/**
	 * Changing some nomenclature to play nice with WP.
	 *
	 * @param array $setting Definition of setting values.
	 * @return array Definition of setting values.
	 */
	private function get_settings_args( array $setting ) {
		$setting_args = array();
		if ( isset( $setting['refresh'] ) && ! $setting['refresh'] ) {
			$setting_args['transport'] = 'postMessage';
			unset( $setting['refresh'] );
		}
		if ( isset( $setting['default'] ) ) {
			$setting_args['default'] = $setting['default'];
			unset( $setting['default'] );
		}
		return $setting_args;
	}

	/**
	 * Clean up the settings array a bit to keep things standard.
	 *
	 * @param array $setting Definition of setting values.
	 * @return array Definition of setting values.
	 */
	private function clean_setting_array( array $setting ) {
		unset( $setting['refresh'] );
		unset( $setting['default'] );
		return $setting;
	}

	/**
	 * Retrieve appropriate type control depending on the field type.
	 *
	 * @param array $setting Definition of setting values.
	 * @return object respective Control Object.
	 */
	private function get_type_control( array $setting ) {
		$control_id = $this->theme_settings['theme_name'] . '_theme_' . $setting['id'];
		/**
		 * Here we are basing our control args on the initial settings array
		 * Refer to https://developer.wordpress.org/reference/classes/wp_customize_control/ for acceptable args.
		 */
		$args = $setting;
		/* Altering values that we simplified for class instantiation where needed. */
		$args['section']  = $this->settings_id . '_' . $setting['section'] . '_section';
		$args['settings'] = $setting['id'];

		switch ( $setting['type'] ) {
			case 'color':
				return new WP_Customize_Color_Control( $this->wp_customize, $control_id, $args );
			case 'date':
				return new WP_Customize_Date_Time_Control( $this->wp_customize, $control_id, $args );
			case 'media':
				return new WP_Customize_Media_Control( $this->wp_customize, $control_id, $args );
		}
		return new WP_Customize_control( $this->wp_customize, $control_id, $args );
	}

}
