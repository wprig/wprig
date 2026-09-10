import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import {
	findCorePresetCollisions,
	describeCorePresetCollision,
} from '../lib/core-preset-slugs.js';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const themeRoot = path.resolve( __dirname, '../..' );
const tokensPath = path.join( themeRoot, 'config', 'tokens.json' );
const userStylesOverlayPath = path.join(
	themeRoot,
	'config',
	'user-styles.json'
);

/**
 * Validates the parsed overlay shape (SPEC-016 §5.7). Pure so tests can
 * exercise it without touching the real config file.
 *
 * @param {Object} overlay Parsed overlay JSON.
 * @return {Object} The validated overlay (pass-through).
 * @throws {Error} With a message naming config/user-styles.json.
 */
export function validateUserStylesOverlay( overlay ) {
	if (
		! overlay ||
		typeof overlay !== 'object' ||
		Array.isArray( overlay )
	) {
		throw new Error(
			'config/user-styles.json must be an object with "settings" and "styles" blocks.'
		);
	}

	if (
		! overlay.settings ||
		typeof overlay.settings !== 'object' ||
		Array.isArray( overlay.settings ) ||
		! overlay.styles ||
		typeof overlay.styles !== 'object' ||
		Array.isArray( overlay.styles )
	) {
		throw new Error(
			'config/user-styles.json is malformed: expected "settings" and "styles" objects. Re-bake with rig:bake or fix the file.'
		);
	}

	if (
		overlay.fonts !== undefined &&
		( typeof overlay.fonts !== 'object' || Array.isArray( overlay.fonts ) )
	) {
		throw new Error(
			'config/user-styles.json is malformed: "fonts" must be an object when present.'
		);
	}

	return overlay;
}

/**
 * Reads and validates the baked user-styles overlay
 * (config/user-styles.json), when present. Absence = "no user layer".
 *
 * @return {Promise<Object|null>} Validated overlay object, or null.
 * @throws {Error} When the overlay exists but is malformed (fail-fast,
 *   naming the file, per SPEC-016 §5.7).
 */
export async function readUserStylesOverlay() {
	if ( ! ( await fs.pathExists( userStylesOverlayPath ) ) ) {
		return null;
	}

	let overlay;

	try {
		overlay = await fs.readJson( userStylesOverlayPath );
	} catch ( error ) {
		throw new Error(
			`config/user-styles.json is not valid JSON: ${ error.message }`
		);
	}

	return validateUserStylesOverlay( overlay );
}

/**
 * Deep-merges source over target. Objects merge recursively; arrays replace
 * wholesale (WP preset-replace semantics: the editor authors a complete
 * palette list, not a delta).
 *
 * @param {Object} target Base object (generated theme.json section).
 * @param {Object} source Overlay section.
 * @return {Object} Merged result (new object).
 */
export function deepMergePreservingArrays( target, source ) {
	const result = { ...target };

	for ( const [ key, value ] of Object.entries( source ) ) {
		const current = result[ key ];

		if (
			current &&
			typeof current === 'object' &&
			! Array.isArray( current ) &&
			value &&
			typeof value === 'object' &&
			! Array.isArray( value )
		) {
			result[ key ] = deepMergePreservingArrays( current, value );
		} else {
			result[ key ] = value;
		}
	}

	return result;
}

/**
 * Collapses the overlay `fonts` block into a single fontFamilies list
 * (SPEC-016 §3.1 rule 2): theme activation families first, custom Font
 * Library families after; duplicate slugs resolve to the custom definition.
 *
 * @param {Object} fonts Overlay fonts block.
 * @return {Array} Merged fontFamilies list.
 */
export function collapseOverlayFonts( fonts = {} ) {
	const themeFamilies = Array.isArray( fonts.themeFamilies )
		? fonts.themeFamilies
		: [];
	const customFamilies = Array.isArray( fonts.customFamilies )
		? fonts.customFamilies
		: [];

	const bySlug = new Map();

	for ( const family of themeFamilies ) {
		if ( family && family.slug ) {
			bySlug.set( family.slug, family );
		}
	}

	for ( const family of customFamilies ) {
		if ( family && family.slug ) {
			bySlug.set( family.slug, family );
		}
	}

	return [ ...bySlug.values() ];
}

/**
 * Strips the SSOT/guard keys from an overlay before merging so the tokens
 * layer always wins on them (SPEC-016 §3.1 rules 3–4).
 *
 * @param {Object} overlay Raw overlay.
 * @return {Object} Overlay copy with forbidden keys removed.
 */
