<?php
/**
 * The `wp_rig()` function.
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig;

/**
 * Provides access to all available template tags of the theme.
 *
 * When called for the first time, the function will initialize the theme.
 *
 * @return Template_Tags Template tags instance exposing template tag methods.
 */
function wp_rig(): Template_Tags {
	return wp_rig_theme()->template_tags();
}

/**
 * Provides access to the main theme instance.
 *
 * When called for the first time, the function will initialize the theme.
 *
 * @return Theme Theme instance.
 */
function wp_rig_theme(): Theme {
	static $theme = null;

	if ( null === $theme ) {
		$theme = new Theme();
		$theme->initialize();
	}

	return $theme;
}

/**
 * Retrieves the content of an asset, with caching.
 *
 * @param string $url_or_path The URL or file path.
 * @param int    $expiry      Optional. Cache expiry in seconds. Default 1 hour.
 * @return string|false Asset content or false on failure.
 */
function get_asset_content( string $url_or_path, int $expiry = HOUR_IN_SECONDS ) {
	if ( empty( $url_or_path ) ) {
		return false;
	}

	$version = '';
	// During development, include the file modification time in the cache key.
	// This ensures that updates to local files (like config.json) are reflected immediately
	// while still avoiding redundant file reads if the file hasn't changed.
	if ( strpos( $url_or_path, 'http' ) !== 0 && file_exists( $url_or_path ) ) {
		$env_type = function_exists( 'wp_get_environment_type' ) ? wp_get_environment_type() : ( defined( 'WP_ENVIRONMENT_TYPE' ) ? WP_ENVIRONMENT_TYPE : 'production' );
		$is_local = 'local' === $env_type;
		$is_debug = defined( 'WP_DEBUG' ) && WP_DEBUG;

		if ( $is_local || $is_debug ) {
			$version = (string) filemtime( $url_or_path );
		} else {
			// Optimal performance for production: use theme version.
			// This covers the case where dev/prod sites are updated via deployments.
			static $theme_version = null;
			if ( null === $theme_version ) {
				$theme_version = wp_get_theme( get_template() )->get( 'Version' );
			}
			$version = $theme_version;
		}
	}

	// Use a unique cache key based on the input and version.
	$cache_key = 'wprig_asset_' . substr( md5( $url_or_path . $version ), 0, 20 );
	$content   = get_transient( $cache_key );

	if ( false !== $content ) {
		return $content;
	}

	$content = false;

	// Check if it's a URL.
	if ( strpos( $url_or_path, 'http' ) === 0 ) {
		$response = wp_remote_get( $url_or_path );
		if ( ! is_wp_error( $response ) ) {
			$content = wp_remote_retrieve_body( $response );
		}
	} else {
		// It's likely a file path.
		// Use WP_Filesystem for local files to follow WPCS.
		global $wp_filesystem;
		if ( empty( $wp_filesystem ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
			WP_Filesystem();
		}

		if ( ! empty( $wp_filesystem ) && $wp_filesystem->exists( $url_or_path ) ) {
			$content = $wp_filesystem->get_contents( $url_or_path );
		} elseif ( file_exists( $url_or_path ) ) {
			// Fallback to file_get_contents if WP_Filesystem failed but file exists.
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			$content = file_get_contents( $url_or_path );
		}
	}

	if ( false !== $content && '' !== $content ) {
		set_transient( $cache_key, $content, $expiry );
	}

	return $content;
}

/**
 * Retrieves the content of a configuration file from the config directory.
 *
 * @param string $filename The filename (e.g., 'themeCustomizeSettings.json').
 * @return array|null The decoded JSON content as an associative array, or null on failure.
 */
function get_config_content( string $filename ): ?array {
	$file_path = get_theme_file_path( '/config/' . $filename );
	$content   = get_asset_content( $file_path );
	if ( ! $content ) {
		return null;
	}

	return json_decode( $content, true );
}
