import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import {
	findCorePresetCollisions,
	describeCorePresetCollision,
} from '../lib/core-preset-slugs.js';
import { getActiveThemeType } from '../lib/paradigm.js';
import themeConfig from '../../config/themeConfig.js';

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

	const designTokens = themeConfig?.theme?.designTokens || {};
	if ( designTokens.enabled === false ) {
		console.log(
			'Design token generation disabled (theme.designTokens.enabled).'
		);
		return;
	}

	if ( ! ( await fs.pathExists( tokensPath ) ) ) {
		return;
	}

	const tokens = loadTokens( await fs.readJson( tokensPath ) );

	// Resolve config-driven color binding against the active paradigm
	// (SPEC-017 §5.2) and enforce the classic hard rule (§5.3).
	const themeType = getActiveThemeType();
	const binding = resolveColorBinding(
		designTokens.colorBinding || 'auto',
		themeType
	);
	assertClassicBinding( themeType, binding );

	const legacyAliases = designTokens.legacyAliases !== false;
	const contrast = {
		level: designTokens.contrast?.level || 'AA',
		onFail: designTokens.contrast?.onFail || 'warn',
	};
	const cssOpts = { binding, legacyAliases };

	// Legacy-shaped view for the theme.json / Tailwind / custom-media targets.
	// Keeps those outputs byte-identical while the CSS layer migrates to v2
	// (SPEC-017 §6.2).
	const flat = toLegacyFlat( tokens );

	// wp-preset binding needs semantic palette slugs in theme.json so the
	// `--wp--preset--color--{role}` aliases resolve.
	const extraPalette =
		binding === 'wp-preset' ? buildSemanticPalette( tokens ) : [];

	// Explicit hand-authored theme.json overlay (SPEC-017 §6.2). Absent file =
	// tokens-only (plus the baked user layer below).
	const themeCustomPath = path.join(
		themeRoot,
		'config',
		'theme.custom.json'
	);
	const themeCustom = ( await fs.pathExists( themeCustomPath ) )
		? await fs.readJson( themeCustomPath )
		: null;

	// 0. Read the baked user-styles overlay, when present (SPEC-016). Absent
	// file = no user layer; buildThemeJson stays trivially pure.
	const userStylesOverlay = await readUserStylesOverlay();

	// 1. Update theme.json
	await updateThemeJson( flat, userStylesOverlay, {
		extraPalette,
		themeCustom,
	} );

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

	// 2. Update CSS variables in _tokens.generated.css
	await updateCssVariables( tokens, cssOpts );

	// 3. Regenerate @custom-media aliases in _custom-media.css
	await updateCustomMedia( flat );

	// 4. Update tailwind.config.js (if exists)
	await updateTailwindConfig( flat );

	// 5. Contrast gate (SPEC-017 §7.5). Severity is configurable (Q7);
	// warn-only until the palette is remediated / codemod lands.
	for ( const diagnostic of validateContrast( tokens, contrast ) ) {
		// eslint-disable-next-line no-console
		console.warn( `[tokens] ${ diagnostic.message }` );
	}
}

async function updateThemeJson( tokens, userStylesOverlay = null, opts = {} ) {
	const themeJsonPath = path.join( themeRoot, 'theme.json' );
	let existingThemeJson;

	if ( await fs.pathExists( themeJsonPath ) ) {
		existingThemeJson = await fs.readJson( themeJsonPath );
	}

	const themeJson = buildThemeJson(
		tokens,
		existingThemeJson,
		userStylesOverlay,
		opts
	);
	await fs.writeJson( themeJsonPath, themeJson, { spaces: 2 } );
}

/**
 * The static base theme.json shape, before the tokens / theme.custom /
 * user-styles layers are applied.
 *
 * @return {Object} Fresh theme.json skeleton.
 */
