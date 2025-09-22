// Use WordPress globals to avoid bundling duplicate registries
const { registerBlockType } = wp.blocks;
const { __ } = wp.i18n;
import Edit from './edit';

registerBlockType( 'wprig/example', {
	apiVersion: 2,
	title: __( 'Example Block', 'wp-rig' ),
	edit: Edit,
	save() {
		return null; // Server-rendered or dynamic as needed
	},
} );
