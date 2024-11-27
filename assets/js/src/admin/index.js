import { createRoot } from 'react-dom/client';
import { useState, useEffect, useCallback } from 'react';
import { createElement } from '@wordpress/element'; // For core Gutenberg components compatibility
import { PanelRow, TabPanel, TextControl, SnackbarList, BaseControl, FormToggle } from '@wordpress/components';
import { updateSettings } from './api.js';
import formFieldsData from './settingsFields.json';

// Debounce function to limit the frequency of calling a function
const debounce = (func, wait) => {
	let timeout;
	return (...args) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
};

const SettingsPage = () => {
	const [settings, setSettings] = useState(window.wpRigThemeSettings.settings);
	const [snackbarNotices, setSnackbarNotices] = useState([]);

	const debouncedUpdateSettings = useCallback(debounce((newSettings) => {
		updateSettings(newSettings).then(response => {
			if (response.success) {
				const newSnackbarNotices = [...snackbarNotices, { id: Date.now(), content: 'Settings were saved' }];
				setSnackbarNotices(newSnackbarNotices);
				setTimeout(() => {
					setSnackbarNotices(prevNotices => prevNotices.filter(notice => notice.id !== newSnackbarNotices[0].id));
				}, 3000);
			} else {
				console.error('Failed to save settings:', response);
			}
		});
	}, 1000), [snackbarNotices]);

	const handleChange = (settingKey, value) => {
		const newSettings = { ...settings, [settingKey]: value };
		setSettings(newSettings);
		debouncedUpdateSettings(newSettings);
	};

	return (
		<div className="settings-page">
			<TabPanel
				tabs={formFieldsData.tabs.map(tab => ({ name: tab.id, title: tab.tabControl.label }))}
			>
				{(tab) => (
					<div>
						{formFieldsData.tabs.find(t => t.id === tab.name).tabContent.fields.map(field => (
							<PanelRow key={field.name}>
								{field.type === 'toggle' && <BaseControl label={field.label}><FormToggle
									checked={!!settings[field.name]}
									onChange={(event) => handleChange(field.name, event.target.checked)}
								/></BaseControl>}
								{field.type !== 'toggle' && <TextControl
									label={field.label}
									type={field.type}
									value={settings[field.name] || ''}
									onChange={(value) => handleChange(field.name, value)}
								/>}

							</PanelRow>
						))}
					</div>
				)}
			</TabPanel>
			<SnackbarList notices={snackbarNotices} />
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
