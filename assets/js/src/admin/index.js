import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { createElement } from '@wordpress/element'; // For core Gutenberg components compatibility
import { Panel, PanelBody, PanelRow, TextControl } from '@wordpress/components';
import { updateSettings } from './api.js'
import formFieldsData from './settingsFields.json';

const SettingsPage = () => {
	const [ settings, setSettings ] = useState(window.wpRigThemeSettings.settings);

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
					{formFieldsData.fields.map(field => (
						<PanelRow key={field.name}>
							<TextControl
								label={field.label}
								type={field.type}
								value={settings[field.name] || ''}
								onChange={(value) => handleChange(field.name, value)}
							/>
						</PanelRow>
					))}
				</PanelBody>
			</Panel>
		</div>
	);
};

export default SettingsPage;

const renderSettingsPage = () => {
	const container = document.getElementById('my-settings-page');
	if (container) {
		const root = createRoot(container);
		root.render(<SettingsPage />);
	}
};

document.addEventListener('DOMContentLoaded', renderSettingsPage);
