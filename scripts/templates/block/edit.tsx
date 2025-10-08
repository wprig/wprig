// WP globals
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
const { __ } = (wp as any).i18n;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
import {
	InspectorControls,
	InnerBlocks,
	useBlockProps,
} from '@wordpress/block-editor';
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
const { PanelBody, TextControl } = (wp as any).components;
import type { FC } from 'react';

interface EditProps {
	attributes: { title?: string };
	setAttributes: (next: Record<string, unknown>) => void;
}

const Edit: FC<Partial<EditProps>> = (props) => {
	const { attributes = {}, setAttributes } = props || {};
	const { title = '' } = attributes as { title?: string };
	const blockProps = useBlockProps();
	return (
		<div {...blockProps}>
			<InspectorControls>
				<PanelBody title={__('Settings', 'wp-rig')}>
					<TextControl
						label={__('Title', 'wp-rig')}
						value={title}
						onChange={(v: string) =>
							setAttributes && setAttributes({ title: v })
						}
					/>
				</PanelBody>
			</InspectorControls>
			{title ? <h3>{title}</h3> : null}
			<InnerBlocks />
		</div>
	);
};

export default Edit;