export function stripOverlaySsotKeys( overlay ) {
	const { $schema, version, isGlobalStylesUserThemeJSON, settings, ...rest } =
		overlay;

	const cleanedSettings = { ...( settings || {} ) };
	delete cleanedSettings.viewport;
	delete cleanedSettings.blockVisibility;

	return { ...rest, settings: cleanedSettings };
}

/**
 * Propagates tokens from tokens.json to theme.json, CSS variables, and Tailwind config.
 */
export async function propagateTokens() {
	console.log( 'Propagating tokens...' );
	if ( ! ( await fs.pathExists( tokensPath ) ) ) {
		return;
	}

	const tokens = await fs.readJson( tokensPath );

	// 0. Read the baked user-styles overlay, when present (SPEC-016). Absent
	// file = no user layer; buildThemeJson stays trivially pure.
	const userStylesOverlay = await readUserStylesOverlay();

	// 1. Update theme.json
	await updateThemeJson( tokens, userStylesOverlay );

	// 1b. Warn about preset slugs that collide with WP core defaults — the
	// generated theme presets silently override core presets with the same
	// slug, which is hard to trace when unintended.
	const themeJsonPath = path.join( themeRoot, 'theme.json' );
	if ( await fs.pathExists( themeJsonPath ) ) {
		const collisions = findCorePresetCollisions(
			await fs.readJson( themeJsonPath )
		);
		for ( const collision of collisions ) {
			// eslint-disable-next-line no-console
			console.warn(
				`[tokens] ${ describeCorePresetCollision( collision ) }`
			);
		}
	}

	// 2. Update CSS variables in _custom-properties.css
	await updateCssVariables( tokens );

	// 3. Regenerate @custom-media aliases in _custom-media.css
	await updateCustomMedia( tokens );

	// 4. Update tailwind.config.js (if exists)
	await updateTailwindConfig( tokens );
}

async function updateThemeJson( tokens, userStylesOverlay = null ) {
	const themeJsonPath = path.join( themeRoot, 'theme.json' );
	let existingThemeJson;

	if ( await fs.pathExists( themeJsonPath ) ) {
		existingThemeJson = await fs.readJson( themeJsonPath );
	}

	const themeJson = buildThemeJson(
		tokens,
		existingThemeJson,
		userStylesOverlay
	);
	await fs.writeJson( themeJsonPath, themeJson, { spaces: 2 } );
}

/**
 * Builds the v3 / WP 7.1 theme.json object from tokens.json, preserving (not
 * clobbering) any hand-authored sections of an existing theme.json, and
 * merging the baked user-styles overlay last (SPEC-016). tokens.js is the
 * sole theme.json writer (D9); setup and build both call this.
 *
 * @param {Object}      tokens              Parsed config/tokens.json.
 * @param {Object}      existingThemeJson   Current theme.json contents (undefined when absent).
 * @param {Object|null} [userStylesOverlay] Validated config/user-styles.json overlay (null when absent).
 * @return {Object} Merged, ready-to-write theme.json object.
 */
