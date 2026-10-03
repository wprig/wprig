<?php
/**
 * WP_Rig\WP_Rig\Paradigm class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig;

use function get_theme_file_path;
use function WP_Rig\WP_Rig\get_config;

/**
 * Single source of truth for WP Rig theme-dev paradigms.
 *
 * Reads config/paradigms.json (the tag -> theme-type matrix) and resolves the
 * active theme type from the merged theme config. Throws when the config is
 * invalid so miswired paradigm flags fail fast instead of silently degrading
 * to 'classic'. This is the PHP half of the JS helper in scripts/lib/paradigm.js.
 */
class Paradigm {

	/**
	 * Cached paradigm definitions.
	 *
	 * @var array|null
	 */
	private static ?array $definitions = null;

	/**
	 * Gets the paradigm definitions from config/paradigms.json.
	 *
	 * @return array The paradigm definitions ('themeTypes' and 'tags').
	 * @throws \RuntimeException When the definitions file is missing or malformed.
	 */
	public static function get_definitions(): array {
		if ( null !== self::$definitions ) {
			return self::$definitions;
		}

		$path    = get_theme_file_path( '/config/paradigms.json' );
		$content = file_get_contents( $path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Shared config read, mirrors get_asset_content().

		if ( false === $content ) {
			throw new \RuntimeException(
				// phpcs:disable WordPress.Security.EscapeOutput -- Exception message, not browser output.
				sprintf(
					'Missing paradigm definitions at %s. config/paradigms.json is the single source of truth for theme paradigms.',
					$path
				)
				// phpcs:enable WordPress.Security.EscapeOutput
			);
		}

		$definitions = json_decode( $content, true );
		if ( empty( $definitions['themeTypes'] ) || empty( $definitions['tags'] ) ) {
			throw new \RuntimeException(
				'config/paradigms.json must define "themeTypes" and "tags". This file is the single source of truth for WP Rig theme paradigms.'
			);
		}

		self::$definitions = $definitions;
		return $definitions;
	}

	/**
	 * Gets the active theme type from the merged theme config.
	 *
	 * @return string The active theme type.
	 * @throws \RuntimeException When the configured theme type is missing or invalid.
	 */
	public static function get_active_theme_type(): string {
		$config     = get_config( 'config.json' );
		$theme_type = $config['theme']['themeType'] ?? null;

		if ( ! is_string( $theme_type ) || ! array_key_exists( $theme_type, self::get_definitions()['themeTypes'] ) ) {
			throw new \RuntimeException(
				// phpcs:disable WordPress.Security.EscapeOutput -- Exception message, not browser output.
				sprintf(
					'Invalid theme.themeType "%s". Valid values: %s. Fix config/config.json or the default in config/config.default.json.',
					(string) $theme_type,
					implode( ', ', array_keys( self::get_definitions()['themeTypes'] ) )
				)
				// phpcs:enable WordPress.Security.EscapeOutput
			);
		}

		return $theme_type;
	}

	/**
	 * Determines whether a feature tagged with the given paradigm is enabled for
	 * the active theme type.
	 *
	 * @param string $tag Feature paradigm tag ('all', 'classic', 'universal', 'block-based').
	 * @return bool True when the feature ships for the active theme type.
	 * @throws \RuntimeException When the tag is not defined.
	 */
	public static function is_enabled( string $tag ): bool {
		$definitions = self::get_definitions();

		if ( ! array_key_exists( $tag, $definitions['tags'] ) ) {
			throw new \RuntimeException(
				// phpcs:disable WordPress.Security.EscapeOutput -- Exception message, not browser output.
				sprintf(
					'Unknown paradigm tag "%s". Valid tags: %s.',
					$tag,
					implode( ', ', array_keys( $definitions['tags'] ) )
				)
				// phpcs:enable WordPress.Security.EscapeOutput
			);
		}

		return in_array( self::get_active_theme_type(), $definitions['tags'][ $tag ], true );
	}
}
