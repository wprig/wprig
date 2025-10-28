const ServerSideRender =
	(wp as any).serverSideRender || (wp as any).components?.ServerSideRender;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
const { useBlockProps } = (wp as any).blockEditor;
import type { FC } from 'react';

interface EditProps {
	name: string;
	attributes: Record<string, unknown>;
}

const Edit: FC<Partial<EditProps>> = (props) => {
	const { name, attributes = {} } = props || {};
	const blockProps = useBlockProps();
	return (
		<div {...blockProps}>
			{/* @ts-expect-error: attributes from wp globals typing */}
			<ServerSideRender block={name} attributes={attributes} />
		</div>
	);
};

export default Edit;
