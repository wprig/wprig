import { render } from 'react-dom';
import { createElement } from '@wordpress/element'; // For core Gutenberg components compatibility
import { Panel, PanelBody, PanelRow } from '@wordpress/components';

const SettingsPage = () => (
	<div className="settings-page">
		<Panel>
			<PanelBody title="My Settings Panel">
				<PanelRow>Some settings...</PanelRow>
			</PanelBody>
		</Panel>
	</div>
);

const renderSettingsPage = () => {
	const container = document.getElementById('my-settings-page');
	if (container) {
		render(<SettingsPage />, container);
	}
};

document.addEventListener('DOMContentLoaded', renderSettingsPage);
