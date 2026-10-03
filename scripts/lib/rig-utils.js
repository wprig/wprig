/**
 * WP Rig Component Registry CLI Utilities
 */

import c from 'ansi-colors';
import path from 'path';
import fs from 'fs-extra';

/**
 * Logger utility to provide messaging while avoiding ESLint no-console warnings.
 */
export const logger = {
	/* eslint-disable no-console */
	info: ( msg ) => console.log( c.blue( msg ) ),
	success: ( msg ) => console.log( c.green( msg ) ),
	warn: ( msg ) => console.warn( c.yellow( msg ) ),
	error: ( msg ) => console.error( c.red( msg ) ),
	debug: ( msg ) => console.log( c.dim( msg ) ),
	log: ( ...args ) => console.log( ...args ),
	table: ( ...args ) => console.table( ...args ),
	/* eslint-enable no-console */
};

/**
 * Normalizes an `asset_mapping[type]` value into a flat array of asset entries.
 *
 * The OCR manifest (schema v2) allows either a single entry object or an array
 * of entries per type (styles/scripts). All consumers (rig:add, rig:prepare,
 * rig:test-component) must treat both forms identically.
 *
 * @param {Array|Object} mappingEntry The value of `asset_mapping[type]`.
 * @return {Array<Object>} Flat list of `{ src, target, scoped }` entries.
 */
export function normalizeAssetEntries( mappingEntry ) {
	if ( Array.isArray( mappingEntry ) ) {
		return mappingEntry.filter(
			( entry ) => entry && typeof entry === 'object'
		);
	}
	if ( mappingEntry && typeof mappingEntry === 'object' ) {
		return [ mappingEntry ];
	}
	return [];
}

/**
 * Normalizes a slug to PascalCase with underscores.
 * e.g. mega-menu -> Mega_Menu
 *
 * @param {string} slug Slug to normalize
 * @return {string} Normalized slug
 */
export function toPascalCase( slug ) {
	let normalized = slug
		.split( /[-_ ]+/ )
		.map( ( word ) => word.charAt( 0 ).toUpperCase() + word.slice( 1 ) )
		.join( '_' );

	// Ensure the result is a valid PHP identifier by prepending an underscore if it starts with a digit.
	if ( /^[0-9]/.test( normalized ) ) {
		normalized = '_' + normalized;
	}

	return normalized;
}

/**
 * Gets a map of component dependencies.
 * Key: component slug, Value: Array of component slugs that depend on it.
 *
 * @param {string} themeRoot Path to the theme root
 * @return {Promise<Object>} Dependency map
 */
export async function getDependentsMap( themeRoot ) {
	const incDir = path.join( themeRoot, 'inc' );
	if ( ! ( await fs.pathExists( incDir ) ) ) {
		return {};
	}

	const directories = ( await fs.readdir( incDir, { withFileTypes: true } ) )
		.filter( ( dirent ) => dirent.isDirectory() )
		.map( ( dirent ) => dirent.name );

	const dependentsMap = {};
	for ( const dir of directories ) {
		const manifestPath = path.join( incDir, dir, 'manifest.json' );
		if ( await fs.pathExists( manifestPath ) ) {
			try {
				const manifest = await fs.readJson( manifestPath );
				const slug = manifest.slug || dir;
				if (
					manifest.dependencies &&
					Array.isArray( manifest.dependencies )
				) {
					for ( const dep of manifest.dependencies ) {
						if ( ! dependentsMap[ dep ] ) {
							dependentsMap[ dep ] = [];
						}
						dependentsMap[ dep ].push( slug );
					}
				}
			} catch ( e ) {
				// Silent fail
			}
		}
	}
	return dependentsMap;
}

/**
 * Scans the inc directory for components to rebuild a manifest.
 *
 * @param {string} themeRoot Path to the theme root
 * @return {Promise<Object>} Rebuilt manifest
 */
export async function rebuildManifestFromDisk( themeRoot ) {
	const incDir = path.join( themeRoot, 'inc' );
	const manifest = {};

	if ( ! ( await fs.pathExists( incDir ) ) ) {
		return manifest;
	}

	const files = await fs.readdir( incDir, { withFileTypes: true } );
	for ( const file of files ) {
		if ( file.isDirectory() ) {
			const componentDir = path.join( incDir, file.name );
			const componentFile = path.join( componentDir, 'Component.php' );
			if ( await fs.pathExists( componentFile ) ) {
				const componentSlug = toPascalCase( file.name );
				manifest[ componentSlug ] = `inc/${ file.name }/Component.php`;
			}
		}
	}

	return manifest;
}

/**
 * Updates the components manifest file.
 *
 * @param {string}  themeRoot     Path to the theme root
 * @param {string}  componentSlug Component slug
 * @param {string}  relativePath  Relative path to the component file
 * @param {boolean} isRemoving    Whether the component is being removed
 */
export async function updateRegistryManifest(
	themeRoot,
	componentSlug,
	relativePath,
	isRemoving = false
) {
	const registryManifestPath = path.join(
		themeRoot,
		'inc',
		'components-manifest.json'
	);
	let registryManifest = {};

	if ( await fs.pathExists( registryManifestPath ) ) {
		try {
			registryManifest = await fs.readJson( registryManifestPath );
		} catch ( e ) {
			logger.warn(
				'Could not parse existing components-manifest.json, merging from disk.'
			);
			registryManifest = await rebuildManifestFromDisk( themeRoot );
		}
	} else {
		registryManifest = await rebuildManifestFromDisk( themeRoot );
	}

	if ( isRemoving ) {
		let updated = false;
		if ( registryManifest[ componentSlug ] ) {
			delete registryManifest[ componentSlug ];
			updated = true;
		}
		// Also check for the raw slug if it exists in the manifest
		const rawSlug = relativePath; // Usually the original slug is passed as relativePath when removing
		if ( registryManifest[ rawSlug ] ) {
			delete registryManifest[ rawSlug ];
			updated = true;
		}

		if ( updated ) {
			await fs.writeJson( registryManifestPath, registryManifest, {
				spaces: 2,
			} );
			logger.success( 'Updated components-manifest.json.' );
		}
	} else {
		registryManifest[ componentSlug ] = relativePath;
		try {
			await fs.ensureDir( path.dirname( registryManifestPath ) );
			await fs.writeJson( registryManifestPath, registryManifest, {
				spaces: 2,
			} );
			logger.success( 'Updated inc/components-manifest.json' );
		} catch ( e ) {
			logger.error(
				`Failed to update components-manifest.json: ${ e.message }`
			);
		}
	}
}
