<?php
/**
 * WP_Rig\WP_Rig\Classic_Component_Trait trait
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig;

use function WP_Rig\WP_Rig\get_config;

/**
 * Trait for classic theme components that are inactive in block-based themes.
 */
trait Classic_Component_Trait {

	/**
	 * Checks whether the component is active.
	 *
	 * Classic components are inactive when the theme type is set to block-based.
	 *
	 * @return bool True if active, false otherwise.
	 */
	public static function is_active(): bool {
		$config = get_config( 'config.json' );
		return ( $config['theme']['themeType'] ?? 'classic' ) !== 'block-based';
	}
}
