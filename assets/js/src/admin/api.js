const apiRoot = `${ window.location.origin }/wp-json/my-theme/v1/settings`;

export const updateSettings = ( settings ) => {
	return fetch( apiRoot, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-WP-Nonce': window.wpRigThemeSettings.nonce,
		},
		body: JSON.stringify( { settings } ),
	} ).then( ( response ) => response.json() );
};
