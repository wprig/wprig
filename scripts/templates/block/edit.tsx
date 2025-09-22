import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';
import type { FC } from 'react';

const Edit: FC = () => {
	const blockProps = useBlockProps();
	return (
		<div {...blockProps}>
			<p>{ __('Hello from WP Rig block!', 'wp-rig') }</p>
		</div>
	);
};

export default Edit;
