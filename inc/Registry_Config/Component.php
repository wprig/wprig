<?php
/**
 * WP_Rig\WP_Rig\Registry_Config\Component class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Registry_Config;

use WP_Rig\WP_Rig\Component_Interface;
use function add_filter;

/**
 * Class for configuring the component registry integration.
 */
class Component implements Component_Interface {

	/**
	 * Gets the unique identifier for the theme component.
	 *
	 * @return string Component slug.
	 */
	public function get_slug(): string {
		return 'registry_config';
	}

	/**
	 * Adds the action and filter hooks to integrate with WordPress.
	 */
	public function initialize() {
		add_filter( 'wprig_registry_github_owner', [ $this, 'filter_github_owner' ] );
		add_filter( 'wprig_registry_github_repo', [ $this, 'filter_github_repo' ] );
		add_filter( 'wprig_registry_github_branch', [ $this, 'filter_github_branch' ] );

		// If needed, we can also filter the token if it's stored in a secret location
		// add_filter( 'wprig_registry_github_token', [ $this, 'filter_github_token' ] );
	}

	/**
	 * Filters the GitHub repository owner.
	 *
	 * @return string GitHub owner.
	 */
	public function filter_github_owner(): string {
		return 'wprig';
	}

	/**
	 * Filters the GitHub repository name.
	 *
	 * @return string GitHub repository name.
	 */
	public function filter_github_repo(): string {
		return 'wprig-components';
	}

	/**
	 * Filters the GitHub repository branch.
	 *
	 * @return string GitHub branch.
	 */
	public function filter_github_branch(): string {
		return 'main';
	}
}
