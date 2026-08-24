<?php
/**
 * WP_Rig\WP_Rig\Classic_Component_Trait trait
 *
 * @package wp_rig
 * @deprecated Use Paradigm_Component_Trait with a `const PARADIGM = 'classic';`
 *             declaration instead. This shim keeps legacy classic components
 *             behaving as 'classic'-tagged without further changes.
 */

namespace WP_Rig\WP_Rig;

/**
 * Trait for classic theme components that are inactive in block-based themes.
 *
 * @deprecated Use {@see Paradigm_Component_Trait} instead.
 */
trait Classic_Component_Trait {

	/**
	 * Checks whether the component is active.
	 *
	 * Classic components are inactive when the theme type does not include
	 * the 'classic' paradigm (i.e., block-based themes).
	 *
	 * @return bool True if active, false otherwise.
	 */
	public static function is_active(): bool {
		return Paradigm::is_enabled( 'classic' );
	}
}
