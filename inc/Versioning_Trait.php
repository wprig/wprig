<?php
/**
 * WP_Rig\WP_Rig\Versioning_Trait trait
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig;

/**
 * Trait for components that need versioning methods.
 */
trait Versioning_Trait {

	/**
	 * Gets the theme version.
	 *
	 * @return string Theme version number.
	 */
	public function get_version(): string {
		static $theme_version = null;

		if ( null === $theme_version ) {
			$theme_version = wp_get_theme()->get( 'Version' );
		}

		return $theme_version;
	}

	/**
	 * Gets the version for a given asset.
	 *
	 * Returns filemtime when in local or debug mode, otherwise the theme version.
	 *
	 * @param string $filepath Asset file path.
	 * @return string Asset version number.
	 */
	public function get_asset_version( string $filepath ): string {
		if ( $this->is_debug() && file_exists( $filepath ) ) {
			return (string) filemtime( $filepath );
		}

		return $this->get_version();
	}

	/**
	 * Checks if the current environment is local or debug mode.
	 *
	 * @return bool True if local or debug, false otherwise.
	 */
	public function is_debug(): bool {
		static $is_debug = null;

		if ( null === $is_debug ) {
			$env_type = function_exists( 'wp_get_environment_type' ) ? wp_get_environment_type() : ( defined( 'WP_ENVIRONMENT_TYPE' ) ? WP_ENVIRONMENT_TYPE : 'production' );
			$is_debug = 'local' === $env_type || ( defined( 'WP_DEBUG' ) && WP_DEBUG );
		}

		return $is_debug;
	}

	/**
	 * Gets the asset suffix (.min or empty).
	 *
	 * @param string $type Optional. Asset type ('script' or 'style'). Default 'style'.
	 * @return string Asset suffix.
	 */
	public function get_asset_suffix( string $type = 'style' ): string {
		if ( $this->is_debug() ) {
			return '';
		}

		if ( 'script' === $type && defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) {
			return '';
		}

		return '.min';
	}

	/**
	 * Ensures the asset filename has the correct suffix.
	 *
	 * @param string $filename Asset filename.
	 * @param string $type     Asset type ('script' or 'style').
	 * @return string Asset filename with suffix.
	 */
	public function get_asset_file( string $filename, string $type = 'style' ): string {
		$ext     = 'style' === $type ? '.css' : '.js';
		$min_ext = '.min' . $ext;

		// For now, WP Rig built assets always use .min suffix in the distributed theme.
		// We ensure it's present if not already there.
		if ( ! str_contains( $filename, $min_ext ) ) {
			return str_replace( $ext, $min_ext, $filename );
		}

		return $filename;
	}
}
