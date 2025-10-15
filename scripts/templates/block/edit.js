// WP globals
const { __ } = wp.i18n;
const { InspectorControls, InnerBlocks, useBlockProps } = wp.blockEditor;
const { PanelBody, TextControl } = wp.components;

export default function Edit(props) {
	const { attributes = {}, setAttributes } = props || {};
	const { title = '' } = attributes;
	const blockProps = useBlockProps();
	return (
		<div {...blockProps}>
			<InspectorControls>
				<PanelBody title={__('Settings', 'wp-rig')}>
					<TextControl
						label={__('Title', 'wp-rig')}
						value={title}
						onChange={(v) => setAttributes && setAttributes({ title: v })}
					/>
				</PanelBody>
			</InspectorControls>
			{title ? <h3>{title}</h3> : null}
			<InnerBlocks />
		</div>
	);
}
