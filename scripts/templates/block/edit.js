const { __ } = wp.i18n;
const { useBlockProps } = wp.blockEditor;

export default function Edit() {
	const blockProps = useBlockProps();
	return (
		<div {...blockProps}>
			<p>{ __( 'Hello from WP Rig block!', 'wp-rig' ) }</p>
		</div>
	);
}
