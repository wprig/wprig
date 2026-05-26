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
	if ( '' === $url_or_path || '0' === $url_or_path ) {
		return false;
	}

	static $memory_cache = array();
	if ( isset( $memory_cache[ $url_or_path ] ) ) {
		return $memory_cache[ $url_or_path ];
	}

	$is_remote = str_starts_with( $url_or_path, 'http' );
	$version   = '';

	// During development, include the file modification time in the cache key.
	// This ensures that updates to local files (like config.json) are reflected immediately
	// while still avoiding redundant file reads if the file hasn't changed.
	if ( ! $is_remote ) {
		$version = wp_rig()->get_asset_version( $url_or_path );
	}

	// Use transients only for remote assets. Local files are typically faster via filesystem (with OS caching).
	$cache_key = '';
	if ( $is_remote ) {
		$cache_key = 'wprig_asset_' . substr( md5( $url_or_path . $version ), 0, 20 );
		$content   = get_transient( $cache_key );

		if ( false !== $content ) {
			$memory_cache[ $url_or_path ] = $content;
			return $content;
		}
	}

	$content = false;

	// Check if it's a URL.
	if ( $is_remote ) {
		$response = wp_remote_get(
			$url_or_path,
			array(
				'timeout' => 2,
			)
		);
		if ( ! is_wp_error( $response ) ) {
			$content = wp_remote_retrieve_body( $response );
		}
	} else {
		// It's likely a file path.
		if ( file_exists( $url_or_path ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			$content = file_get_contents( $url_or_path );
		}

		// Fallback to WP_Filesystem only if file_get_contents failed but we want to follow WPCS rigorously.
		// In most cases for theme files, file_get_contents is sufficient and faster.
		if ( false === $content ) {
			global $wp_filesystem;
			if ( empty( $wp_filesystem ) ) {
				require_once ABSPATH . 'wp-admin/includes/file.php';
				WP_Filesystem();
			}

			if ( ! empty( $wp_filesystem ) && $wp_filesystem->exists( $url_or_path ) ) {
				$content = $wp_filesystem->get_contents( $url_or_path );
			}
		}
	}

	if ( false !== $content && '' !== $content && $is_remote ) {
		set_transient( $cache_key, $content, $expiry );
	}

	$memory_cache[ $url_or_path ] = $content;
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

/**
 * Retrieves the theme configuration, merged with defaults.
 *
 * @param string $filename Optional. The configuration filename. Default 'config.json'.
 * @return array Merged configuration array.
 */
function get_config( string $filename = 'config.json' ): array {
	return wp_rig_theme()->get_config( $filename );
}