export function buildThemeJson(
	tokens,
	existingThemeJson,
	userStylesOverlay = null
) {
	const themeJson = existingThemeJson ?? {
		version: 3,
		settings: {
			appearanceTools: true,
			color: {
				palette: [],
			},
			typography: {
				fontFamilies: [],
				fontSizes: [],
			},
		},
		styles: {
			color: {
				// 'text'/'background' are real palette slugs (tokens.colors).
				text: 'var(--wp--preset--color--text)',
				background: 'var(--wp--preset--color--background)',
			},
			// Link interactive states live natively in theme.json (G3) so the WP 7.1
			// editor exposes hover/focus/active — values point at theme CSS vars
			// (single source of truth in tokens via _custom-properties.css).
			elements: {
				link: {
					color: { text: 'var(--color-link)' },
					':visited': {
						color: { text: 'var(--color-link-visited)' },
					},
					':hover': {
						color: { text: 'var(--color-link-active)' },
					},
					':focus': {
						color: { text: 'var(--color-link-active)' },
					},
					':active': {
						color: { text: 'var(--color-link-active)' },
					},
				},
			},
		},
	};

	// Upgrade to theme.json v3 / WP 7.1 schema (single source of truth is tokens.json).
	themeJson.$schema = 'https://schemas.wp.org/wp/7.1/theme.json';
	themeJson.version = 3;

	// Ensure the sections we own exist — this generator is the sole theme.json writer (D9).
	themeJson.settings = themeJson.settings || {};
	themeJson.settings.color = themeJson.settings.color || {};
	themeJson.settings.typography = themeJson.settings.typography || {};

	// Viewport breakpoints (WP 7.1) mirror tokens.json breakpoints (D4/D6/D10).
	themeJson.settings.viewport = {
		mobile: tokens.breakpoints?.mobile || '480px',
		tablet: tokens.breakpoints?.tablet || '782px',
	};

	// Layout derives from tokens.spacing (resolves the 800px-vs-45rem drift, D9).
	themeJson.settings.layout = themeJson.settings.layout || {};
	themeJson.settings.layout.contentSize =
		tokens.spacing[ 'content-width' ] || '45rem';
	themeJson.settings.layout.wideSize =
		tokens.spacing[ 'wide-width' ] || '64rem';

	// Block visibility: an editor capability for all paradigms (the block editor is
	// active for classic content too). WP 7.1 default is allowEditing: true; set it
	// explicitly for clarity. G8 (Track B Phase 6) owns semantic alignment with the
	// mobile-nav hide patterns.
	themeJson.settings.blockVisibility = {
		allowEditing: true,
	};

	// Update palette
	themeJson.settings.color.palette = Object.entries( tokens.colors ).map(
		( [ slug, color ] ) => ( {
			slug,
			color,
			name: slug.charAt( 0 ).toUpperCase() + slug.slice( 1 ),
		} )
	);

	// Update font families
	themeJson.settings.typography.fontFamilies = Object.entries(
		tokens.typography.fontFamilies
	).map( ( [ slug, family ] ) => ( {
		slug,
		fontFamily: family,
		name: slug.charAt( 0 ).toUpperCase() + slug.slice( 1 ),
	} ) );

	// Update font sizes
	const fluidConfig = tokens.typography.fluid || { enabled: true };
	themeJson.settings.typography.fontSizes = Object.entries(
		tokens.typography.fontSizes
	).map( ( [ slug, size ] ) => {
		const fontSize = {
			slug,
			size,
			name: slug.charAt( 0 ).toUpperCase() + slug.slice( 1 ),
		};

		if ( fluidConfig.enabled ) {
			fontSize.fluid = {
				min: getMinSize( size, fluidConfig ),
				max: size,
			};
		}

		return fontSize;
	} );

	// 2. Merge the baked user-styles overlay last (SPEC-016 §3): the user
	// layer wins over token content, except on SSOT keys, which are stripped
	// from the overlay before merging.
	if ( userStylesOverlay ) {
		const cleaned = stripOverlaySsotKeys( userStylesOverlay );

		themeJson.settings = deepMergePreservingArrays(
			themeJson.settings,
			cleaned.settings || {}
		);
		themeJson.styles = deepMergePreservingArrays(
			themeJson.styles || {},
			cleaned.styles || {}
		);

		if ( cleaned.fonts ) {
			themeJson.settings.typography.fontFamilies = collapseOverlayFonts(
				cleaned.fonts
			);
		}
	}

	return themeJson;
}

