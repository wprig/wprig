<?php
	$menu_toggle_button = '<button class="menu-toggle" aria-label="' . esc_html__( 'Open menu', 'wp-rig' ) . '" aria-controls="primary-menu" aria-expanded="false">
					' . esc_html__( 'Menu', 'wp-rig' ) . '
					</button>';
	$menu_toggle_button = apply_filters( 'wp_rig_menu_toggle_button', $menu_toggle_button );
	echo $menu_toggle_button; /* phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped */

