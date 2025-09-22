import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';

export default function Edit() {
	const blockProps = useBlockProps();
	return (
		<div {...blockProps}>
			<p>{ __( 'Hello from WP Rig block!', 'wp-rig' ) }</p>
		</div>
	);
}
