<?php
/**
 * WP_Rig\WP_Rig\Template_Tags class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig;

use InvalidArgumentException;
use BadMethodCallException;
use RuntimeException;

/**
 * Template tags entry point.
 *
 * This class provides access to all available template tag methods.
 *
 * Its instance can be accessed through `wp_rig()`. For example, if there is a template tag called `posted_on`, it can
 * be accessed via `wp_rig()->posted_on()`.
 */
class Template_Tags {

	/**
	 * Associative array of all available template tags.
	 *
	 * Method names are the keys, their callback information the values.
	 *
	 * @var array
	 */
	protected $template_tags = [];

	/**
	 * Constructor.
	 *
	 * Sets the theme components.
	 *
	 * @param array $components Optional. List of theme templating components. Each of these must implement the
	 *                          Templating_Component_Interface interface.
	 *
	 * @throws InvalidArgumentException Thrown if one of the $components does not implement
	 *                                  Templating_Component_Interface.
	 */
	public function __construct( array $components = [] ) {

		// Set the template tags for the components.
		foreach ( $components as $component ) {

			// Bail if a templating component is invalid.
			if ( ! $component instanceof Templating_Component_Interface ) {
				throw new InvalidArgumentException(
					sprintf(
						/* translators: 1: classname/type of the variable, 2: interface name */
						__( 'The theme templating component %1$s does not implement the %2$s interface.', 'wp-rig' ),
						gettype( $component ),
						Templating_Component_Interface::class
					)
				);
			}

			$this->set_template_tags( $component );
		}
	}

	/**
	 * Magic call method.
	 *
	 * Will proxy to the template tag $method, unless it is not available, in which case an exception will be thrown.
	 *
	 * @param string $method Template tag name.
	 * @param array  $args   Template tag arguments.
	 * @return mixed Template tag result, or null if template tag only outputs markup.
	 *
	 * @throws BadMethodCallException Thrown if the template tag does not exist.
	 */
	public function __call( string $method, array $args ) {
		if ( ! isset( $this->template_tags[ $method ] ) ) {
			throw new BadMethodCallException(
				sprintf(
					/* translators: %s: template tag name */
					__( 'The template tag %s does not exist.', 'wp-rig' ),
					'wp_rig()->' . $method . '()'
				)
			);
		}

		return call_user_func_array( $this->template_tags[ $method ]['callback'], $args );
	}

	/**
	 * Sets template tags for a given theme templating component.
	 *
	 * @param Templating_Component_Interface $component Theme templating component.
	 *
	 * @throws InvalidArgumentException Thrown when one of the template tags is invalid.
	 * @throws RuntimeException         Thrown when one of the template tags conflicts with an existing one.
	 */
	protected function set_template_tags( Templating_Component_Interface $component ) {
		$tags = $component->template_tags();

		foreach ( $tags as $method_name => $callback ) {
			if ( is_callable( $callback ) ) {
				$callback = [ 'callback' => $callback ];
			}

			if ( ! is_array( $callback ) || ! isset( $callback['callback'] ) ) {
				throw new InvalidArgumentException(
					sprintf(
						/* translators: 1: template tag method name, 2: component class name */
						__( 'The template tag method %1$s registered by theme component %2$s must either be a callable or an array.', 'wp-rig' ),
						$method_name,
						get_class( $component )
					)
				);
			}

			if ( isset( $this->template_tags[ $method_name ] ) ) {
				throw new RuntimeException(
					sprintf(
						/* translators: 1: template tag method name, 2: component class name */
						__( 'The template tag method %1$s registered by theme component %2$s conflicts with an already registered template tag of the same name.', 'wp-rig' ),
						$method_name,
						get_class( $component )
					)
				);
			}

			$this->template_tags[ $method_name ] = $callback;
		}
	}
}
