'use strict';

/**
 * Paradigm bake-and-strip transform for production PHP bundles.
 *
 * Paradigm resolution is a development-time concern: once the theme type is
 * chosen and the theme is built, the answer is fixed. This module bakes that
 * decision into the bundled PHP so the production theme never reads
 * config/paradigms.json or the theme config at runtime:
 *
 * - Gated-out component directories are stripped entirely (Theme.php registers
 *   components via directory scan, so nothing else needs rewriting).
 * - inc/Paradigm.php is replaced with a stub class whose definitions and
 *   active theme type are inlined as PHP literals. The class API is preserved
 *   so child themes calling Paradigm::is_enabled() keep working.
 *
 * See .ai/plans/SPEC-014-paradigm-bake-and-strip.md.
 */

const PARADIGM_CONST_REGEX = /const\s+PARADIGM\s*=\s*['"]([^'"]+)['"]/;
const PARADIGM_FILE = 'inc/Paradigm.php';

/**
 * Extracts the paradigm tag from a Component.php source string.
 *
 * @param {string} componentPhpSource Contents of a component's Component.php.
 * @return {string} The declared paradigm tag, or 'all' when none is declared.
 * @throws {Error} When a declared tag value is not a known tag.
 */
export function extractParadigmTag( componentPhpSource ) {
	const match = componentPhpSource.match( PARADIGM_CONST_REGEX );
	if ( ! match ) {
		return 'all';
	}

	const tag = match[ 1 ];
	if ( ! [ 'all', 'classic', 'universal', 'block-based' ].includes( tag ) ) {
		throw new Error(
			`Unknown paradigm tag "${ tag }" in const PARADIGM. ` +
				'Valid tags: all, classic, universal, block-based.'
		);
	}

	return tag;
}

/**
 * Determines whether a component with the given tag ships for a theme type.
 * Mirrors the tag -> themeTypes matrix in config/paradigms.json exactly.
 *
 * @param {string} tag             Component paradigm tag.
 * @param {string} activeThemeType Resolved active theme type.
 * @param {Object} definitions     Paradigm definitions { themeTypes, tags }.
 * @return {boolean} True when the component ships for the active theme type.
 */
export function shouldIncludeComponent( tag, activeThemeType, definitions ) {
	const enabledTypes = definitions?.tags?.[ tag ];
	if ( ! Array.isArray( enabledTypes ) ) {
		throw new Error(
			`Unknown paradigm tag "${ tag }" in config/paradigms.json.`
		);
	}

	return enabledTypes.includes( activeThemeType );
}

/**
 * Converts a JS value (string keys, string values, arrays) to a PHP array
 * literal. Only used for the baked paradigm matrix, which is strings only.
 *
 * @param {*}      value Value to convert.
 * @param {number} depth Current indentation depth.
 * @return {string} PHP array literal source.
 */
