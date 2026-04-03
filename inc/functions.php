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
