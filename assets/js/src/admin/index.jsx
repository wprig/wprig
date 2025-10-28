// Use WordPress globals to avoid bundling @wordpress/* modules
/* global wp */
const { createRoot, useState, useCallback, useRef } = wp.element;
const { PanelRow, TabPanel, TextControl, SnackbarList, BaseControl, SelectControl, FormToggle } = wp.components;
import { updateSettings } from './api.js';
import formFieldsData from './settingsFields.json';

const textControlTypes = [
	'text',
	'email',
	'url',
	'password',
	'number',
	'search',
	'tel',
	'date',
	'time',
	'datetime-local',
];

const SettingsPage = () => {
	const [ settings, setSettings ] = useState(
		window.wpRigThemeSettings.settings
	);
	const [ snackbarNotices, setSnackbarNotices ] = useState( [] );
	const timeoutRef = useRef( null );

	const debouncedUpdateSettings = useCallback( ( newSettings ) => {
		// Clear previous timeout
		if ( timeoutRef.current ) {
			clearTimeout( timeoutRef.current );
		}

		// Set new timeout
		timeoutRef.current = setTimeout( () => {
			updateSettings( newSettings ).then( ( response ) => {
				if ( response.success ) {
					const newNotice = {
						id: Date.now(),
						content: 'Settings saved!',
						spokenMessage: 'Settings saved!',
					};

					// Use functional update to avoid dependency
					setSnackbarNotices( ( prevNotices ) => [
						...prevNotices,
						newNotice,
					] );

					setTimeout( () => {
						setSnackbarNotices( ( prevNotices ) =>
							prevNotices.filter(
								( notice ) => notice.id !== newNotice.id
							)
						);
					}, 2000 );
				} else {
					// eslint-disable-next-line no-console
					console.error( 'Failed to save settings:', response );
				}
			} );
		}, 1500 );
	}, [] ); // Empty dependency array - function never changes

	const handleChange = ( settingKey, value ) => {
		const newSettings = { ...settings, [ settingKey ]: value };
		setSettings( newSettings );
		debouncedUpdateSettings( newSettings );
	};

	return (
		<div className="settings-page">
			<TabPanel
				tabs={ formFieldsData.tabs.map( ( tab ) => ( {
					name: tab.id,
					title: tab.tabControl.label,
				} ) ) }
			>
				{ ( tab ) => (
					<div>
						{ formFieldsData.tabs
							.find( ( t ) => t.id === tab.name )
							.tabContent.fields.map( ( field ) => (
								<PanelRow key={ field.name }>
									{ field.type === 'toggle' && (
										<BaseControl
											label={ field.label }
											id={ `wp-rig-control-${ field.name }` } // ID for the label element
											htmlFor={ `wp-rig-toggle-${ field.name }` } // Links label to toggle
											__nextHasNoMarginBottom
										>
											<FormToggle
												id={ `wp-rig-toggle-${ field.name }` } // ID for the toggle input
												checked={
													!! settings[ field.name ]
												}
												onChange={ ( event ) =>
													handleChange(
														field.name,
														event.target.checked
													)
												}
											/>
										</BaseControl>
									) }
									{ field.type === 'select' && (
										<SelectControl
											label={ field.label }
											value={
												settings[ field.name ] || ''
											}
											onChange={ ( value ) =>
												handleChange(
													field.name,
													value
												)
											}
											options={ field.options }
											__next40pxDefaultSize
											__nextHasNoMarginBottom
										/>
									) }
									{ textControlTypes.includes(
										field.type
									) && (
										<TextControl
											label={ field.label }
											type={ field.type }
											value={
												settings[ field.name ] || ''
											}
											onChange={ ( value ) =>
												handleChange(
													field.name,
													value
												)
											}
											__next40pxDefaultSize
											__nextHasNoMarginBottom
										/>
									) }
								</PanelRow>
							) ) }
					</div>
				) }
			</TabPanel>
			<div id="settings-saved">
				<SnackbarList notices={ snackbarNotices } />
			</div>
		</div>
	);
};

export default SettingsPage;

const renderSettingsPage = () => {
	const container = document.getElementById( 'wp-rig-settings-page' );
	if ( container ) {
		const root = createRoot( container );
		root.render( <SettingsPage /> );
	}
};

document.addEventListener( 'DOMContentLoaded', renderSettingsPage );
