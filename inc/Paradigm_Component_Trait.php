<?php
/**
 * WP_Rig\WP_Rig\Paradigm_Component_Trait trait
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig;

/**
 * Trait for components whose activation is gated by a theme-dev paradigm tag.
 *
 * The component must declare a `PARADIGM` class constant with one of:
 * 'all', 'classic', 'universal', or 'block-based' (see config/paradigms.json).
 * Components without a constant are treated as 'all' (active in every paradigm).
 */
trait Paradigm_Component_Trait {

	/**
	 * Checks whether the component is active for the active theme type.
	 *
	 * @return bool True if active, false otherwise.
	 */
	public static function is_active(): bool {
		$tag = defined( static::class . '::PARADIGM' ) ? static::PARADIGM : 'all';
		return Paradigm::is_enabled( $tag );
	}
}
