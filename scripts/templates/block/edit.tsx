// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
const { __ } = (wp as any).i18n;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
const { useBlockProps } = (wp as any).blockEditor;
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
