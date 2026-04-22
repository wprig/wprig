/**
 * Task: Search Components in Registry
 */

import { logger } from '../lib/rig-utils.js';
import { getAuth } from '../lib/auth.js';
import { fetchRegistry } from '../lib/registry.js';

/**
 * Searches for components in the registry.
 *
 * @param {string} keyword Search keyword
 * @param {Object} options CLI options
 */
export default async function searchComponents( keyword, options ) {
	const auth = await getAuth( options );
	const isGitHubSource = auth.githubOwner && auth.githubRepo;
	const sourceText = isGitHubSource
		? `GitHub (${ auth.githubOwner }/${ auth.githubRepo })`
		: auth.url;

	logger.info(
		`Searching for components matching "${
			keyword || ''
		}" from ${ sourceText }...`
	);

	try {
		const results = await fetchRegistry( auth );

		if ( results.length === 0 ) {
			logger.warn( 'No components found.' );
			return;
		}

		// Client-side filtering if keyword is provided
		let filteredResults = results;
		if ( keyword ) {
			const lowerKeyword = keyword.toLowerCase();
			filteredResults = results.filter( ( r ) => {
				const slugMatch = r.slug.toLowerCase().includes( lowerKeyword );
				const titleMatch =
					r.title && r.title.toLowerCase().includes( lowerKeyword );
				return slugMatch || titleMatch;
			} );
		}

		if ( filteredResults.length === 0 ) {
			logger.warn( `No components found matching "${ keyword }".` );
			return;
		}

		logger.table(
			filteredResults.map( ( r ) => ( {
				slug: r.slug,
				name: r.title || r.name || r.slug,
				version: r.version,
				performance: r.performance || 'N/A',
				agentReady: r.agentReady || ( r.manifest ? 'Yes' : 'N/A' ),
			} ) )
		);
	} catch ( error ) {
		logger.error( `Search failed: ${ error.message }` );
	}
}
