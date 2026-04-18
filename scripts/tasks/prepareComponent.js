/**
 * Task: Prepare Component for Submission
 */

import fs from 'fs-extra';
import path from 'path';
import c from 'ansi-colors';
import { logger, toPascalCase } from '../lib/rig-utils.js';
import { getAssetPath } from '../lib/utils.js';
import testComponent from './testComponent.js';

/**
 * Prepares a component for submission by packaging it into a folder.
 *
 * @param {string} slug      Component slug
 * @param {string} themeRoot Theme root path
 */
export default async function prepareComponent( slug, themeRoot ) {
	const normalizedSlug = toPascalCase( slug );
	logger.info(
		`Preparing component "${ normalizedSlug }" for submission...`
	);

	let realSlug = normalizedSlug;
	let componentDir = path.join( themeRoot, 'inc', normalizedSlug );

	if ( ! ( await fs.pathExists( componentDir ) ) ) {
		// Fallback: check if the original slug directory exists
		const fallbackDir = path.join( themeRoot, 'inc', slug );
		if ( ! ( await fs.pathExists( fallbackDir ) ) ) {
			logger.error(
				`Component folder not found in inc/ for "${ normalizedSlug }" or "${ slug }"`
			);
			return;
		}
		realSlug = slug;
		componentDir = fallbackDir;
	}

	// Pre-flight check
	try {
		const success = await testComponent( themeRoot, realSlug );
		if ( ! success ) {
			logger.error( `Validation failed for component "${ realSlug }".` );
			return;
		}
	} catch ( e ) {
		logger.error( `Validation error: ${ e.message }` );
		return;
	}

	try {
		const distDir = path.join( themeRoot, 'dist', 'components', realSlug );
		await fs.ensureDir( distDir );
		// Clear existing directory to avoid old files remaining
		await fs.emptyDir( distDir );

		const manifestPath = path.join( componentDir, 'manifest.json' );
		if ( ! ( await fs.pathExists( manifestPath ) ) ) {
			throw new Error( `manifest.json not found in ${ componentDir }` );
		}
		const manifest = await fs.readJson( manifestPath );

		await copyCoreFiles( componentDir, distDir );
		await copyAssets( manifest, themeRoot, distDir );
		await copyAdditionalFiles( manifest, componentDir, distDir );

		logger.success(
			`Component "${ realSlug }" prepared successfully in ${ path.relative(
				themeRoot,
				distDir
			) }`
		);

		printNextSteps( realSlug, distDir );
	} catch ( error ) {
		logger.error( `Preparation failed: ${ error.message }` );
	}
}

/**
 * Copies core component files to the dist directory.
 *
 * @param {string} componentDir Source component directory
 * @param {string} distDir      Destination dist directory
 */
async function copyCoreFiles( componentDir, distDir ) {
	const coreFiles = [
		'Component.php',
		'manifest.json',
		'SPEC.md',
		'SKILL.md',
	];

	for ( const name of coreFiles ) {
		const filePath = path.join( componentDir, name );
		if ( await fs.pathExists( filePath ) ) {
			await fs.copy( filePath, path.join( distDir, name ) );
		}
	}
}

/**
 * Copies assets from manifest to the dist directory.
 *
 * @param {Object} manifest  Component manifest
 * @param {string} themeRoot Theme root path
 * @param {string} distDir   Destination dist directory
 */
async function copyAssets( manifest, themeRoot, distDir ) {
	if ( ! manifest.asset_mapping ) {
		return;
	}

	for ( const type in manifest.asset_mapping ) {
		const asset = manifest.asset_mapping[ type ];
		if ( ! asset.src ) {
			continue;
		}

		const assetPath = path.resolve( themeRoot, getAssetPath( asset.src ) );
		if ( await fs.pathExists( assetPath ) ) {
			const destAssetPath = path.join( distDir, asset.src );
			await fs.ensureDir( path.dirname( destAssetPath ) );
			await fs.copy( assetPath, destAssetPath );
		}
	}
}

/**
 * Copies additional files from manifest.files if they are local paths.
 *
 * @param {Object} manifest     Component manifest
 * @param {string} componentDir Source component directory
 * @param {string} distDir      Destination dist directory
 */
async function copyAdditionalFiles( manifest, componentDir, distDir ) {
	if ( ! manifest.files ) {
		return;
	}

	for ( const [ fileName, fileUrl ] of Object.entries( manifest.files ) ) {
		// Only include if it doesn't look like a URL (i.e. it's a local file)
		if ( ! fileUrl.startsWith( 'http' ) ) {
			const filePath = path.join( componentDir, fileName );
			if ( await fs.pathExists( filePath ) ) {
				const destPath = path.join( distDir, fileName );
				await fs.ensureDir( path.dirname( destPath ) );
				await fs.copy( filePath, destPath );
			}
		}
	}
}

/**
 * Prints manual instructions for submitting the component.
 *
 * @param {string} realSlug Original component slug
 * @param {string} distDir  Dist directory path
 */
function printNextSteps( realSlug, distDir ) {
	logger.log( '\n' + c.blue.bold( 'NEXT STEPS TO SUBMIT TO THE REGISTRY:' ) );
	logger.log(
		'1. Fork the component registry repository: ' +
			c.cyan( 'https://github.com/wprig/wprig-components' )
	);
	logger.log( '2. Clone your fork locally and create a new branch:' );
	logger.log(
		c.gray(
			'   git clone https://github.com/YOUR_USERNAME/wprig-components.git'
		)
	);
	logger.log( c.gray( '   cd wprig-components' ) );
	logger.log(
		c.gray(
			`   git checkout -b add-${ realSlug
				.toLowerCase()
				.replace( /_/g, '-' ) }`
		)
	);
	logger.log(
		'3. Copy the prepared folder into the ' +
			c.cyan( 'components/' ) +
			' directory of the repo:'
	);
	logger.log( c.gray( `   cp -r ${ distDir } ./components/` ) );
	logger.log( '4. Commit and push your changes:' );
	logger.log( c.gray( `   git add components/${ realSlug }` ) );
	logger.log( c.gray( `   git commit -m "Add ${ realSlug } component"` ) );
	logger.log(
		c.gray(
			`   git push origin add-${ realSlug
				.toLowerCase()
				.replace( /_/g, '-' ) }`
		)
	);
	logger.log(
		'5. Submit a Pull Request to the main ' +
			c.cyan( 'wprig-components' ) +
			' repository.'
	);
}
