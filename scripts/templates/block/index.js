import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import Edit from './edit';

registerBlockType( 'wprig/example', {
	apiVersion: 2,
	title: __( 'Example Block', 'wp-rig' ),
	edition: 'both',
	edits: Edit,
	save() {
		return null; // Server-rendered or dynamic as needed
	},
} );
