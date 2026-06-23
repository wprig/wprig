/**
 * Task: List Installed Components
 */

import fs from 'fs-extra';
import path from 'path';
import { logger } from '../lib/rig-utils.js';

/**
 * Lists all installed theme components in the inc/ directory.
 *
 * @param {string} themeRoot Theme root path
 */
export default async function listComponents( themeRoot ) {
	const incDir = path.join( themeRoot, 'inc' );

	if ( ! ( await fs.pathExists( incDir ) ) ) {
		logger.warn( 'No components found in inc/ directory.' );
		return;
	}

	const directories = ( await fs.readdir( incDir, { withFileTypes: true } ) )
		.filter( ( dirent ) => dirent.isDirectory() )
		.map( ( dirent ) => dirent.name );

	const componentList = [];
	for ( const dir of directories ) {
		const manifestPath = path.join( incDir, dir, 'manifest.json' );
		let version = 'unknown';
		let origin = 'Core/Bundled';
		let slug = dir;
		let title = '';

		if ( await fs.pathExists( manifestPath ) ) {
			try {
				const manifest = await fs.readJson( manifestPath );
				version = manifest.version || version;
				slug = manifest.slug || slug;
				title = manifest.title || '';
				if ( manifest.php_url ) {
					origin = 'Registry';
				}
			} catch ( e ) {
				// Silent fail for manifest reading
			}
		}

		componentList.push( {
			slug,
			title,
			version,
			origin,
			folder: `inc/${ dir }`,
		} );
	}

	if ( componentList.length === 0 ) {
		logger.warn( 'No components found in inc/ directory.' );
		return;
	}

	logger.info( 'Installed Theme Components:' );
	logger.table(
		componentList.sort( ( a, b ) => a.slug.localeCompare( b.slug ) )
	);
}
