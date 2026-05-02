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
		add_filter( 'wprig_registry_github_owner', array( $this, 'filter_github_owner' ) );
		add_filter( 'wprig_registry_github_repo', array( $this, 'filter_github_repo' ) );
		add_filter( 'wprig_registry_github_branch', array( $this, 'filter_github_branch' ) );

		// Secure token handling - prefer environment variables over filters.
		add_filter( 'wprig_registry_github_token', array( $this, 'filter_github_token' ) );
	}

	/**
	 * Filters the GitHub token.
	 *
	 * Uses environment variables to avoid committing tokens to version control.
	 *
	 * @param string $token Default token.
	 * @return string GitHub token.
	 */
	public function filter_github_token( string $token ): string {
		if ( '' !== $token && '0' !== $token ) {
			return $token;
		}
		$env_token = getenv( 'WPRIG_REGISTRY_GITHUB_TOKEN' );
		if ( false === $env_token ) {
			return '';
		}
		return (string) $env_token;
	}

	/**
	 * Filters the GitHub repository owner.
	 *
	 * @param string $owner Default owner.
	 * @return string GitHub owner.
	 */
	public function filter_github_owner( string $owner ): string {
		return '' === $owner || '0' === $owner ? 'wprig' : $owner;
	}

	/**
	 * Filters the GitHub repository name.
	 *
	 * @param string $repo Default repo.
	 * @return string GitHub repository name.
	 */
	public function filter_github_repo( string $repo ): string {
		return '' === $repo || '0' === $repo ? 'wprig-components' : $repo;
	}

	/**
	 * Filters the GitHub repository branch.
	 *
	 * @param string $branch Default branch.
	 * @return string GitHub branch.
	 */
	public function filter_github_branch( string $branch ): string {
		return '' === $branch || '0' === $branch ? 'main' : $branch;
	}
}