export function toPhpArray( value, depth = 0 ) {
	const escape = ( str ) =>
		str.replace( /\\/g, '\\\\' ).replace( /'/g, "\\'" );

	if ( Array.isArray( value ) ) {
		if ( value.length === 0 ) {
			return 'array()';
		}
		const indent = '\t'.repeat( depth + 1 );
		const closeIndent = '\t'.repeat( depth );
		const items = value
			.map(
				( item ) => `${ indent }\t${ toPhpArray( item, depth + 1 ) },`
			)
			.join( '\n' );
		return `array(\n${ items }\n${ closeIndent })`;
	}

	if ( value !== null && typeof value === 'object' ) {
		const entries = Object.entries( value );
		if ( entries.length === 0 ) {
			return 'array()';
		}
		const indent = '\t'.repeat( depth + 1 );
		const closeIndent = '\t'.repeat( depth );
		const items = entries
			.map(
				( [ key, item ] ) =>
					`${ indent }\t'${ escape( key ) }' => ${ toPhpArray(
						item,
						depth + 1
					) },`
			)
			.join( '\n' );
		return `array(\n${ items }\n${ closeIndent })`;
	}

	return `'${ escape( String( value ) ) }'`;
}

/**
 * Produces the baked Paradigm.php stub for the active theme type.
 *
 * The stub preserves the public API (get_definitions, get_active_theme_type,
 * is_enabled) with all values inlined as PHP literals — no file reads, no
 * get_config() dependency, no config/ directory required at runtime.
 *
 * @param {string} activeThemeType Resolved active theme type.
 * @param {Object} definitions     Paradigm definitions { themeTypes, tags }.
 * @return {string} PHP source for the baked Paradigm class.
 */
export function bakeParadigmClass( activeThemeType, definitions ) {
	const phpDefinitions = toPhpArray( definitions, 2 );
	const phpBody = `<?php
/**
 * WP_Rig\\WP_Rig\\Paradigm class
 *
 * @package wp_rig
 */

namespace WP_Rig\\WP_Rig;

/**
 * Single source of truth for WP Rig theme-dev paradigms.
 *
 * BAKED AT BUILD TIME: the active theme type ("${ activeThemeType }") and the
 * tag matrix are inlined below. The bundled theme performs no config reads at
 * runtime. In development this class is generated from the paradigm config.
 */
class Paradigm {

	/**
	 * Baked active theme type.
	 *
	 * @var string
	 */
	const ACTIVE_THEME_TYPE = '${ activeThemeType }';

	/**
	 * Cached paradigm definitions.
	 *
	 * @var array|null
	 */
	private static ?array $definitions = null;

	/**
	 * Gets the baked paradigm definitions.
	 *
	 * @return array The paradigm definitions ('themeTypes' and 'tags').
	 * @throws \\RuntimeException When the baked definitions are empty.
	 */
	public static function get_definitions(): array {
		if ( null !== self::$definitions ) {
			return self::$definitions;
		}

		$definitions = ${ phpDefinitions };

		if ( empty( $definitions['themeTypes'] ) || empty( $definitions['tags'] ) ) {
			throw new \\RuntimeException(
				'Baked paradigm definitions are empty. Rebuild the production theme.'
			);
		}

		self::$definitions = $definitions;
		return $definitions;
	}

	/**
	 * Gets the baked active theme type.
	 *
	 * @return string The active theme type.
	 */
	public static function get_active_theme_type(): string {
		return self::ACTIVE_THEME_TYPE;
	}

	/**
	 * Determines whether a feature tagged with the given paradigm is enabled
	 * for the baked active theme type.
	 *
	 * @param string $tag Feature paradigm tag ('all', 'classic', 'universal', 'block-based').
	 * @return bool True when the feature ships for the baked theme type.
	 * @throws \\RuntimeException When the tag is not defined.
	 */
	public static function is_enabled( string $tag ): bool {
		$definitions = self::get_definitions();

		if ( ! array_key_exists( $tag, $definitions['tags'] ) ) {
			throw new \\RuntimeException(
				sprintf(
					'Unknown paradigm tag "%s". Valid tags: %s.',
					$tag,
					implode( ', ', array_keys( $definitions['tags'] ) )
				)
			);
		}

		return in_array( self::get_active_theme_type(), $definitions['tags'][ $tag ], true );
	}
}
`;
	return phpBody;
}

/**
 * Per-file production PHP transform dispatcher.
 *
 * @param {string} relToRoot Path relative to the theme root (forward slashes).
 * @param {string} content   Original file contents.
 * @param {Object} ctx       { activeThemeType, definitions, isComponentPath(relToRoot), componentTag(relToRoot) }
 * @return {{skip?: boolean, content?: string}} Skip signal or transformed content.
 */
export function bakeProdPhp( relToRoot, content, ctx ) {
	const normalized = relToRoot.replace( /\\/g, '/' );

	if ( normalized === PARADIGM_FILE ) {
		return {
			content: bakeParadigmClass( ctx.activeThemeType, ctx.definitions ),
		};
	}

	if ( ctx.isComponentPath( normalized ) ) {
		const tag = ctx.componentTag( normalized );
		if (
			! shouldIncludeComponent(
				tag,
				ctx.activeThemeType,
				ctx.definitions
			)
		) {
			return { skip: true };
		}
	}

	return { content };
}
