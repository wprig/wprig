/**
 * File editor-filters.js.
 *
 * Modify the behavior of the block editor.
 */

wp.domReady( function() {
	const { __ } = wp.i18n;

	wp.blocks.registerBlockStyle( 'core/list', {
		name: 'checkmark-list',
		label: __( 'Checkmark', 'wp-rig' ),
	} );
} );
