<?php

declare(strict_types=1);

/**
 * WP_Rig\WP_Rig\Asset_Provider interface
 *
 * @package wp_rig
 */
namespace WP_Rig\WP_Rig;

/**
 * Interface for a theme component that provides assets.
 */
interface Asset_Provider {

	/**
	 * Gets the asset manifest for the theme component.
	 *
	 * @return array {
	 *     Asset manifest.
	 *
	 *     @type array $styles {
	 *         Optional. List of style assets.
	 *
	 *         @type string   $file      Relative path from `assets/css/src/`.
	 *         @type bool     $inline    Optional. If `true`, the file content is inlined in the `<head>`. Default `false`.
	 *         @type callable $condition Optional. Function name or closure to determine if the asset should load.
	 *         @type bool     $preload   Optional. If `true`, adds a `link rel="preload"` tag. Default `false`.
	 *         @type string   $media     Optional. Media for which the style is defined. Default `all`.
	 *     }
	 *     @type array $scripts {
	 *         Optional. List of script assets.
	 *
	 *         @type string   $file      Relative path from `assets/js/src/`.
	 *         @type string   $strategy  Optional. Strategy for loading the script ('delay', 'async', 'defer').
	 *         @type callable $condition Optional. Function name or closure to determine if the asset should load.
	 *         @type bool     $footer    Optional. If `true`, the script is loaded in the footer. Default `false`.
	 *         @type array    $deps      Optional. List of dependencies.
	 *     }
	 * }
	 */
	public function get_asset_manifest(): array;
}