function freshThemeJson() {
	return {
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
			// (single source of truth in tokens via _tokens.generated.css).
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
}

/**
 * Builds the v3 / WP 7.1 theme.json object from tokens.json. When an explicit
 * `config/theme.custom.json` exists it is the single hand-authored source and
 * the previous generated theme.json is NOT read as input — generation becomes a
 * pure function of committed files (SPEC-017 §6.2). Otherwise the existing
 * theme.json is kept as the base for backward compatibility. The baked
 * user-styles overlay (SPEC-016) always merges last. tokens.js is the sole
 * theme.json writer (D9).
 *
 * @param {Object}      tokens              Parsed config/tokens.json.
 * @param {Object}      existingThemeJson   Current theme.json contents (undefined when absent).
 * @param {Object|null} [userStylesOverlay] Validated config/user-styles.json overlay (null when absent).
 * @param {Object}      [opts]              Options.
 * @param {Array}       [opts.extraPalette] Extra palette entries (semantic slugs for wp-preset).
 * @param {Object}      [opts.themeCustom]  Hand-authored config/theme.custom.json overlay.
 * @return {Object} Merged, ready-to-write theme.json object.
 */
export function buildThemeJson(
	tokens,
	existingThemeJson,
	userStylesOverlay = null,
	opts = {}
) {
	const { extraPalette = [] } = opts;
	const hasCustom =
		opts.themeCustom && typeof opts.themeCustom === 'object';
	const themeJson = hasCustom
		? freshThemeJson()
		: existingThemeJson ?? freshThemeJson();

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

	// Update palette. `extraPalette` carries the semantic-color slugs when
	// binding is wp-preset, so `--wp--preset--color--{role}` resolves
	// (SPEC-017 §5.3). Empty for independent binding -> output unchanged.
	// De-duplicate by slug (semantic wins) — e.g. the legacy `text` slug also
	// exists as a semantic role; duplicate slugs are invalid in theme.json.
	const palette = Object.entries( tokens.colors ).map(
		( [ slug, color ] ) => ( {
			slug,
			color,
			name: slug.charAt( 0 ).toUpperCase() + slug.slice( 1 ),
		} )
	);
	for ( const entry of extraPalette ) {
		const index = palette.findIndex( ( e ) => e.slug === entry.slug );
		if ( index >= 0 ) {
			palette[ index ] = entry;
		} else {
			palette.push( entry );
		}
	}
	themeJson.settings.color.palette = palette;

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

	// 1b. Merge the explicit hand-authored theme.custom.json overlay
	// (SPEC-017 §6.2). Precedence: tokens < theme.custom < user-styles.
	// SSOT keys (viewport, blockVisibility, ...) stay tokens-owned.
	if ( opts.themeCustom ) {
		const custom = stripOverlaySsotKeys( opts.themeCustom );

		themeJson.settings = deepMergePreservingArrays(
			themeJson.settings,
			custom.settings || {}
		);
		themeJson.styles = deepMergePreservingArrays(
			themeJson.styles || {},
			custom.styles || {}
		);
	}

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

/**
 * Builds the complete generated tokens stylesheet from validated v2 tokens.
 *
 * Emits canonical v2 custom properties (primitives, structure, semantic light)
 * plus — during the migration — legacy `--old: var(--new)` aliases so existing
 * component CSS keeps resolving. Dark values are generated from
 * `semantic.*.dark` (SPEC-017 §7.2). Pure so tests can assert output.
 *
 * @param {Object}  tokens               Parsed + validated v2 tokens.
 * @param {Object}  [opts]               Options.
 * @param {boolean} [opts.legacyAliases] Emit legacy aliases (default true).
 * @param {string}  [opts.binding]       'independent' | 'wp-preset'.
 * @return {string} Full `_tokens.generated.css` source.
 */
export function buildCssCustomProperties( tokens, opts = {} ) {
	const plan = normalizeTokens( tokens, opts );

	const block = ( vars ) =>
		vars.map( ( v ) => `\t${ v.name }: ${ v.value };` ).join( '\n' );

	const groups = [];
	const addGroup = ( label, vars ) => {
		if ( vars.length ) {
			groups.push( `\t/* ${ label } */\n${ block( vars ) }` );
		}
	};

	addGroup( 'Primitives', plan.primitives );
	addGroup( 'Layout, space & type', plan.structure );
	addGroup( 'Semantic (light)', plan.semanticLight );
	addGroup( 'Legacy aliases — migration only (SPEC-017 §4.4)', plan.aliases );

	const light = `:root {\n\tcolor-scheme: light;\n\n${ groups.join(
		'\n\n'
	) }\n}\n`;

	let dark = '';
	if ( plan.semanticDark.length ) {
		const darkBlock = plan.semanticDark
			.map( ( v ) => `\t\t${ v.name }: ${ v.value };` )
			.join( '\n' );

		dark = `\n@media (prefers-color-scheme: dark) {\n\t:root {\n\t\tcolor-scheme: dark;\n\n${ darkBlock }\n\t}\n}\n`;
	}

	return `${ GENERATED_HEADER }\n\n${ light }${ dark }`;
}

async function updateCssVariables( tokens, opts = {} ) {
	const cssPath = path.join(
		themeRoot,
		'assets',
		'css',
		'src',
		'_tokens.generated.css'
	);

	await fs.writeFile( cssPath, buildCssCustomProperties( tokens, opts ) );
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

/**
 * Builds the generated Tailwind token module (`config/tailwind.tokens.js`).
 *
 * `tailwind.config.js` imports this and `config/tailwind.custom.js` and merges
 * them, so the generator never rewrites the hand-authored file (SPEC-017 §6.3).
 *
 * @param {Object} tokens v1-flat token view.
 * @return {string} Full module source.
 */
export function buildTailwindTokens( tokens ) {
	const values = {
		colors: tokens.colors,
		fontSize: tokens.typography.fontSizes,
		fontFamily: tokens.typography.fontFamilies,
	};

	return `/**
 * Tailwind token values — GENERATED FILE. DO NOT EDIT.
 *
 * Generated from config/tokens.json by \`npm run rig:tokens\`.
 * Hand-authored extensions belong in \`config/tailwind.custom.js\`.
 */

export default ${ JSON.stringify( values, null, '\t' ) };
`;
}

/**
 * Builds the stable `tailwind.config.js` shell. It imports the generated token
 * module and the hand-authored `config/tailwind.custom.js` and merges them, so
 * the generator never rewrites hand-authored content (SPEC-017 §6.3).
 *
 * @return {string} Full module source.
 */
export function buildTailwindConfig() {
	return `import tokens from './config/tailwind.tokens.js';
import custom from './config/tailwind.custom.js';

/**
 * Tailwind config — GENERATED SHELL. DO NOT EDIT.
 *
 * Token values are generated into \`config/tailwind.tokens.js\`; hand-authored
 * extensions live in \`config/tailwind.custom.js\`. Edit those, not this file.
 */
const customExtend = custom.extend || {};

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./**/*.php', './assets/js/src/**/*.js'],
	theme: {
		extend: {
			...customExtend,
			colors: { ...tokens.colors, ...(customExtend.colors || {}) },
			fontSize: { ...tokens.fontSize, ...(customExtend.fontSize || {}) },
			fontFamily: {
				...tokens.fontFamily,
				...(customExtend.fontFamily || {}),
			},
		},
	},
	plugins: [],
};
`;
}

async function updateTailwindConfig( tokens ) {
	// Generated token values.
	await fs.writeFile(
		path.join( themeRoot, 'config', 'tailwind.tokens.js' ),
		buildTailwindTokens( tokens )
	);

	// Generated shell (tailwind.config.js is a gitignored build artifact).
	await fs.writeFile(
		path.join( themeRoot, 'tailwind.config.js' ),
		buildTailwindConfig()
	);
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

// ---------------------------------------------------------------------------
// Token schema v2 (SPEC-017 §4): validation, reference resolution, output.
// ---------------------------------------------------------------------------

export const TOKENS_SCHEMA_VERSION = 2;

const GENERATED_HEADER = `/**
 * Custom Properties — GENERATED FILE. DO NOT EDIT.
 *
 * Generated from config/tokens.json by \`npm run rig:tokens\`.
 * Hand-authored variables and overrides belong in \`_tokens.custom.css\`.
 *
 * @link: https://developer.mozilla.org/en-US/docs/Web/CSS/--*
 **/`;

/**
 * Legacy custom-property name -> canonical v2 name. During the migration the
 * generator emits each as `--legacy: var(--canonical)` so existing component
 * CSS keeps resolving; the codemod (SPEC-017 §8) rewrites usages and removes
 * this layer. `--mobile-breakpoint` is deliberately NOT here — it is read by JS
 * via getComputedStyle and is emitted as a literal instead.
 *
 * Note: `--color-theme-{red,green,blue,yellow}` map to the static primitives
 * (not `--color-state-*`) to preserve current dark-mode appearance — they are
 * block palette swatches, not semantic state. The codemod may retarget them to
 * state tokens as a deliberate, reviewed decision (SPEC-017 §4.4).
 */
export const LEGACY_ALIASES = {
	'--content-width': '--layout-content',
	'--spacing-content-width': '--layout-content',
	'--spacing-wide-width': '--layout-wide',
	'--spacing-base': '--space-base',
	'--global-font-family': '--font-family-base',
	'--highlight-font-family': '--font-family-highlight',
	'--global-font-line-height': '--line-height-base',
	'--color-primary': '--color-brand-500',
	'--color-secondary': '--color-accent-500',
	'--color-red': '--color-red-500',
	'--color-green': '--color-green-500',
	'--color-blue': '--color-blue-500',
	'--color-yellow': '--color-yellow-500',
	'--color-black': '--color-neutral-900',
	'--color-grey': '--color-neutral-500',
	'--color-white': '--color-neutral-100',
	'--color-background': '--color-surface',
	'--background-color': '--color-surface',
	'--global-font-color': '--color-text',
	'--color-theme-primary': '--color-accent',
	'--color-theme-secondary': '--color-accent-secondary',
	'--content-background-color': '--color-surface-content',
	'--sub-content-background-color': '--color-surface-subtle',
	'--header-background-color': '--color-surface-header',
	'--footer-background-color': '--color-surface-footer',
	'--border-color-light': '--color-border',
	'--border-color-dark': '--color-border-strong',
	'--color-link-active': '--color-link-hover',
	'--code-background-color': '--color-code-surface',
	'--code-text-color': '--color-code-text',
	'--color-theme-red': '--color-red-500',
	'--color-theme-green': '--color-green-500',
	'--color-theme-blue': '--color-blue-500',
	'--color-theme-yellow': '--color-yellow-500',
	'--color-theme-black': '--color-neutral-900',
	'--color-theme-grey': '--color-neutral-500',
	'--color-theme-white': '--color-neutral-100',
};

const V2_TOP_LEVEL_KEYS = new Set( [
	'$schema',
	'meta',
	'primitives',
	'semantic',
	'component',
	'derive',
] );

/**
 * True when a value is a semantic leaf pair ({ light, dark }).
 *
 * @param {*} value Candidate.
 * @return {boolean} Whether it looks like a light/dark pair.
 */
function isSemanticPair( value ) {
	return (
		value &&
		typeof value === 'object' &&
		! Array.isArray( value ) &&
		( 'light' in value || 'dark' in value )
	);
}

/**
 * Flattens nested semantic groups to `[ 'state-danger', { light, dark } ]`
 * pairs (dot path joined with `-`).
 *
 * @param {Object} node     Semantic (sub)tree.
 * @param {string} [prefix] Accumulated path.
 * @return {Array<[string, Object]>} Flattened pairs.
 * @throws {Error} On an invalid leaf.
 */
export function flattenSemantic( node, prefix = '' ) {
	const out = [];

	for ( const [ key, value ] of Object.entries( node || {} ) ) {
		const name = prefix ? `${ prefix }-${ key }` : key;

		if ( isSemanticPair( value ) ) {
			out.push( [ name, value ] );
		} else if (
			value &&
			typeof value === 'object' &&
			! Array.isArray( value )
		) {
			out.push( ...flattenSemantic( value, name ) );
		} else {
			throw new Error(
				`Invalid semantic token "${ name }": expected a { light, dark } pair or a nested group.`
			);
		}
	}

	return out;
}

/**
 * Validates the v2 token shape. Throws with an actionable message; returns the
 * input unchanged on success (so it can wrap `fs.readJson`).
 *
 * @param {Object} raw Parsed config/tokens.json.
 * @return {Object} The validated tokens.
 * @throws {Error} On v1 shape, unknown keys, missing dark pairs, bad refs.
 */
export function validateTokens( raw ) {
	if ( ! raw || typeof raw !== 'object' || Array.isArray( raw ) ) {
		throw new Error( 'config/tokens.json must be a JSON object.' );
	}

	// v1 flat shape -> point at the migration script.
	if ( raw.colors || raw.typography || raw.spacing || raw.breakpoints ) {
		throw new Error(
			'config/tokens.json is in the v1 flat shape. Run `npm run rig:tokens:setup` to upgrade it to v2 (SPEC-017 §8).'
		);
	}

	if ( raw.meta?.version !== TOKENS_SCHEMA_VERSION ) {
		throw new Error(
			`config/tokens.json must declare meta.version ${ TOKENS_SCHEMA_VERSION }.`
		);
	}

	for ( const key of Object.keys( raw ) ) {
		if ( ! V2_TOP_LEVEL_KEYS.has( key ) ) {
			throw new Error(
				`Unknown top-level token key "${ key }". Allowed: ${ [
					...V2_TOP_LEVEL_KEYS,
				].join( ', ' ) }.`
			);
		}
	}

	if ( ! raw.primitives || typeof raw.primitives !== 'object' ) {
		throw new Error(
			'config/tokens.json must define a "primitives" object.'
		);
	}
	if ( ! raw.semantic || typeof raw.semantic !== 'object' ) {
		throw new Error(
			'config/tokens.json must define a "semantic" object.'
		);
	}

	const darkMode = raw.meta?.darkMode || 'media';

	for ( const [ name, pair ] of flattenSemantic( raw.semantic ) ) {
		if ( typeof pair.light !== 'string' ) {
			throw new Error(
				`semantic.${ name } must have a "light" string value.`
			);
		}
		if ( darkMode !== 'none' && typeof pair.dark !== 'string' ) {
			throw new Error(
				`semantic.${ name } must have a "dark" value when meta.darkMode is "${ darkMode }".`
			);
		}
		// Tier direction: semantic may not reference another semantic token.
		for ( const key of [ 'light', 'dark' ] ) {
			const value = pair[ key ];
			if ( typeof value === 'string' && value.includes( '{semantic.' ) ) {
				throw new Error(
					`semantic.${ name }.${ key } may not reference another semantic token (tier direction, SPEC-017 §4.2).`
				);
			}
		}
	}

	// Primitive color leaves must be literals, never references.
	for ( const [ hue, steps ] of Object.entries(
		raw.primitives.color || {}
	) ) {
		for ( const [ step, value ] of Object.entries( steps ) ) {
			if ( typeof value !== 'string' || value.includes( '{' ) ) {
				throw new Error(
					`primitives.color.${ hue }.${ step } must be a literal color, not a reference.`
				);
			}
		}
	}

	return raw;
}

/**
 * Alias of validateTokens used at the read boundary.
 *
 * @param {Object} raw Parsed config/tokens.json.
 * @return {Object} The validated tokens.
 */
export function loadTokens( raw ) {
	return validateTokens( raw );
}

/**
 * Resolves `{dotted.path}` references throughout a deep-cloned token tree.
 *
 * @param {Object} tokens v2 tokens.
 * @return {Object} Resolved copy.
 * @throws {Error} On unresolved or circular references.
 */
export function resolveReferences( tokens ) {
	const clone = JSON.parse( JSON.stringify( tokens ) );

	const lookup = ( refPath ) =>
		refPath
			.split( '.' )
			.reduce(
				( acc, key ) =>
					acc === null || acc === undefined ? acc : acc[ key ],
				clone
			);

	const resolveValue = ( value, stack = [] ) => {
		if ( typeof value === 'string' ) {
			const match = value.match( /^\{([^}]+)\}$/ );
			if ( ! match ) {
				return value;
			}

			const refPath = match[ 1 ];
			if ( stack.includes( refPath ) ) {
				throw new Error(
					`Circular token reference: ${ [ ...stack, refPath ].join(
						' -> '
					) }`
				);
			}

			const target = lookup( refPath );
			if ( target === undefined ) {
				throw new Error(
					`Unresolved token reference "{ ${ refPath } }".`
				);
			}

			return resolveValue( target, [ ...stack, refPath ] );
		}

		if ( Array.isArray( value ) ) {
			return value.map( ( item ) => resolveValue( item, stack ) );
		}

		if ( value && typeof value === 'object' ) {
			const out = {};
			for ( const [ key, item ] of Object.entries( value ) ) {
				out[ key ] = resolveValue( item, stack );
			}
			return out;
		}

		return value;
	};

	return resolveValue( clone );
}

/**
 * Builds a v1-flat view of the v2 tokens for the theme.json / Tailwind /
 * custom-media targets, preserving their existing output exactly.
 *
 * @param {Object} tokens v2 tokens.
 * @return {Object} v1-shaped { colors, typography, spacing, breakpoints }.
 */
export function toLegacyFlat( tokens ) {
	const resolved = resolveReferences( tokens );
	const color = resolved.primitives.color;
	const sem = resolved.semantic;
	const font = resolved.primitives.font;

	return {
		colors: {
			primary: color.brand[ '500' ],
			secondary: color.accent[ '500' ],
			red: color.red[ '500' ],
			green: color.green[ '500' ],
			blue: color.blue[ '500' ],
			yellow: color.yellow[ '500' ],
			black: color.neutral[ '900' ],
			grey: color.neutral[ '500' ],
			white: color.neutral[ '100' ],
			text: sem.text.light,
			background: sem.surface.light,
		},
		typography: {
			fontFamilies: font.family,
			fluid: resolved.meta?.fluid || { enabled: true },
			fontSizes: font.size,
			lineHeight: font.leading.base,
		},
		spacing: {
			'content-width': resolved.primitives.layout.content,
			'wide-width': resolved.primitives.layout.wide,
			base: resolved.primitives.space.base,
		},
		breakpoints: resolved.primitives.breakpoint,
	};
}

/**
 * Shortens `#rrggbb` to `#rgb` when every channel is a doubled nibble, so the
 * generated CSS satisfies the project's `color-hex-length: short` lint rule.
 *
 * @param {string} value CSS value.
 * @return {string} Shortened value when applicable, else the input.
 */
export function shortenHex( value ) {
	if ( typeof value !== 'string' ) {
		return value;
	}

	const match = value.trim().match( /^#([0-9a-f]{6})$/i );
	if ( ! match ) {
		return value;
	}

	const hex = match[ 1 ].toLowerCase();
	if (
		hex[ 0 ] === hex[ 1 ] &&
		hex[ 2 ] === hex[ 3 ] &&
		hex[ 4 ] === hex[ 5 ]
	) {
		return `#${ hex[ 0 ] }${ hex[ 2 ] }${ hex[ 4 ] }`;
	}

	return value;
}

/**
 * Resolves the effective color-binding mode (SPEC-017 §5.2).
 *
 * @param {string} requested 'auto' | 'independent' | 'wp-preset'.
 * @param {string} themeType Active paradigm ('classic'|'universal'|'block-based').
 * @return {string} 'independent' or 'wp-preset'.
 */
export function resolveColorBinding( requested = 'auto', themeType ) {
	if ( requested === 'independent' || requested === 'wp-preset' ) {
		return requested;
	}

	// auto: block-based themes treat WP presets as the source of truth.
	return themeType === 'block-based' ? 'wp-preset' : 'independent';
}

/**
 * Guards the hard rule that classic themes never emit `--wp--preset--`
 * references (SPEC-017 §5.3).
 *
 * @param {string} themeType Active paradigm.
 * @param {string} binding   Resolved binding mode.
 * @throws {Error} When classic is combined with wp-preset binding.
 */
export function assertClassicBinding( themeType, binding ) {
	if ( themeType === 'classic' && binding === 'wp-preset' ) {
		throw new Error(
			'colorBinding "wp-preset" is not supported for classic themes (SPEC-017 §5.3). Use "independent".'
		);
	}
}

/**
 * Builds the semantic-color palette entries theme.json needs when binding is
 * `wp-preset` (so `--wp--preset--color--{role}` resolves).
 *
 * @param {Object} tokens v2 tokens.
 * @return {Array<Object>} Palette entries { slug, color, name }.
 */
export function buildSemanticPalette( tokens ) {
	const resolved = resolveReferences( tokens );

	return flattenSemantic( resolved.semantic ).map( ( [ name, pair ] ) => ( {
		slug: name,
		color: shortenHex( pair.light ),
		name: name
			.split( '-' )
			.map( ( part ) => part.charAt( 0 ).toUpperCase() + part.slice( 1 ) )
			.join( ' ' ),
	} ) );
}

/**
 * Normalizes v2 tokens into ordered CSS custom-property lists.
 *
 * @param {Object}  tokens               v2 tokens.
 * @param {Object}  [opts]               Options.
 * @param {boolean} [opts.legacyAliases] Emit legacy aliases (default true).
 * @param {string}  [opts.binding]       'independent' | 'wp-preset' (default independent).
 * @return {Object} { primitives, structure, semanticLight, semanticDark, aliases }.
 */
export function normalizeTokens( tokens, opts = {} ) {
	const { legacyAliases = true, binding = 'independent' } = opts;
	const resolved = resolveReferences( tokens );
	const prim = resolved.primitives || {};
	const plan = {
		primitives: [],
		structure: [],
		semanticLight: [],
		semanticDark: [],
		aliases: [],
	};

	for ( const [ hue, steps ] of Object.entries( prim.color || {} ) ) {
		for ( const [ step, value ] of Object.entries( steps ) ) {
			plan.primitives.push( {
				name: `--color-${ hue }-${ step }`,
				value: shortenHex( value ),
			} );
		}
	}

	for ( const [ slug, value ] of Object.entries( prim.hue || {} ) ) {
		plan.structure.push( {
			name: `--hue-${ slug }`,
			value: String( value ),
		} );
	}
	for ( const [ slug, value ] of Object.entries( prim.alpha || {} ) ) {
		plan.structure.push( { name: `--alpha-${ slug }`, value } );
	}
	for ( const [ slug, value ] of Object.entries( prim.layout || {} ) ) {
		plan.structure.push( { name: `--layout-${ slug }`, value } );
	}
	for ( const [ slug, value ] of Object.entries( prim.space || {} ) ) {
		plan.structure.push( { name: `--space-${ slug }`, value } );
	}
	for ( const [ slug, value ] of Object.entries( prim.font?.family || {} ) ) {
		plan.structure.push( { name: `--font-family-${ slug }`, value } );
	}
	for ( const [ slug, value ] of Object.entries(
		prim.font?.leading || {}
	) ) {
		plan.structure.push( { name: `--line-height-${ slug }`, value } );
	}

	const fluid = resolved.meta?.fluid || { enabled: true };
	for ( const [ slug, value ] of Object.entries( prim.font?.size || {} ) ) {
		const display = fluid.enabled
			? calculateFluidSize( value, fluid )
			: value;
		plan.structure.push( {
			name: `--font-size-${ slug }`,
			value: display,
		} );
	}
	for ( const [ slug, value ] of Object.entries( prim.breakpoint || {} ) ) {
		plan.structure.push( { name: `--breakpoint-${ slug }`, value } );
	}

	const darkMode = resolved.meta?.darkMode || 'media';
	for ( const [ name, pair ] of flattenSemantic( resolved.semantic ) ) {
		const varName = `--color-${ name }`;

		// wp-preset: the semantic var aliases the WordPress preset. Presets are
		// single-valued, so no generated dark block for these (SPEC-017 §7.2).
		if ( binding === 'wp-preset' ) {
			plan.semanticLight.push( {
				name: varName,
				value: `var(--wp--preset--color--${ name })`,
			} );
			continue;
		}

		plan.semanticLight.push( {
			name: varName,
			value: shortenHex( pair.light ),
		} );
		if (
			darkMode !== 'none' &&
			typeof pair.dark === 'string' &&
			pair.dark !== pair.light
		) {
			plan.semanticDark.push( {
				name: varName,
				value: shortenHex( pair.dark ),
			} );
		}
	}

	if ( legacyAliases ) {
		const emitted = new Set(
			[
				...plan.primitives,
				...plan.structure,
				...plan.semanticLight,
			].map( ( v ) => v.name )
		);

		for ( const [ legacy, canonical ] of Object.entries(
			LEGACY_ALIASES
		) ) {
			if ( emitted.has( canonical ) ) {
				plan.aliases.push( {
					name: legacy,
					value: `var(${ canonical })`,
				} );
			}
		}

		// The JS mobile-nav toggle reads --mobile-breakpoint via
		// getComputedStyle; emit it as a literal, not a var() alias.
		const tablet = prim.breakpoint?.tablet;
		if ( tablet ) {
			plan.aliases.push( {
				name: '--mobile-breakpoint',
				value: tablet,
			} );
		}
	}

	return plan;
}

/**
 * Parses a hex color (#rgb or #rrggbb) into [r, g, b].
 *
 * @param {string} value CSS hex color.
 * @return {Array<number>|null} Channels, or null when not hex.
 */
function parseHexColor( value ) {
	if ( typeof value !== 'string' ) {
		return null;
	}

	const match = value.trim().match( /^#([0-9a-f]{3}|[0-9a-f]{6})$/i );
	if ( ! match ) {
		return null;
	}

	let hex = match[ 1 ];
	if ( hex.length === 3 ) {
		hex = hex
			.split( '' )
			.map( ( c ) => c + c )
			.join( '' );
	}

	return [
		parseInt( hex.slice( 0, 2 ), 16 ),
		parseInt( hex.slice( 2, 4 ), 16 ),
		parseInt( hex.slice( 4, 6 ), 16 ),
	];
}

/**
 * WCAG relative luminance of an [r, g, b] triplet.
 *
 * @param {Array<number>} rgb Channels.
 * @return {number} Relative luminance.
 */
function relativeLuminance( [ r, g, b ] ) {
	const channel = ( v ) => {
		const s = v / 255;
		return s <= 0.03928
			? s / 12.92
			: Math.pow( ( s + 0.055 ) / 1.055, 2.4 );
	};

	return (
		0.2126 * channel( r ) + 0.7152 * channel( g ) + 0.0722 * channel( b )
	);
}

/**
 * WCAG contrast ratio between two hex colors.
 *
 * @param {string} fg Foreground hex.
 * @param {string} bg Background hex.
 * @return {number|null} Ratio, or null when either color is not hex.
 */
export function contrastRatio( fg, bg ) {
	const a = parseHexColor( fg );
	const b = parseHexColor( bg );
	if ( ! a || ! b ) {
		return null;
	}

	const la = relativeLuminance( a );
	const lb = relativeLuminance( b );
	const lighter = Math.max( la, lb );
	const darker = Math.min( la, lb );

	return ( lighter + 0.05 ) / ( darker + 0.05 );
}

/**
 * Contrast gate (SPEC-017 §7.5): checks semantic foreground/background pairs in
 * both themes against the configured WCAG threshold.
 *
 * @param {Object} tokens        v2 tokens.
 * @param {Object} [opts]        Options.
 * @param {string} [opts.level]  'AA' | 'AAA' | 'off'.
 * @param {string} [opts.onFail] 'warn' | 'error' (severity tag on diagnostics).
 * @return {Array<Object>} Diagnostics (empty when passing or disabled).
 */
export function validateContrast( tokens, opts = {} ) {
	const { level = 'AA', onFail = 'warn' } = opts;
	if ( level === 'off' ) {
		return [];
	}

	const sem = resolveReferences( tokens ).semantic;
	const get = ( refPath ) =>
		refPath
			.split( '.' )
			.reduce(
				( acc, key ) =>
					acc === null || acc === undefined ? acc : acc[ key ],
				sem
			);

	const pairs = [
		[ 'text', 'surface' ],
		[ 'text', 'surface-subtle' ],
		[ 'text', 'surface-content' ],
		[ 'text', 'surface-header' ],
		[ 'text', 'surface-footer' ],
		[ 'text-muted', 'surface' ],
		[ 'link', 'surface' ],
		[ 'link-hover', 'surface' ],
		[ 'link-visited', 'surface' ],
		[ 'accent', 'surface' ],
		[ 'quote-citation', 'surface' ],
		[ 'state.danger', 'surface' ],
		[ 'state.success', 'surface' ],
		[ 'state.warning', 'surface' ],
		[ 'state.info', 'surface' ],
		[ 'code-text', 'code-surface' ],
	];

	const required = level === 'AAA' ? 7 : 4.5;
	const diagnostics = [];

	for ( const [ fgPath, bgPath ] of pairs ) {
		const fg = get( fgPath );
		const bg = get( bgPath );
		if ( ! fg || ! bg ) {
			continue;
		}

		for ( const theme of [ 'light', 'dark' ] ) {
			const ratio = contrastRatio( fg[ theme ], bg[ theme ] );
			if ( ratio === null ) {
				continue;
			}

			if ( ratio < required ) {
				const rounded = Math.round( ratio * 100 ) / 100;
				diagnostics.push( {
					level: onFail,
					theme,
					pair: `${ fgPath } on ${ bgPath }`,
					ratio: rounded,
					required,
					message: `contrast ${ rounded }:1 for "${ fgPath }" on "${ bgPath }" (${ theme }) is below ${ level } ${ required }:1.`,
				} );
			}
		}
	}

	return diagnostics;
}
