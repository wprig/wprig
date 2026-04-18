/**
 * WP Rig Component Registry Auth Logic
 */

import fs from 'fs-extra';
import path from 'path';
import { logger } from './rig-utils.js';

/**
 * Gets the authentication data for the registry.
 *
 * @param {Object} options CLI options
 * @return {Promise<Object>} Auth data
 */
export async function getAuth( options = {} ) {
	const authFile = path.join(
		process.env.HOME || process.env.USERPROFILE,
		'.wprig',
		'auth.json'
	);

	let authData = null;
	if ( await fs.pathExists( authFile ) ) {
		try {
			authData = await fs.readJson( authFile );
			// Handle legacy format migration if it exists
			if ( authData && authData.url && ! authData.registries ) {
				authData = {
					current: 'default',
					registries: {
						default: authData,
					},
				};
				// Save the migrated data
				await fs.ensureDir( path.dirname( authFile ) );
				await fs.writeJson( authFile, authData, { spaces: 2 } );
				logger.info(
					'Migrated auth.json to the new multi-registry format.'
				);
			}
		} catch ( e ) {
			authData = null;
		}
	}

	const registryName =
		options.registry || ( authData && authData.current ) || 'default';

	if (
		authData &&
		authData.registries &&
		authData.registries[ registryName ]
	) {
		return authData.registries[ registryName ];
	}

	// Default public config
	return {
		url: 'https://wprig.io',
		githubOwner: 'wprig',
		githubRepo: 'wprig-components',
		githubBranch: 'main',
	};
}
