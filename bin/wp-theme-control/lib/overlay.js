/**
 * wp-theme-control (Node port) — user-styles overlay assembly (SPEC-016).
 *
 * The overlay (config/user-styles.json) is cumulative state written by the
 * fonts and styles forks:
 * - fonts.js writes the `fonts` block (activation-filtered theme families +
 *   Font Library custom families with file:./ srcs).
 * - styles.js writes the `settings`/`styles` blocks (RAW user Global Styles
 *   data, never the merged-with-theme output).
 *
 * Raw capture keeps the merge order deterministic: the user layer is
 * independent of what tokens generated at capture time. SSOT keys
 * (viewport, version, $schema, blockVisibility) and
 * isGlobalStylesUserThemeJSON are stripped in the PHP capture payload
 * before they ever reach this module — the assembly here never re-adds them.
 */

import { OVERLAY_COMMENT } from './context.js';

/**
 * Normalizes/validates an existing overlay object (may be null).
 *
 * @param {Object|null} existing Overlay read from disk.
 * @return {Object} Normalized base object.
 */
function overlayBase( existing ) {
	const base =
		existing && typeof existing === 'object' && ! Array.isArray( existing )
			? existing
			: {};
	return {
		$comment: base.$comment || OVERLAY_COMMENT,
		capturedAt: base.capturedAt,
		globalStylesPostId: base.globalStylesPostId,
		settings:
			base.settings && typeof base.settings === 'object'
				? base.settings
				: {},
		styles:
			base.styles && typeof base.styles === 'object' ? base.styles : {},
		fonts:
			base.fonts && typeof base.fonts === 'object'
				? base.fonts
				: undefined,
	};
}

/**
 * Builds the overlay after a fonts bake.
 *
 * @param {Object|null} existing               Existing overlay (preserved blocks).
 * @param {Object}      payload
 * @param {Array}       payload.themeFamilies  Activation-filtered theme family definitions.
 * @param {Array}       payload.customFamilies Font Library custom families (srcs rewritten).
 * @param {string}      payload.recordId       Global Styles post ID.
 * @param {string}      payload.capturedAt     ISO timestamp.
 * @return {Object} Overlay object to persist.
 */
export function buildFontsOverlay(
	existing,
	{ themeFamilies, customFamilies, recordId, capturedAt }
) {
	const base = overlayBase( existing );
	return {
		...base,
		$comment: base.$comment || OVERLAY_COMMENT,
		capturedAt,
		globalStylesPostId: Number( recordId ),
		settings: base.settings,
		styles: base.styles,
		fonts: {
			themeFamilies: Array.isArray( themeFamilies ) ? themeFamilies : [],
			customFamilies: Array.isArray( customFamilies )
				? customFamilies
				: [],
		},
	};
}

/**
 * Builds the overlay after a styles bake. The fonts block of an existing
 * overlay is preserved (an earlier fonts run in the same bake wrote it).
 *
 * @param {Object|null} existing           Existing overlay.
 * @param {Object}      payload
 * @param {Object}      payload.userData   Raw user Global Styles data (SSOT keys stripped).
 * @param {string}      payload.recordId   Global Styles post ID.
 * @param {string}      payload.capturedAt ISO timestamp.
 * @return {Object} Overlay object to persist.
 */
export function buildStylesOverlay(
	existing,
	{ userData, recordId, capturedAt }
) {
	const base = overlayBase( existing );
	const data = userData && typeof userData === 'object' ? userData : {};

	const overlay = {
		...base,
		$comment: OVERLAY_COMMENT,
		capturedAt,
		globalStylesPostId: Number( recordId ),
		settings:
			data.settings && typeof data.settings === 'object'
				? data.settings
				: {},
		styles:
			data.styles && typeof data.styles === 'object' ? data.styles : {},
	};

	if ( base.fonts ) {
		overlay.fonts = base.fonts;
	}

	return overlay;
}

/**
 * Iterates every font face source of every custom family (upstream jq row
 * generator).
 *
 * @param {Array} customFamilies Custom Font Library families.
 * @return {Array<{familySlug, fontFamily, fontWeight, fontStyle, unicodeRange, sourceIndex, src}>} Face rows.
 */
export function iterFontFaces( customFamilies ) {
	const rows = [];

	for ( const family of customFamilies || [] ) {
		const faces = Array.isArray( family.fontFace ) ? family.fontFace : [];

		faces.forEach( ( face ) => {
			let srcs = face.src;
			if ( ! Array.isArray( srcs ) ) {
				srcs = srcs ? [ srcs ] : [];
			}

			srcs.forEach( ( src, sourceIndex ) => {
				rows.push( {
					familySlug: family.slug,
					fontFamily:
						face.fontFamily || family.fontFamily || family.name,
					fontWeight: face.fontWeight || '',
					fontStyle: face.fontStyle || '',
					unicodeRange: face.unicodeRange || '',
					sourceIndex,
					src,
				} );
			} );
		} );
	}

	return rows;
}

/**
 * Rewrites font sources through the staged file map and strips `preview`
 * fields (upstream jq post-processing).
 *
 * @param {Array}  customFamilies Custom families.
 * @param {Object} fontMap        source → file:./... map.
 * @return {Array} Rewritten families.
 */
export function rewriteFontSources( customFamilies, fontMap ) {
	const mapSources = ( srcs ) =>
		( Array.isArray( srcs ) ? srcs : [ srcs ] ).map(
			( src ) => fontMap[ src ] || src
		);

	return ( customFamilies || [] ).map( ( family ) => {
		const { preview, ...familyRest } = family;

		if ( ! familyRest.fontFace ) {
			return familyRest;
		}

		return {
			...familyRest,
			fontFace: familyRest.fontFace.map( ( face ) => {
				const { preview: facePreview, ...faceRest } = face;
				return { ...faceRest, src: mapSources( face.src ) };
			} ),
		};
	} );
}
