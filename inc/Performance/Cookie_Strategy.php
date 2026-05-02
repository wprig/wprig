<?php
/**
 * WP_Rig\WP_Rig\Performance\Cookie_Strategy class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Performance;

use function add_action;
use function apply_filters;
use function wp_add_inline_script;

/**
 * Class for the cookie-based critical asset loading strategy.
 */
class Cookie_Strategy implements Critical_Strategy_Interface {

	/**
	 * Cookie name.
	 */
	const COOKIE_NAME = 'wprig_critical_cached';

	/**
	 * Gets the unique identifier for the strategy.
	 *
	 * @return string Strategy slug.
	 */
	public function get_slug(): string {
		return 'cookie-critical';
	}

	/**
	 * Determines whether the asset should be inlined.
	 *
	 * @param string $handle Asset handle.
	 * @param array  $data   Asset data.
	 * @return bool True to inline, false to enqueue.
	 */
	public function should_inline( string $handle, array $data ): bool {
		// If page caching is enabled, we should avoid cookie-based logic to prevent cache fragmentation.
		if ( defined( 'WP_CACHE' ) && WP_CACHE ) {
			return true;
		}

		$should_inline = ! isset( $_COOKIE[ self::COOKIE_NAME ] );

		/**
		 * Filters whether the asset should be inlined.
		 *
		 * @param bool   $should_inline Whether to inline.
		 * @param string $handle        Asset handle.
		 * @param string $strategy      Strategy slug.
		 */
		return (bool) apply_filters( 'wp_rig_performance_should_inline', $should_inline, $handle, $this->get_slug() );
	}

	/**
	 * Hooks to initialize the strategy.
	 */
	public function initialize() {
		add_action( 'wp_footer', array( $this, 'print_cookie_script' ) );
	}

	/**
	 * Prints the JavaScript to set the cookie after the first load.
	 */
	public function print_cookie_script() {
		// Only print if the cookie isn't set yet.
		if ( isset( $_COOKIE[ self::COOKIE_NAME ] ) ) {
			return;
		}

		?>
		<script id="wprig-cookie-critical-js">
			(function() {
				if (!document.cookie.includes('<?php echo esc_js( self::COOKIE_NAME ); ?>')) {
					window.addEventListener('load', function() {
						document.cookie = "<?php echo esc_js( self::COOKIE_NAME ); ?>=true; max-age=" + (60 * 60 * 24 * 30) + "; path=/; SameSite=Lax";
					});
				}
			})();
		</script>
		<?php
	}
}
