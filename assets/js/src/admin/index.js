import { render } from 'react-dom';
import { useState } from 'react';
import { createElement } from '@wordpress/element'; // For core Gutenberg components compatibility
import { Panel, PanelBody, PanelRow, TextControl } from '@wordpress/components';
//import { updateSettings } from 'api.js';
import { updateSettings } from './api.js'

const SettingsPage = () => {
	const [ settings, setSettings ] = useState({
		option1: '',
		option2: ''
	});

	const handleChange = ( settingKey, value ) => {
		const newSettings = { ...settings, [settingKey]: value };
		setSettings(newSettings);

		updateSettings(newSettings).then(response => {
			if (!response.success) {
				console.error('Failed to save settings:', response);
			}
		});
	};

	return (
		<div className="settings-page">
			<Panel>
				<PanelBody title="My Settings Panel">
					<PanelRow>
						<TextControl
							label="Option 1"
							value={settings.option1}
							onChange={(value) => handleChange('option1', value)}
						/>
					</PanelRow>
					<PanelRow>
						<TextControl
							label="Option 2"
							value={settings.option2}
							onChange={(value) => handleChange('option2', value)}
						/>
					</PanelRow>
				</PanelBody>
			</Panel>
		</div>
	);
};

export default SettingsPage;

const renderSettingsPage = () => {
	const container = document.getElementById('my-settings-page');
	if (container) {
		render(<SettingsPage />, container);
	}
};

document.addEventListener('DOMContentLoaded', renderSettingsPage);
