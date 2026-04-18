/**
 * Task: Search Components in Registry
 */

import { logger } from '../lib/rig-utils.js';
import { getAuth } from '../lib/auth.js';

/**
 * Searches for components in the registry.
 *
 * @param {string} keyword Search keyword
 * @param {Object} options CLI options
 */
export default async function searchComponents( keyword, options ) {
	const auth = await getAuth( options );
	logger.info(
		`Searching for components matching "${ keyword || '' }" at ${
			auth.url
		}...`
	);

	try {
		const response = await fetch(
			`${ auth.url }/wp-json/wprig/v1/registry/search?q=${
				keyword || ''
			}${ options.force ? '&force=1' : '' }`,
			{
				headers: {
					...( auth.username && auth.token
						? {
								Authorization: `Basic ${ Buffer.from(
									`${ auth.username }:${ auth.token }`
								).toString( 'base64' ) }`,
						  }
						: {} ),
				},
			}
		);

		if ( ! response.ok ) {
			throw new Error( `HTTP Error: ${ response.status }` );
		}

		const results = await response.json();
		if ( results.length === 0 ) {
			logger.warn( 'No components found.' );
			return;
		}

		logger.table(
			results.map( ( r ) => ( {
				slug: r.slug,
				name: r.name,
				version: r.version,
				performance: r.performance,
				agentReady: r.agentReady,
			} ) )
		);
	} catch ( error ) {
		logger.error( `Search failed: ${ error.message }` );
	}
}
