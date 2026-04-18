#!/usr/bin/env node
/**
 * WP Rig Component Registry CLI
 */

import { Command } from 'commander';
import { execSync } from 'child_process';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import c from 'ansi-colors';
import { getAssetPath } from './lib/utils.js';
import testComponent from './tasks/testComponent.js';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const themeRoot = path.resolve( __dirname, '..' );

/**
 * Logger utility to provide messaging while avoiding ESLint no-console warnings.
 */
const logger = {
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


const program = new Command();

program
	.name( 'rig' )
	.description( 'WP Rig Component Registry CLI' )
	.version( '1.0.0' )
	.option( '-r, --registry <name>', 'Registry to use', 'default' )
	.option( '-y, --yes', 'Automatically answer "yes" to all prompts', false )
	.option( '--force', 'Bypass all caches', false );

async function getAuth( options = {} ) {
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
				logger.info( 'Migrated auth.json to the new multi-registry format.' );
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

/**
 * Normalizes a slug to PascalCase with underscores.
 * e.g. mega-menu -> Mega_Menu
 *
 * @param {string} slug Slug to normalize
 * @return {string} Normalized slug
 */
function toPascalCase( slug ) {
	let normalized = slug
		.split( /[-_ ]/ )
		.map( ( word ) => word.charAt( 0 ).toUpperCase() + word.slice( 1 ) )
		.join( '_' );

	// Ensure the result is a valid PHP identifier by prepending an underscore if it starts with a digit.
	if ( /^[0-9]/.test( normalized ) ) {
		normalized = '_' + normalized;
	}

	return normalized;
}

program
	.command( 'list' )
	.description( 'List all installed theme components' )
	.action( async () => {
		const incDir = path.join( themeRoot, 'inc' );
		const directories = (
			await fs.readdir( incDir, { withFileTypes: true } )
		)
			.filter( ( dirent ) => dirent.isDirectory() )
			.map( ( dirent ) => dirent.name );

		const componentList = [];
		for ( const dir of directories ) {
			const manifestPath = path.join( incDir, dir, 'manifest.json' );
			let version = 'unknown';
			let origin = 'Core/Bundled';
			let slug = dir;

			if ( await fs.pathExists( manifestPath ) ) {
				try {
					const manifest = await fs.readJson( manifestPath );
					version = manifest.version || version;
					slug = manifest.slug || slug;
					if ( manifest.php_url ) {
						origin = 'Registry';
					}
				} catch ( e ) {
					// Silent fail for manifest reading
				}
			}

			componentList.push( {
				slug,
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
	} );

program
	.command( 'search [keyword]' )
	.description( 'Search for components in the registry' )
	.action( async ( keyword ) => {
		const options = program.opts();
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
	} );

async function downloadComponent( slug, options = {} ) {
	const auth = await getAuth( options );
	const isUpdate = options.isUpdate || false;
	const actionText = isUpdate ? 'Updating' : 'Adding';
	const processedSlugs = options.processedSlugs || new Set();

	if ( processedSlugs.has( slug ) ) {
		return;
	}
	processedSlugs.add( slug );

	const isGitHubSource = auth.githubOwner && auth.githubRepo;
	const sourceText = isGitHubSource
		? `GitHub (${ auth.githubOwner }/${ auth.githubRepo })`
		: auth.url;

	logger.info(
		`${ actionText } component "${ slug }" from ${ sourceText }...`
	);

	try {
		// Basic slug validation to prevent directory traversal
		if (
			slug.includes( '..' ) ||
			slug.includes( '/' ) ||
			slug.includes( '\\' )
		) {
			throw new Error( `Invalid component slug: ${ slug }` );
		}

		let component = null;

		if ( isGitHubSource ) {
			const branch = auth.githubBranch || 'main';
			const cacheBust = `?t=${ Date.now() }`;
			const rawUrl = `https://raw.githubusercontent.com/${ auth.githubOwner }/${ auth.githubRepo }/${ branch }/${ slug }/manifest.json${ cacheBust }`;

			const manifestRes = await fetch( rawUrl );
			if ( ! manifestRes.ok ) {
				throw new Error(
					`Component "${ slug }" manifest not found on GitHub.`
				);
			}

			component = await manifestRes.json();
			component.slug = component.slug || slug;

			// Construct source URLs for GitHub components
			const baseUrl = `https://raw.githubusercontent.com/${ auth.githubOwner }/${ auth.githubRepo }/${ branch }/${ slug }`;
			component.php_url = `${ baseUrl }/Component.php${ cacheBust }`;
			component.spec_url = `${ baseUrl }/SPEC.md${ cacheBust }`;
			component.skill_url = `${ baseUrl }/SKILL.md${ cacheBust }`;
		} else {
			const response = await fetch(
				`${ auth.url }/wp-json/wprig/v1/registry/components/${ slug }${
					options.force ? '?force=1' : ''
				}`,
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

			component = await response.json();
		}

		// Recursive dependency resolution
		if (
			component.dependencies &&
			Array.isArray( component.dependencies )
		) {
			logger.info(
				`Component "${ slug }" requires: ${ component.dependencies.join(
					', '
				) }`
			);
			for ( const dep of component.dependencies ) {
				await downloadComponent( dep, { ...options, processedSlugs } );
			}
		}

		const rawSlug = component.slug || slug;

		/**
		 * Helper to write a file with a diff check.
		 */
		const writeFileWithCheck = async ( filePath, content, fileName ) => {
			if ( await fs.pathExists( filePath ) ) {
				const existingContent = await fs.readFile( filePath, 'utf8' );
				if ( existingContent !== content ) {
					if ( options.yes ) {
						logger.warn(
							`Overwriting ${ fileName } (changes detected, --yes used)`
						);
					} else {
						const { confirm } = await inquirer.prompt( [
							{
								type: 'confirm',
								name: 'confirm',
								message: `File ${ fileName } has local changes. Overwrite with registry version?`,
								default: false,
							},
						] );
						if ( ! confirm ) {
							logger.info( `Kept local version of ${ fileName }.` );
							return false;
						}
					}
				} else {
					// No changes, no need to write
					return false;
				}
			}
			await fs.ensureDir( path.dirname( filePath ) );
			await fs.writeFile( filePath, content );
			return true;
		};

		// Re-validate component slug from registry
		if (
			rawSlug.includes( '..' ) ||
			rawSlug.includes( '/' ) ||
			rawSlug.includes( '\\' )
		) {
			throw new Error(
				`Invalid component slug in manifest: ${ rawSlug }`
			);
		}

		const componentSlug = toPascalCase( rawSlug );
		const componentDir = path.join( themeRoot, 'inc', componentSlug );

		if ( isUpdate && ( await fs.pathExists( componentDir ) ) ) {
			const localManifestPath = path.join(
				componentDir,
				'manifest.json'
			);
			if ( await fs.pathExists( localManifestPath ) ) {
				const localManifest = await fs.readJson( localManifestPath );
				if (
					localManifest.version &&
					component.version &&
					localManifest.version === component.version
				) {
					logger.warn(
						`Component "${ componentSlug }" is already at version ${ component.version }.`
					);
					const { force } = await inquirer.prompt( [
						{
							type: 'confirm',
							name: 'force',
							message: 'Re-download anyway?',
							default: false,
						},
					] );
					if ( ! options.yes && ! force ) {
						return;
					}
				} else if (
					component.version &&
					localManifest.version > component.version
				) {
					logger.warn(
						`Local version (${ localManifest.version }) of "${ componentSlug }" is newer than registry version (${ component.version }).`
					);
					const { force } = await inquirer.prompt( [
						{
							type: 'confirm',
							name: 'force',
							message: 'Downgrade?',
							default: false,
						},
					] );
					if ( ! options.yes && ! force ) {
						return;
					}
				}
			}
		}

		if ( ! isUpdate && ( await fs.pathExists( componentDir ) ) ) {
			if ( options.yes ) {
				logger.warn(
					`Component "${ componentSlug }" already exists. Overwriting (--yes)...`
				);
			} else {
				const { confirm } = await inquirer.prompt( [
					{
						type: 'confirm',
						name: 'confirm',
						message: `Component "${ componentSlug }" already exists. Overwrite?`,
						default: false,
					},
				] );
				if ( ! confirm ) {
					return;
				}
			}
		}

		await fs.ensureDir( componentDir );

		// Fetch and save required files
		const filesToFetch = {
			'Component.php': component.php_url,
			'SPEC.md': component.spec_url,
			'SKILL.md': component.skill_url,
		};

		// Add additional files from manifest if present
		if ( component.files ) {
			for ( const [ fileName, fileUrl ] of Object.entries(
				component.files
			) ) {
				filesToFetch[ fileName ] = fileUrl;
			}
		}

		// Save manifest.json (already fetched)
		await fs.writeJson(
			path.join( componentDir, 'manifest.json' ),
			component,
			{ spaces: 2 }
		);

		// Process assets from component metadata
		if ( component.asset_mapping ) {
			for ( const type in component.asset_mapping ) {
				const asset = component.asset_mapping[ type ];
				if ( asset.src ) {
					// Attempt to fetch the asset.
					const assetUrl =
						( component.asset_urls &&
							component.asset_urls[ type ] ) ||
						component.php_url.replace( 'Component.php', asset.src );

					try {
						const assetRes = await fetch( assetUrl );
						if ( assetRes.ok ) {
							const assetContent = await assetRes.text();
							const destPath = path.resolve(
								themeRoot,
								getAssetPath( asset.src )
							);

							// Security check: Ensure destPath is within themeRoot
							if ( ! destPath.startsWith( themeRoot ) ) {
								throw new Error(
									`Security Alert: Malicious asset path detected: ${ asset.src }`
								);
							}

							const saved = await writeFileWithCheck(
								destPath,
								assetContent,
								asset.src
							);
							if ( saved ) {
								logger.success(
									`Downloaded asset to ${ getAssetPath(
										asset.src
									) }`
								);
							}
						} else {
							logger.warn(
								`✗ Failed to fetch asset ${ asset.src } from ${ assetUrl }: ${ assetRes.status } ${ assetRes.statusText }`
							);
						}
					} catch ( assetError ) {
						logger.warn(
							`Error fetching asset ${ asset.src }: ${ assetError.message }`
						);
					}
				}
			}
		}

		for ( const [ fileName, url ] of Object.entries( filesToFetch ) ) {
			if ( ! url ) {
				continue;
			}
			try {
				logger.debug( `Fetching ${ fileName } from ${ url }...` );
				const res = await fetch( url );
				if ( res.ok ) {
					let content;
					if ( fileName === 'manifest.json' ) {
						const json = await res.json();
						content = JSON.stringify( json, null, 2 );
					} else {
						content = await res.text();
					}

					const filePath = path.join( componentDir, fileName );
					const saved = await writeFileWithCheck(
						filePath,
						content,
						fileName
					);
					if ( saved ) {
						logger.success( `✓ Saved ${ fileName }` );
					}
				} else {
					logger.warn(
						`✗ Failed to fetch ${ fileName }: ${ res.status } ${ res.statusText }`
					);
				}
			} catch ( error ) {
				logger.error(
					`Error fetching ${ fileName }: ${ error.message }`
				);
			}
		}

		// External Dependencies Handling
		if ( component.npm_dependencies ) {
			const deps = Array.isArray( component.npm_dependencies )
				? component.npm_dependencies
				: Object.keys( component.npm_dependencies );
			if ( deps.length > 0 ) {
				logger.info(
					`Installing npm dependencies: ${ deps.join( ', ' ) }`
				);
				try {
					execSync( `npm install ${ deps.join( ' ' ) } --save-dev`, {
						stdio: 'inherit',
						cwd: themeRoot,
					} );
				} catch ( e ) {
					logger.error(
						`Failed to install npm dependencies: ${ e.message }`
					);
				}
			}
		}

		if ( component.composer_dependencies ) {
			const deps = Array.isArray( component.composer_dependencies )
				? component.composer_dependencies
				: Object.keys( component.composer_dependencies );
			if ( deps.length > 0 ) {
				logger.info(
					`Installing composer dependencies: ${ deps.join( ', ' ) }`
				);
				try {
					execSync( `composer require ${ deps.join( ' ' ) }`, {
						stdio: 'inherit',
						cwd: themeRoot,
					} );
				} catch ( e ) {
					logger.error(
						`Failed to install composer dependencies: ${ e.message }`
					);
				}
			}
		}

		// AI Protocol Symlinking
		const aiSkillsDir = path.join( themeRoot, '.ai', 'skills', rawSlug );
		await fs.ensureDir( aiSkillsDir );
		for ( const file of [ 'SPEC.md', 'SKILL.md' ] ) {
			const srcPath = path.join( componentDir, file );
			const destPath = path.join( aiSkillsDir, file );
			if ( await fs.pathExists( srcPath ) ) {
				try {
					// Use relative symlink if possible
					const relativeSrc = path.relative(
						path.dirname( destPath ),
						srcPath
					);
					if ( await fs.pathExists( destPath ) ) {
						const isSymlink = (
							await fs.lstat( destPath )
						 ).isSymbolicLink();
						if ( isSymlink ) {
							await fs.unlink( destPath );
						} else {
							await fs.remove( destPath );
						}
					}
					await fs.symlink( relativeSrc, destPath );
					logger.success(
						`Symlinked ${ file } to .ai/skills/${ rawSlug }/`
					);
				} catch ( e ) {
					// Fallback to copy if symlink fails
					await fs.copy( srcPath, destPath );
					logger.warn(
						`Copied ${ file } to .ai/skills/${ rawSlug }/ (symlink failed)`
					);
				}
			}
		}

		// Registry Manifest Synchronization
		const registryManifestPath = path.join(
			themeRoot,
			'inc',
			'components-manifest.json'
		);
		if ( await fs.pathExists( registryManifestPath ) ) {
			try {
				const registryManifest = await fs.readJson(
					registryManifestPath
				);
				registryManifest[
					componentSlug
				] = `inc/${ componentSlug }/Component.php`;
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

		logger.success( `Component "${ slug }" added successfully!` );
		logger.info( 'Running "npm run build" to process assets...' );
		try {
			execSync( 'npm run build', { stdio: 'inherit', cwd: themeRoot } );
			logger.success( '✓ Build completed successfully!' );
		} catch ( buildError ) {
			logger.error( `Build failed: ${ buildError.message }` );
			logger.warn(
				'Note: You may need to run "npm run build" manually.'
			);
		}
	} catch ( error ) {
		logger.error( `Download failed: ${ error.message }` );
	}
}

program
	.command( 'add <slug>' )
	.description( 'Add a component from the registry' )
	.action( async ( slug ) => {
		await downloadComponent( slug, program.opts() );
	} );

program
	.command( 'update <slug>' )
	.description( 'Update a component from the registry' )
	.action( async ( slug ) => {
		await downloadComponent( slug, { ...program.opts(), isUpdate: true } );
	} );

/**
 * Gets a map of component dependencies.
 * Key: component slug, Value: Array of component slugs that depend on it.
 *
 * @return {Promise<Object>} Dependency map
 */
async function getDependentsMap() {
	const incDir = path.join( themeRoot, 'inc' );
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

program
	.command( 'remove <slug>' )
	.description( 'Remove a component and its assets' )
	.action( async ( slug ) => {
		const normalizedSlug = toPascalCase( slug );
		const dependentsMap = await getDependentsMap();
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

		// Try to read manifest for asset cleanup (before removing folder)
		const manifestPath = path.join( targetDir, 'manifest.json' );
		if ( await fs.pathExists( manifestPath ) ) {
			try {
				const manifest = await fs.readJson( manifestPath );
				if ( manifest.asset_mapping ) {
					for ( const type in manifest.asset_mapping ) {
						const asset = manifest.asset_mapping[ type ];
						if ( asset.src ) {
							const mappedSrc = getAssetPath( asset.src );
							const assetPath = path.resolve(
								themeRoot,
								mappedSrc
							);
							if ( await fs.pathExists( assetPath ) ) {
								await fs.remove( assetPath );
								logger.warn( `Removed asset: ${ mappedSrc }` );

								// Also remove .min files in the root folder if they exist
								if (
									mappedSrc.includes( '/src/' ) &&
									( mappedSrc.endsWith( '.css' ) ||
										mappedSrc.endsWith( '.js' ) ||
										mappedSrc.endsWith( '.ts' ) )
								) {
									const minFileName = path
										.basename( mappedSrc )
										.replace( /\.(css|js|ts)$/, '.min.$1' )
										.replace( '.min.ts', '.min.js' ); // TS compiles to JS

									const minAssetPath = path.resolve(
										themeRoot,
										path.dirname(
											path.dirname( mappedSrc )
										),
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
							}
						}
					}
				}
			} catch ( e ) {
				logger.warn(
					'Could not parse manifest.json for asset cleanup.'
				);
			}
		}

		await fs.remove( targetDir );
		logger.success(
			`Component folder "${ path.relative(
				path.join( themeRoot, 'inc' ),
				targetDir
			) }" removed.`
		);

		logger.info( 'Running "npm run build" to clean up assets...' );
		try {
			execSync( 'npm run build', { stdio: 'inherit', cwd: themeRoot } );
			logger.success( '✓ Build completed successfully!' );
		} catch ( buildError ) {
			logger.error( `Build failed: ${ buildError.message }` );
		}

		// Update registry manifest
		const registryManifestPath = path.join(
			themeRoot,
			'inc',
			'components-manifest.json'
		);
		if ( await fs.pathExists( registryManifestPath ) ) {
			const registryManifest = await fs.readJson( registryManifestPath );
			let updated = false;
			if ( registryManifest[ normalizedSlug ] ) {
				delete registryManifest[ normalizedSlug ];
				updated = true;
			}
			if ( registryManifest[ slug ] ) {
				delete registryManifest[ slug ];
				updated = true;
			}

			if ( updated ) {
				await fs.writeJson( registryManifestPath, registryManifest, {
					spaces: 2,
				} );
				logger.success( 'Updated components-manifest.json.' );
			}
		}
	} );

program
	.command( 'prepare <slug>' )
	.description(
		'Prepare a component for submission by packaging it into a folder.'
	)
	.action( async ( slug ) => {
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
			const distDir = path.join(
				themeRoot,
				'dist',
				'components',
				realSlug
			);
			await fs.ensureDir( distDir );
			// Clear existing directory to avoid old files remaining
			await fs.emptyDir( distDir );

			const manifestPath = path.join( componentDir, 'manifest.json' );
			if ( ! ( await fs.pathExists( manifestPath ) ) ) {
				throw new Error(
					`manifest.json not found in ${ componentDir }`
				);
			}
			const manifest = await fs.readJson( manifestPath );

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

			// Add assets from manifest
			if ( manifest.asset_mapping ) {
				for ( const type in manifest.asset_mapping ) {
					const asset = manifest.asset_mapping[ type ];
					if ( asset.src ) {
						const assetPath = path.resolve(
							themeRoot,
							getAssetPath( asset.src )
						);
						if ( await fs.pathExists( assetPath ) ) {
							const destAssetPath = path.join(
								distDir,
								asset.src
							);
							await fs.ensureDir( path.dirname( destAssetPath ) );
							await fs.copy( assetPath, destAssetPath );
						}
					}
				}
			}

			// Add any other files from manifest.files if they are local paths
			if ( manifest.files ) {
				for ( const [ fileName, fileUrl ] of Object.entries(
					manifest.files
				) ) {
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

			logger.success(
				`Component "${ realSlug }" prepared successfully in ${ path.relative(
					themeRoot,
					distDir
				) }`
			);

			// Manual instructions
			logger.log(
				'\n' + c.blue.bold( 'NEXT STEPS TO SUBMIT TO THE REGISTRY:' )
			);
			logger.log(
				'1. Fork the component registry repository: ' +
					c.cyan( 'https://github.com/wprig/wprig-components' )
			);
			logger.log( '2. Clone your fork locally and create a new branch:' );
			logger.log(
				c.gray(
					`   git clone https://github.com/YOUR_USERNAME/wprig-components.git`
				)
			);
			logger.log( c.gray( `   cd wprig-components` ) );
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
			logger.log(
				c.gray( `   git commit -m "Add ${ realSlug } component"` )
			);
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
		} catch ( error ) {
			logger.error( `Preparation failed: ${ error.message }` );
		}
	} );

program
	.command( 'test-component [slug]' )
	.description( 'Validate a component for registry readiness' )
	.action( async ( slug ) => {
		let componentSlug = slug;
		if ( ! componentSlug ) {
			const answers = await inquirer.prompt( [
				{
					type: 'input',
					name: 'slug',
					message: 'Enter the component slug (folder name in inc/):',
					validate: ( input ) =>
						input ? true : 'Slug is required',
				},
			] );
			componentSlug = answers.slug;
		}

		const normalizedSlug = toPascalCase( componentSlug );
		if (
			await fs.pathExists( path.join( themeRoot, 'inc', normalizedSlug ) )
		) {
			await testComponent( themeRoot, normalizedSlug );
		} else {
			await testComponent( themeRoot, componentSlug );
		}
	} );

program
	.command( 'check [slug]' )
	.description( 'Validate local component structure and manifest' )
	.action( async ( slug ) => {
		const incDir = path.join( themeRoot, 'inc' );
		let directories = [];

		if ( slug ) {
			const normalizedSlug = toPascalCase( slug );
			if ( await fs.pathExists( path.join( incDir, normalizedSlug ) ) ) {
				directories.push( normalizedSlug );
			} else if ( await fs.pathExists( path.join( incDir, slug ) ) ) {
				directories.push( slug );
			} else {
				logger.error( `Component "${ slug }" not found in inc/` );
				return;
			}
		} else {
			directories = (
				await fs.readdir( incDir, { withFileTypes: true } )
			)
				.filter( ( dirent ) => dirent.isDirectory() )
				.map( ( dirent ) => dirent.name );
		}

		logger.info( `Checking ${ directories.length } component(s)...` );

		let totalErrors = 0;
		for ( const dir of directories ) {
			const success = await testComponent( themeRoot, dir );
			if ( ! success ) {
				totalErrors++;
			}
		}

		if ( totalErrors === 0 ) {
			logger.success( '\n✓ All components passed validation.' );
		} else {
			logger.error(
				`\n✗ ${ totalErrors } component(s) failed validation.`
			);
		}
	} );

program.parse();
