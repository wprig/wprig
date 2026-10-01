// Classic Menu block — editor-only registration.
//
// This gives the server-rendered `wprig/classic-menu` block a client-side
// identity so the block editor recognizes it (inserter, validation, editing).
// Rendering stays server-side: `save()` returns null and the editor previews
// the block through `wp-server-side-render` (the `render: file:` callback in
// block.json). Without this registration the editor treats the block as an
// unsupported/"missing" block even though it renders on the frontend.

// Use WordPress globals to avoid bundling @wordpress/* modules.
const { registerBlockType } = wp.blocks;
const { __ } = wp.i18n;
const { InspectorControls, useBlockProps } = wp.blockEditor;
const { PanelBody, TextControl } = wp.components;
const ServerSideRender = wp.serverSideRender;

function Edit( { attributes = {}, setAttributes } ) {
	const blockProps = useBlockProps();
	const themeLocation = attributes.themeLocation || 'primary';
	const menuSlug = attributes.menuSlug || '';
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Menu settings', 'wp-rig' ) }>
					<TextControl
						label={ __( 'Theme location', 'wp-rig' ) }
						help={ __(
							'The registered theme location to render (for example: primary).',
							'wp-rig'
						) }
						value={ themeLocation }
						onChange={ ( value ) =>
							setAttributes( { themeLocation: value } )
						}
					/>
					<TextControl
						label={ __( 'Menu slug or ID', 'wp-rig' ) }
						help={ __(
							'Optional. Render a specific menu instead of the theme location.',
							'wp-rig'
						) }
						value={ menuSlug }
						onChange={ ( value ) =>
							setAttributes( { menuSlug: value } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<ServerSideRender
					block="wprig/classic-menu"
					attributes={ attributes }
				/>
			</div>
		</>
	);
}

registerBlockType( 'wprig/classic-menu', {
	apiVersion: 3,
	title: __( 'Classic Menu', 'wp-rig' ),
	icon: 'menu',
	category: 'theme',
	keywords: [ __( 'mega', 'wp-rig' ), __( 'navigation', 'wp-rig' ) ],
	attributes: {
		themeLocation: { type: 'string', default: 'primary' },
		menuSlug: { type: 'string' },
	},
	supports: {
		html: false,
		interactivity: false,
		reusable: false,
	},
	edit: Edit,
	save() {
		return null;
	},
} );