async function updateCssVariables( tokens ) {
	const cssPath = path.join(
		themeRoot,
		'assets',
		'css',
		'src',
		'_custom-properties.css'
	);
	if ( ! ( await fs.pathExists( cssPath ) ) ) {
		return;
	}

	let css = await fs.readFile( cssPath, 'utf8' );

	// Update Colors
	let colorVars = '';
	for ( const [ slug, color ] of Object.entries( tokens.colors ) ) {
		colorVars += `\t--color-${ slug }: ${ color };\n`;
	}

	// Add special mappings
	colorVars += `\t--global-font-color: ${ tokens.colors.text };\n`;
	colorVars += `\t--background-color: ${ tokens.colors.background };\n`;
	colorVars += `\t--color-theme-primary: ${ tokens.colors.primary };\n`;
	colorVars += `\t--color-theme-secondary: ${ tokens.colors.secondary };\n`;

	// Update Typography
	let typoVars = '';
	typoVars += `\t--global-font-family: ${ tokens.typography.fontFamilies.base };\n`;
	typoVars += `\t--highlight-font-family: ${ tokens.typography.fontFamilies.highlight };\n`;
	typoVars += `\t--global-font-line-height: ${ tokens.typography.lineHeight };\n`;

	const fluidConfig = tokens.typography.fluid || { enabled: true };
	for ( const [ slug, size ] of Object.entries(
		tokens.typography.fontSizes
	) ) {
		const displaySize = fluidConfig.enabled
			? calculateFluidSize( size, fluidConfig )
			: size;
		typoVars += `\t--font-size-${ slug }: ${ displaySize };\n`;
	}

	// Update Spacing
	let spacingVars = '';
	for ( const [ slug, value ] of Object.entries( tokens.spacing ) ) {
		spacingVars += `\t--spacing-${ slug }: ${ value };\n`;
	}
	spacingVars += `\t--content-width: ${ tokens.spacing[ 'content-width' ] };\n`;

	// Update Breakpoints (drives the JS mobile-nav toggle; px per viewport.tablet).
	// NOTE: --mobile-breakpoint is *named* "mobile" but holds the tablet
	// (nav-collapse) value — kept for BC (D8); JS reads it directly in px.
	let breakpointVars = '';
	breakpointVars += `\t/* Breakpoint (viewport.tablet) — drives the JS mobile-nav toggle */\n`;
	breakpointVars += `\t--mobile-breakpoint: ${
		tokens.breakpoints?.tablet || '782px'
	};\n`;

	const rootRegex = /:root\s*{([^}]*)}/s;
	const match = css.match( rootRegex );

	if ( match ) {
		const startMarker = '/* Generated from tokens.json */';
		const endMarker = '/* End of generated tokens */';
		const generatedContent = `\n\t${ startMarker }\n${ spacingVars }${ typoVars }${ breakpointVars }${ colorVars }\t${ endMarker }\n`;

		const innerContent = match[ 1 ];
		if ( innerContent.includes( startMarker ) ) {
			const markerRegex = new RegExp(
				`\\s*\\/\\* Generated from tokens\\.json \\*\\/.*?\\/\\* End of generated tokens \\*\\/\\s*`,
				's'
			);
			const newInnerContent = innerContent.replace(
				markerRegex,
				generatedContent
			);
			css = css.replace( innerContent, newInnerContent );
		} else {
			css = css.replace( innerContent, generatedContent + innerContent );
		}
	}

	await fs.writeFile( cssPath, css );
}

/**
 * Regenerates assets/css/src/_custom-media.css from tokens.json "breakpoints".
 *
 * All WP Rig @custom-media aliases collapse to derive from the two WP 7.1
 * settings.viewport breakpoints (mobile / tablet) — see the Track B plan §4.
 *
 * @param {Object} tokens Parsed config/tokens.json.
 */
async function updateCustomMedia( tokens ) {
	const cssPath = path.join(
		themeRoot,
		'assets',
		'css',
		'src',
		'_custom-media.css'
	);

	await fs.writeFile( cssPath, buildCustomMediaCss( tokens.breakpoints ) );
}

/**
 * Derives the 7 WP Rig @custom-media aliases from the WP 7.1 viewport
 * breakpoints (single source of truth — see the Track B plan §4 for the mapping).
 *
 * @param {Object} breakpoints Viewport breakpoints { mobile, tablet } in px.
 * @return {Array<Array<string>>} [ alias, full-query ] pairs.
 */
export function buildCustomMediaAliases( breakpoints = {} ) {
	const mobile = parsePx( breakpoints.mobile || '480px' );
	const tablet = parsePx( breakpoints.tablet || '782px' );

	return [
		[ '--narrow-menu-query', `screen and (max-width: ${ mobile }px)` ],
		[ '--wide-menu-query', `screen and (min-width: ${ mobile + 1 }px)` ],
		[ '--medium-query', `screen and (min-width: ${ mobile + 1 }px)` ],
		[ '--content-query', `screen and (min-width: ${ tablet + 1 }px)` ],
		[ '--sidebar-query', `screen and (min-width: ${ tablet + 1 }px)` ],
		[ '--tablet-menu-query', `screen and (max-width: ${ tablet }px)` ],
		[ '--desktop-menu-query', `screen and (min-width: ${ tablet + 1 }px)` ],
	];
}

/**
 * Builds the full regenerated _custom-media.css file content from viewport
 * breakpoints.
 *
 * @param {Object} breakpoints Viewport breakpoints { mobile, tablet } in px.
 * @return {string} Complete _custom-media.css source.
 */
