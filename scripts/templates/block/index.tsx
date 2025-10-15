// Use WP globals; keep TS
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
const { registerBlockType } = (wp as any).blocks;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
const { __ } = (wp as any).i18n;
import Edit from './edit';

registerBlockType('wprig/example', {
	apiVersion: 2,
	title: __('Example Block', 'wp-rig'),
	edit: Edit,
	save() {
		return null;
	},
});
