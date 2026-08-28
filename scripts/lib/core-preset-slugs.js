/**
 * Core default preset slugs + collision detection for theme.json presets.
 *
 * WordPress ships default color/gradient/duotone/font-size presets. When a
 * theme defines a preset whose slug matches a core default, the theme's
 * definition silently OVERRIDES the core preset (intended WP merge behavior,
 * but easy to miss: the DOM class name and CSS variable name look right while
 * the resolved value differs from core's). If overriding is unintended, either
 * rename the slug or disable core defaults via
 * `settings.color.defaultPalette` / `settings.typography.defaultFontSizes` /
 * `settings.color.defaultGradients` / `settings.color.defaultDuotone` = false.
 *
 * Scope: WP Rig generates palette slugs from `config/tokens.json → colors`
 * and font-size slugs from `→ typography.fontSizes`. Those are the two sets
 * where a slug collision can occur in a WP Rig theme, so only core palette
 * and font-size defaults are tracked here.
 */

/** Core default color palette slugs (WP default theme.json). */
export const CORE_PALETTE_SLUGS = [
	'black',
	'cyan-bluish-gray',
	'white',
	'pale-pink',
	'vivid-red',
	'luminous-vivid-orange',
	'luminous-vivid-amber',
	'light-green-cyan',
	'vivid-green-cyan',
	'pale-cyan-blue',
	'vivid-purple',
	'very-light-gray',
	'very-dark-gray',
];

/** Core default font size slugs (WP default theme.json). */
export const CORE_FONT_SIZE_SLUGS = [
	'small',
	'medium',
	'large',
	'x-large',
	'extra-large',
];

/**
 * Find theme preset slugs that collide with core default preset slugs.
 *
 * @param {Object} themeJson Parsed theme.json (settings.color.palette,
 *                           settings.typography.fontSizes).
 * @return {Array<{type: string, slug: string}>} Collisions (empty when none).
 */
export function findCorePresetCollisions( themeJson ) {
	const collisions = [];

	for ( const { slug } of themeJson?.settings?.color?.palette ?? [] ) {
		if ( CORE_PALETTE_SLUGS.includes( slug ) ) {
			collisions.push( { type: 'color', slug } );
		}
	}

	for ( const { slug } of themeJson?.settings?.typography?.fontSizes ?? [] ) {
		if ( CORE_FONT_SIZE_SLUGS.includes( slug ) ) {
			collisions.push( { type: 'fontSize', slug } );
		}
	}

	return collisions;
}

/**
 * Build a human-readable warning message for a collision.
 *
 * @param {{type: string, slug: string}} collision A findCorePresetCollisions() entry.
 * @return {string} Warning message with the fix hint.
 */
export function describeCorePresetCollision( { type, slug } ) {
	const setting =
		type === 'color'
			? 'color.defaultPalette'
			: 'typography.defaultFontSizes';
	return (
		`Preset slug "${ slug }" (${ type }) matches a WordPress core default — ` +
		`this theme's value silently overrides the core preset. Intended? ` +
		`If not, rename the slug, or set settings.${ setting } to false to ` +
		`disable core defaults.`
	);
}
