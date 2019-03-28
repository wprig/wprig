<?php
/**
 * WP_Rig\WP_Rig\Localization\Component class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Localization;

use WP_Rig\WP_Rig\Component_Interface;
use function add_action;
use function load_theme_textdomain;
use function get_template_directory;

/**
 * Class for managing localization.
 */
class Component implements Component_Interface {

	/**
	 * Absolute path to the translation directory.
	 *
	 * @var string
	 */
	public $translation_directory = '';

	/**
	 * Constructor.
	 */
	public function __construct() {
		// Define the translation directory.
		$this->translation_directory = get_template_directory() . '/languages';
	}

	/**
	 * Gets the unique identifier for the theme component.
	 *
	 * @return string Component slug.
	 */
	public function get_slug() : string {
		return 'localization';
	}

	/**
	 * Adds the action and filter hooks to integrate with WordPress.
	 */
	public function initialize() {
		add_action( 'after_setup_theme', array( $this, 'action_load_textdomain' ), 1 );
	}

	/**
	 * Loads the theme textdomain.
	 */
	public function action_load_textdomain() {
		/*
		 * Make the theme available for translation. Translations can be filed in the /languages/ directory.
		 *
		 * If you want to distribute your theme on wordpress.org and use their language packs feature, you
		 * should not bundle translations in your theme. In that case you also need to get rid of the
		 * second parameter in the following function call.
		 */
		load_theme_textdomain( 'wp-rig', $this->translation_directory );
	}
}