export function buildCustomMediaCss( breakpoints = {} ) {
	const mobile = breakpoints.mobile || '480px';
	const tablet = breakpoints.tablet || '782px';

	const body = buildCustomMediaAliases( breakpoints )
		.map( ( [ name, query ] ) => `@custom-media ${ name } ${ query };` )
		.join( '\n' );

	return `/**
 * Custom Media Queries
 * Generated from config/tokens.json "breakpoints" (single source of truth).
 * Mobile = ${ mobile }, tablet = ${ tablet }.
 *
 * @link: https://drafts.csswg.org/mediaqueries-5/#custom-mq
 **/

${ body }
`;
}

/**
 * Parses a px length into a number (defaults to 480 for safety).
 *
 * @param {string} value CSS length in px.
 * @return {number} Numeric px value.
 */
function parsePx( value ) {
	const match = String( value ).match( /^([\d.]+)px$/ );
	return match ? parseFloat( match[ 1 ] ) : 480;
}

async function updateTailwindConfig( tokens ) {
	const tailwindPath = path.join( themeRoot, 'tailwind.config.js' );
	if ( ! ( await fs.pathExists( tailwindPath ) ) ) {
		return;
	}

	let content = await fs.readFile( tailwindPath, 'utf8' );
	content = content.replace(
		/colors: {[^}]*}/s,
		`colors: ${ JSON.stringify( tokens.colors, null, '\t\t\t' ) }`
	);
	content = content.replace(
		/fontSize: {[^}]*}/s,
		`fontSize: ${ JSON.stringify(
			tokens.typography.fontSizes,
			null,
			'\t\t\t'
		) }`
	);
	content = content.replace(
		/fontFamily: {[^}]*}/s,
		`fontFamily: ${ JSON.stringify(
			tokens.typography.fontFamilies,
			null,
			'\t\t\t'
		) }`
	);
	await fs.writeFile( tailwindPath, content );
}

/**
 * Calculates a clamp() fluid typography value.
 *
 * @param {string} sizeStr     Desktop size string.
 * @param {Object} fluidConfig Fluid configuration.
 * @return {string} Fluid size string.
 */
function calculateFluidSize( sizeStr, fluidConfig = {} ) {
	if ( ! sizeStr ) {
		return sizeStr;
	}
	const match = sizeStr.match( /^([\d.]+)([a-z%]*)$/ );
	if ( ! match ) {
		return sizeStr;
	}

	const unit = match[ 2 ];

	// Only handle rem and px for automatic fluid scaling
	if ( unit !== 'rem' && unit !== 'px' ) {
		return sizeStr;
	}

	const value = parseFloat( match[ 1 ] );
	const minScale = fluidConfig.minScale || 0.8;
	const minViewport = fluidConfig.minViewport || '320px';
	const maxViewport = fluidConfig.maxViewport || '1280px';

	const minValue = value * minScale;
	const maxValue = value;

	const minV = parseFloat( minViewport );
	const maxV = parseFloat( maxViewport );

	// Convert everything to the same unit for calculation if it's rem
	const minCalc = minValue;
	const maxCalc = maxValue;
	let minVCalc = minV;
	let maxVCalc = maxV;

	if ( unit === 'rem' ) {
		// Assume 1rem = 16px for viewport conversion
		minVCalc = minV / 16;
		maxVCalc = maxV / 16;
	}

	const factor = ( 100 * ( maxCalc - minCalc ) ) / ( maxVCalc - minVCalc );
	const offset =
		( minVCalc * maxCalc - maxVCalc * minCalc ) / ( minVCalc - maxVCalc );

	const minStr = `${ Math.round( minValue * 1000 ) / 1000 }${ unit }`;
	const maxStr = `${ Math.round( maxValue * 1000 ) / 1000 }${ unit }`;
	const preferred = `${ Math.round( offset * 1000 ) / 1000 }${ unit } + ${
		Math.round( factor * 1000 ) / 1000
	}vw`;

	return `clamp(${ minStr }, ${ preferred }, ${ maxStr })`;
}

/**
 * Calculates a minimum font size.
 *
 * @param {string} sizeStr     Desktop size string.
 * @param {Object} fluidConfig Fluid configuration.
 * @return {string} Minimum size string.
 */
function getMinSize( sizeStr, fluidConfig = {} ) {
	if ( ! sizeStr ) {
		return sizeStr;
	}
	const match = sizeStr.match( /^([\d.]+)([a-z%]*)$/ );
	if ( ! match ) {
		return sizeStr;
	}

	const value = parseFloat( match[ 1 ] );
	const unit = match[ 2 ];
	const minScale = fluidConfig.minScale || 0.8;
	const minValue = value * minScale;

	return `${ Math.round( minValue * 1000 ) / 1000 }${ unit }`;
}
