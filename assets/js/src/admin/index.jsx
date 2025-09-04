import { createRoot } from 'react-dom/client';
import { useState, useCallback, useRef } from 'react';
import {
	PanelRow,
	TabPanel,
	TextControl,
	SnackbarList,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';
import { updateSettings } from './api.js';
import formFieldsData from './settingsFields.json';

const textControlTypes = [
	'text',
	'email',
	'url',
	'number',
	'password',
	'search',
	'tel',
	'date',
	'time',
	'datetime-local',
];

function getInitialSettings() {
	if ( typeof window !== 'undefined' && window.wpRigSettings ) {
		return { ...window.wpRigSettings };
	}
	return {};
}

const SettingsPage = () => {
	const [ settings, setSettings ] = useState( getInitialSettings() );
	const [ notices, setNotices ] = useState( [] );
	const debounceRef = useRef(
		/** @type {ReturnType<typeof setTimeout> | null} */ ( null )
	);

	const debouncedUpdateSettings = useCallback( ( next ) => {
		if ( debounceRef.current ) {
			clearTimeout( debounceRef.current );
		}
		debounceRef.current = setTimeout( async () => {
			try {
				await updateSettings( next );
				setNotices( ( prev ) => [
					...prev,
					{
						id: String( Date.now() ),
						status: 'success',
						content: 'Settings saved.',
					},
				] );
			} catch ( err ) {
				// eslint-disable-next-line no-console
				console.error( err );
				setNotices( ( prev ) => [
					...prev,
					{
						id: String( Date.now() ),
						status: 'error',
						content: 'Failed to save settings.',
					},
				] );
			}
		}, 1500 );
	}, [] );

	const handleChange = ( key, value ) => {
		const next = { ...settings, [ key ]: value };
		setSettings( next );
		debouncedUpdateSettings( next );
	};

	return (
		<div className="settings-page">
			<SnackbarList
				notices={ notices }
				className="wp-rig-settings__notices"
				onRemove={ ( id ) =>
					setNotices( ( prev ) =>
						prev.filter( ( n ) => n.id !== id )
					)
				}
			/>

			<TabPanel
				tabs={ formFieldsData.tabs.map( ( tab ) => ( {
					name: tab.id,
					title: tab.tabControl?.label ?? tab.id,
				} ) ) }
			>
				{ ( tab ) => {
					const activeTab = formFieldsData.tabs.find(
						( t ) => t.id === tab.name
					);
					const fields = activeTab?.tabContent?.fields ?? [];

					return (
						<div className="wp-rig-settings__tab">
							{ fields.map( ( field ) => (
								<PanelRow key={ field.name }>
									{ field.type === 'toggle' && (
										<ToggleControl
											label={ field.label }
											checked={
												!! settings[ field.name ]
											}
											onChange={ () =>
												handleChange(
													field.name,
													! settings[ field.name ]
												)
											}
											__nextHasNoMarginBottom
										/>
									) }

									{ field.type === 'select' && (
										<SelectControl
											label={ field.label }
											value={
												settings[ field.name ] || ''
											}
											options={ field.options || [] }
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
					);
				} }
			</TabPanel>
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
