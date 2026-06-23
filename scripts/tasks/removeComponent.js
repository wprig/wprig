/**
 * Task: Remove Component
 */

import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import {
	logger,
	toPascalCase,
	getDependentsMap,
	updateRegistryManifest,
} from '../lib/rig-utils.js';
import { getAssetPath } from '../lib/utils.js';

/**
 * Removes a component and its associated assets.
 *
 * @param {string} slug      Component slug
 * @param {string} themeRoot Theme root path
 */
export default async function removeComponent( slug, themeRoot ) {
	const normalizedSlug = toPascalCase( slug );
	const dependentsMap = await getDependentsMap( themeRoot );
	const dependents =
		dependentsMap[ normalizedSlug ] || dependentsMap[ slug ] || [];

	if ( dependents.length > 0 ) {
		logger.error(
			`Cannot remove component "${ normalizedSlug }". It is a dependency for: ${ dependents.join(
				', '
			) }`
		);
		return;
	}

	logger.info( `Removing component "${ normalizedSlug }"...` );

	const componentDir = path.join( themeRoot, 'inc', normalizedSlug );
	const fallbackDir = path.join( themeRoot, 'inc', slug );
	let targetDir = null;

	if ( await fs.pathExists( componentDir ) ) {
		targetDir = componentDir;
	} else if ( await fs.pathExists( fallbackDir ) ) {
		targetDir = fallbackDir;
	}

	if ( ! targetDir ) {
		logger.error(
			`Component folder not found in inc/ for "${ normalizedSlug }" or "${ slug }"`
		);
		return;
	}

	// Try to read manifest for asset and AI cleanup (before removing folder)
	const manifestPath = path.join( targetDir, 'manifest.json' );
	let rawSlug = slug;

	if ( await fs.pathExists( manifestPath ) ) {
		try {
			const manifest = await fs.readJson( manifestPath );
			rawSlug = manifest.slug || rawSlug;
			await cleanupAssets( manifest, themeRoot );
		} catch ( e ) {
			logger.warn( 'Could not parse manifest.json for asset cleanup.' );
		}
	}

	await fs.remove( targetDir );

	// Clean up AI skills
	const aiSkillsDir = path.join( themeRoot, '.ai', 'skills', rawSlug );
	if ( await fs.pathExists( aiSkillsDir ) ) {
		await fs.remove( aiSkillsDir );
		logger.warn( `Removed AI skills: .ai/skills/${ rawSlug }` );
	}

	logger.success(
		`Component folder "${ path.relative(
			path.join( themeRoot, 'inc' ),
			targetDir
		) }" removed.`
	);

	await updateRegistryManifest( themeRoot, normalizedSlug, slug, true );
	await runBuildCleanup( themeRoot );
}

/**
 * Cleans up assets associated with a component.
 *
 * @param {Object} manifest  Component manifest
 * @param {string} themeRoot Theme root path
 */
async function cleanupAssets( manifest, themeRoot ) {
	if ( ! manifest.asset_mapping ) {
		return;
	}

	for ( const type in manifest.asset_mapping ) {
		const asset = manifest.asset_mapping[ type ];
		if ( ! asset.src ) {
			continue;
		}

		const mappedSrc = getAssetPath( asset.src );
		const assetPath = path.resolve( themeRoot, mappedSrc );

		if ( await fs.pathExists( assetPath ) ) {
			await fs.remove( assetPath );
			logger.warn( `Removed asset: ${ mappedSrc }` );

			// Also remove .min files in the root folder if they exist
			await cleanupMinifiedAssets( mappedSrc, themeRoot );
		}
	}
}

/**
 * Cleans up minified versions of assets.
 *
 * @param {string} mappedSrc Path to the source asset
 * @param {string} themeRoot Theme root path
 */
async function cleanupMinifiedAssets( mappedSrc, themeRoot ) {
	if (
		! mappedSrc.includes( '/src/' ) ||
		! (
			mappedSrc.endsWith( '.css' ) ||
			mappedSrc.endsWith( '.js' ) ||
			mappedSrc.endsWith( '.ts' )
		)
	) {
		return;
	}

	const minFileName = path
		.basename( mappedSrc )
		.replace( /\.(css|js|ts)$/, '.min.$1' )
		.replace( '.min.ts', '.min.js' ); // TS compiles to JS

	const minAssetPath = path.resolve(
		themeRoot,
		path.dirname( path.dirname( mappedSrc ) ),
		minFileName
	);

	if ( await fs.pathExists( minAssetPath ) ) {
		await fs.remove( minAssetPath );
		logger.warn(
			`Removed minified asset: ${ path.relative(
				themeRoot,
				minAssetPath
			) }`
		);
	}
}

/**
 * Runs the build process to clean up assets.
 *
 * @param {string} themeRoot Theme root path
 */
async function runBuildCleanup( themeRoot ) {
	logger.info( 'Running "npm run build" to clean up assets...' );
	try {
		execSync( 'npm run build', { stdio: 'inherit', cwd: themeRoot } );
		logger.success( '✓ Build completed successfully!' );
	} catch ( buildError ) {
		logger.error( `Build failed: ${ buildError.message }` );
	}
}
