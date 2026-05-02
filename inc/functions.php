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

	// Use a unique cache key based on the input.
	$cache_key = 'wprig_asset_' . substr( md5( $url_or_path ), 0, 20 );
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
