import ServerSideRender from '@wordpress/server-side-render';
// WP globals
const { useBlockProps } = wp.blockEditor;

export default function Edit(props) {
	const { name, attributes = {} } = props || {};
	const blockProps = useBlockProps();
	return (
		<div {...blockProps}>
			<ServerSideRender block={name} attributes={attributes} />
		</div>
	);
}
