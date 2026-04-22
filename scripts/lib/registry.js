/**
 * WP Rig Component Registry Data Fetcher
 */

import { logger } from './rig-utils.js';

/**
 * Fetches the component registry from GitHub or the REST API.
 *
 * @param {Object} auth Auth data from getAuth()
 * @return {Promise<Array>} List of components
 */
export async function fetchRegistry( auth ) {
	const isGitHubSource = auth.githubOwner && auth.githubRepo;

	if ( isGitHubSource ) {
		const branch = auth.githubBranch || 'main';
		const url = `https://raw.githubusercontent.com/${ auth.githubOwner }/${ auth.githubRepo }/${ branch }/REGISTRY.md`;

		try {
			const response = await fetch( url );
			if ( ! response.ok ) {
				throw new Error( `HTTP ${ response.status }` );
			}

			const markdown = await response.text();
			const jsonMatch = markdown.match( /```json\s+([\s\S]*?)\s+```/ );

			if ( jsonMatch ) {
				const data = JSON.parse( jsonMatch[ 1 ] );
				if ( data && data.components ) {
					return data.components;
				}
			}
			throw new Error( 'Could not find registry JSON in REGISTRY.md' );
		} catch ( error ) {
			logger.debug( `GitHub Registry fetch failed: ${ error.message }` );
			// If GitHub fails, we fall through to the REST API if url is present
		}
	}

	if ( auth.url ) {
		try {
			const response = await fetch(
				`${ auth.url }/wp-json/wprig/v1/registry/search`
			);
			if ( response.ok ) {
				return await response.json();
			}
		} catch ( error ) {
			logger.debug( `Registry API fetch failed: ${ error.message }` );
		}
	}

	return [];
}
