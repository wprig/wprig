<?php

declare(strict_types=1);

/**
 * WP_Rig\WP_Rig\Performance\Critical_Strategy_Interface interface
 *
 * @package wp_rig
 */
namespace WP_Rig\WP_Rig\Performance;

/**
 * Interface for critical asset loading strategies.
 */
interface Critical_Strategy_Interface {

	/**
	 * Gets the unique identifier for the strategy.
	 *
	 * @return string Strategy slug.
	 */
	public function get_slug(): string;

	/**
	 * Determines whether the asset should be inlined.
	 *
	 * @param string $handle Asset handle.
	 * @param array  $data   Asset data.
	 * @return bool True to inline, false to enqueue.
	 */
	public function should_inline( string $handle, array $data ): bool;

	/**
	 * Hooks to initialize the strategy (e.g. add JS to footer).
	 */
	public function initialize();
}
