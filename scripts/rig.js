#!/usr/bin/env node
/**
 * WP Rig Component Registry CLI
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import c from 'ansi-colors';
import testComponent from './tasks/testComponent.js';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const themeRoot = path.resolve( __dirname, '..' );

const program = new Command();

program
	.name( 'rig' )
	.description( 'WP Rig Component Registry CLI' )
	.version( '1.0.0' )
	.option( '-r, --registry <name>', 'Registry to use', 'default' )
	.option( '-y, --yes', 'Automatically answer "yes" to all prompts', false );

program
	.command( 'login' )
	.description( 'Login to a WP Rig Component Registry' )
	.option( '--name <name>', 'Name of the registry to save', 'default' )
	.action( async ( options ) => {
		const name = options.name;
		const answers = await inquirer.prompt( [
			{
				type: 'input',
				name: 'url',
				message: `Enter the Registry URL for "${ name }" (e.g., https://wprig.io):`,
				default: name === 'default' ? 'https://wprig.io' : '',
			},
			{
				type: 'confirm',
				name: 'isGitHub',
				message: 'Is this a GitHub-backed registry?',
				default: name === 'default',
			},
			{
				type: 'input',
				name: 'githubOwner',
				message: 'Enter GitHub Owner:',
				when: ( a ) => a.isGitHub,
				default: name === 'default' ? 'wprig' : '',
			},
			{
				type: 'input',
				name: 'githubRepo',
				message: 'Enter GitHub Repository:',
				when: ( a ) => a.isGitHub,
				default: name === 'default' ? 'wprig-components' : '',
			},
			{
				type: 'input',
				name: 'githubBranch',
				message: 'Enter GitHub Branch (optional):',
				when: ( a ) => a.isGitHub,
				default: 'main',
			},
			{
				type: 'input',
				name: 'username',
				message: 'Enter your Username:',
			},
			{
				type: 'input',
				name: 'token',
				message: 'Enter your Application Password:',
			},
		] );

		const authDir = path.join(
			process.env.HOME || process.env.USERPROFILE,
			'.wprig'
		);
		const authFile = path.join( authDir, 'auth.json' );
		await fs.ensureDir( authDir );

		let authData = {};
		if ( await fs.pathExists( authFile ) ) {
			const existing = await fs.readJson( authFile );
			// Handle legacy format migration
			if ( existing.url && ! existing.registries ) {
				authData = {
					current: 'default',
					registries: {
						default: existing,
					},
				};
			} else {
				authData = existing;
			}
		} else {
			authData = {
				current: 'default',
				registries: {},
			};
		}

		authData.registries[ name ] = {
			url: answers.url.replace( /\/+$/, '' ),
			username: answers.username,
			token: answers.token,
		};
		if ( answers.isGitHub ) {
			authData.registries[ name ].githubOwner = answers.githubOwner;
			authData.registries[ name ].githubRepo = answers.githubRepo;
			authData.registries[ name ].githubBranch = answers.githubBranch;
		}
		authData.current = name;

		await fs.writeJson( authFile, authData, { spaces: 2 } );
		console.log(
			c.green( `Authentication for "${ name }" saved successfully!` )
		);
	} );

async function getAuth( options = {} ) {
	const authFile = path.join(
		process.env.HOME || process.env.USERPROFILE,
		'.wprig',
		'auth.json'
	);

	let authData = null;
	if ( await fs.pathExists( authFile ) ) {
		authData = await fs.readJson( authFile );
	}

	// Handle legacy format migration if it exists
	if ( authData && authData.url && ! authData.registries ) {
		authData = {
			current: 'default',
			registries: {
				default: authData,
			},
		};
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

	// If the registry is default and not configured, return public config
	if ( registryName === 'default' ) {
		return {
			url: 'https://wprig.io',
			githubOwner: 'wprig',
			githubRepo: 'wprig-components',
			githubBranch: 'main',
		};
	}

	// Registry not found and it's not default
	if ( ! authData ) {
		console.error( c.red( 'Please login first using: npm run rig:login' ) );
	} else {
		console.error(
			c.red(
				`Registry "${ registryName }" not found. Available: ${ Object.keys(
					authData.registries || {}
				).join( ', ' ) }`
			)
		);
	}
	process.exit( 1 );
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
	.command( 'registry:list' )
	.description( 'List configured registries' )
	.action( async () => {
		const authFile = path.join(
			process.env.HOME || process.env.USERPROFILE,
			'.wprig',
			'auth.json'
		);
		if ( ! ( await fs.pathExists( authFile ) ) ) {
			console.log( c.yellow( 'No registries configured.' ) );
			return;
		}
		const authData = await fs.readJson( authFile );
		const registries = authData.registries || { default: authData };
		const current = authData.current || 'default';

		console.log( c.blue( 'Configured Registries:' ) );
		Object.keys( registries ).forEach( ( name ) => {
			const active = name === current ? c.green( '*' ) : ' ';
			console.log(
				`${ active } ${ name } (${ registries[ name ].url })`
			);
		} );
	} );

program
	.command( 'registry:use <name>' )
	.description( 'Set the active registry' )
	.action( async ( name ) => {
		const authFile = path.join(
			process.env.HOME || process.env.USERPROFILE,
			'.wprig',
			'auth.json'
		);
		if ( ! ( await fs.pathExists( authFile ) ) ) {
			console.error( c.red( 'No registries configured.' ) );
			return;
		}
		const authData = await fs.readJson( authFile );
		if ( ! authData.registries || ! authData.registries[ name ] ) {
			console.error( c.red( `Registry "${ name }" not found.` ) );
			return;
		}
		authData.current = name;
		await fs.writeJson( authFile, authData, { spaces: 2 } );
		console.log( c.green( `Active registry set to "${ name }".` ) );
	} );

program
	.command( 'list' )
	.description( 'List all installed theme components' )
	.action( async () => {
		const incDir = path.join( themeRoot, 'inc' );
		const directories = ( await fs.readdir( incDir, { withFileTypes: true } ) )
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
			console.log( c.yellow( 'No components found in inc/ directory.' ) );
			return;
		}

		console.log( c.blue( 'Installed Theme Components:' ) );
		console.table(
			componentList.sort( ( a, b ) => a.slug.localeCompare( b.slug ) )
		);
	} );

program
	.command( 'search [keyword]' )
	.description( 'Search for components in the registry' )
	.action( async ( keyword ) => {
		const auth = await getAuth( program.opts() );
		console.log(
			c.blue(
				`Searching for components matching "${ keyword || '' }" at ${
					auth.url
				}...`
			)
		);

		try {
			const response = await fetch(
				`${ auth.url }/wp-json/wprig-registry/v1/search?q=${
					keyword || ''
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

			const results = await response.json();
			if ( results.length === 0 ) {
				console.log( c.yellow( 'No components found.' ) );
				return;
			}

			console.table(
				results.map( ( r ) => ( {
					slug: r.slug,
					name: r.name,
					version: r.version,
					performance: r.performance,
					agentReady: r.agentReady,
				} ) )
			);
		} catch ( error ) {
			console.error( c.red( `Search failed: ${ error.message }` ) );
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

	console.log(
		c.blue( `${ actionText } component "${ slug }" from ${ sourceText }...` )
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
			const rawUrl = `https://raw.githubusercontent.com/${ auth.githubOwner }/${ auth.githubRepo }/${ branch }/${ slug }/manifest.json`;

			const manifestRes = await fetch( rawUrl );
			if ( ! manifestRes.ok ) {
				throw new Error(
					`Component "${ slug }" manifest not found on GitHub.`
				);
			}

			component = await manifestRes.json();
			component.slug = component.slug || slug;

			// Construct source URLs for GitHub components
			const baseUrl = `https://raw.githubusercontent.com/${ auth.githubOwner }/${ auth.githubRepo }/${ branch }/${ component.slug }`;
			component.php_url = component.php_url || `${ baseUrl }/Component.php`;
			component.spec_url =
				component.spec_url || `${ baseUrl }/SPEC.md`;
			component.skill_url =
				component.skill_url || `${ baseUrl }/SKILL.md`;
		} else {
			const response = await fetch(
				`${ auth.url }/wp-json/wprig-registry/v1/components/${ slug }`,
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

		const rawSlug = component.slug || slug;

		// Re-validate component slug from registry
		if (
			rawSlug.includes( '..' ) ||
			rawSlug.includes( '/' ) ||
			rawSlug.includes( '\\' )
		) {
			throw new Error( `Invalid component slug in manifest: ${ rawSlug }` );
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
					console.log(
						c.yellow(
							`Component "${ componentSlug }" is already at version ${ component.version }.`
						)
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
					console.warn(
						c.red(
							`Local version (${ localManifest.version }) of "${ componentSlug }" is newer than registry version (${ component.version }).`
						)
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
				console.log(
					c.yellow(
						`Component "${ componentSlug }" already exists. Overwriting (--yes)...`
					)
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
			for ( const [ fileName, fileUrl ] of Object.entries( component.files ) ) {
				filesToFetch[ fileName ] = fileUrl;
			}
		}

		// Save manifest.json (already fetched)
		await fs.writeJson( path.join( componentDir, 'manifest.json' ), component, { spaces: 2 } );

		// Process assets from component metadata
		if ( component.asset_mapping ) {
			for ( const type in component.asset_mapping ) {
				const asset = component.asset_mapping[ type ];
				if ( asset.src ) {
					// Attempt to fetch the asset.
					const assetUrl =
						( component.asset_urls &&
							component.asset_urls[ type ] ) ||
						component.php_url.replace(
							'Component.php',
							asset.src
						);

					try {
						const assetRes = await fetch( assetUrl );
						if ( assetRes.ok ) {
							const assetContent = await assetRes.text();
							const destPath = path.resolve(
								themeRoot,
								asset.src
							);

							// Security check: Ensure destPath is within themeRoot
							if ( ! destPath.startsWith( themeRoot ) ) {
								throw new Error(
									`Security Alert: Malicious asset path detected: ${ asset.src }`
								);
							}
							await fs.ensureDir(
								path.dirname( destPath )
							);
							await fs.writeFile(
								destPath,
								assetContent
							);
							console.log(
								c.green(
									`Downloaded asset to ${ asset.src }`
								)
							);
						}
					} catch ( assetError ) {
						console.warn(
							c.yellow(
								`Error fetching asset ${ asset.src }: ${ assetError.message }`
							)
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
				const res = await fetch( url );
				if ( res.ok ) {
					let content;
					if ( fileName === 'manifest.json' ) {
						const json = await res.json();
						content = JSON.stringify( json, null, 2 );
					} else {
						content = await res.text();
					}
					await fs.writeFile(
						path.join( componentDir, fileName ),
						content
					);
				}
			} catch ( error ) {
				// Silent fail for optional files
			}
		}

		console.log( c.green( `Component "${ slug }" added successfully!` ) );
		console.log(
			c.yellow( 'Note: Run "npm run build" to process any new assets.' )
		);
	} catch ( error ) {
		console.error( c.red( `Download failed: ${ error.message }` ) );
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
			console.error(
				c.red(
					`Cannot remove component "${ normalizedSlug }". It is a dependency for: ${ dependents.join(
						', '
					) }`
				)
			);
			return;
		}

		console.log( c.blue( `Removing component "${ normalizedSlug }"...` ) );

		const componentDir = path.join( themeRoot, 'inc', normalizedSlug );
		if ( ! ( await fs.pathExists( componentDir ) ) ) {
			// Fallback: check if the original slug directory exists
			const fallbackDir = path.join( themeRoot, 'inc', slug );
			if ( ! ( await fs.pathExists( fallbackDir ) ) ) {
				console.error( c.red( `Component folder not found in inc/ for "${ normalizedSlug }" or "${ slug }"` ) );
				return;
			}
			// Use fallback
			await fs.remove( fallbackDir );
			console.log( c.green( `Component folder "inc/${ slug }" removed.` ) );
		} else {
			// Try to read manifest for asset cleanup (before removing folder)
			const manifestPath = path.join( componentDir, 'manifest.json' );
			if ( await fs.pathExists( manifestPath ) ) {
				try {
					const manifest = await fs.readJson( manifestPath );
					if ( manifest.asset_mapping ) {
						for ( const type in manifest.asset_mapping ) {
							const asset = manifest.asset_mapping[ type ];
							if ( asset.src ) {
								const assetPath = path.join( themeRoot, asset.src );
								if ( await fs.pathExists( assetPath ) ) {
									await fs.remove( assetPath );
									console.log( c.yellow( `Removed asset: ${ asset.src }` ) );
								}
							}
						}
					}
				} catch ( e ) {
					console.warn( c.yellow( `Could not parse manifest.json for asset cleanup.` ) );
				}
			}

			await fs.remove( componentDir );
			console.log( c.green( `Component folder "inc/${ normalizedSlug }" removed.` ) );
		}

		// Update registry manifest
		const registryManifestPath = path.join( themeRoot, 'inc', 'components-manifest.json' );
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
				await fs.writeJson( registryManifestPath, registryManifest, { spaces: 2 } );
				console.log( c.green( `Updated components-manifest.json.` ) );
			}
		}
	} );

program
	.command( 'submit <slug>' )
	.description( 'Submit a component to the registry' )
	.action( async ( slug ) => {
		const auth = await getAuth( program.opts() );

		if ( ! auth.username || ! auth.token ) {
			console.error(
				c.red( 'Authentication is required to submit components.' )
			);
			process.exit( 1 );
		}
		const normalizedSlug = toPascalCase( slug );
		console.log(
			c.blue( `Submitting component "${ normalizedSlug }" to ${ auth.url }...` )
		);

		let realSlug = normalizedSlug;
		let componentDir = path.join( themeRoot, 'inc', normalizedSlug );

		if ( ! ( await fs.pathExists( componentDir ) ) ) {
			// Fallback: check if the original slug directory exists
			const fallbackDir = path.join( themeRoot, 'inc', slug );
			if ( ! ( await fs.pathExists( fallbackDir ) ) ) {
				console.error( c.red( `Component folder not found in inc/ for "${ normalizedSlug }" or "${ slug }"` ) );
				return;
			}
			realSlug = slug;
			componentDir = fallbackDir;
		}

		// Pre-flight check
		try {
			await testComponent( themeRoot, realSlug );
		} catch ( e ) {
			console.error( c.red( `Validation failed: ${ e.message }` ) );
			return;
		}

		try {
			const files = {};
			const fileNames = [
				'Component.php',
				'manifest.json',
				'SPEC.md',
				'SKILL.md',
			];

			for ( const name of fileNames ) {
				const filePath = path.join( componentDir, name );
				if ( await fs.pathExists( filePath ) ) {
					files[ name ] = await fs.readFile( filePath, 'utf8' );
				}
			}

			const response = await fetch(
				`${ auth.url }/wp-json/wprig-registry/v1/submit`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Basic ${ Buffer.from(
							`${ auth.username }:${ auth.token }`
						).toString( 'base64' ) }`,
					},
					body: JSON.stringify( {
						slug: realSlug,
						files,
					} ),
				}
			);

			if ( ! response.ok ) {
				const error = await response.json();
				throw new Error(
					error.message || `HTTP Error: ${ response.status }`
				);
			}

			console.log(
				c.green( `Component "${ slug }" submitted successfully!` )
			);
		} catch ( error ) {
			console.error( c.red( `Submission failed: ${ error.message }` ) );
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
		if ( await fs.pathExists( path.join( themeRoot, 'inc', normalizedSlug ) ) ) {
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
				console.error( c.red( `Component "${ slug }" not found in inc/` ) );
				return;
			}
		} else {
			directories = ( await fs.readdir( incDir, { withFileTypes: true } ) )
				.filter( ( dirent ) => dirent.isDirectory() )
				.map( ( dirent ) => dirent.name );
		}

		console.log( c.blue( `Checking ${ directories.length } component(s)...` ) );

		for ( const dir of directories ) {
			const componentDir = path.join( incDir, dir );
			const manifestPath = path.join( componentDir, 'manifest.json' );
			const phpPath = path.join( componentDir, 'Component.php' );
			let errors = [];
			let warnings = [];

			console.log( c.cyan( `\n--- [ ${ dir } ] ---` ) );

			// Check Component.php
			if ( ! ( await fs.pathExists( phpPath ) ) ) {
				errors.push( 'Missing Component.php' );
			} else {
				const phpContent = await fs.readFile( phpPath, 'utf8' );
				const namespaceMatch = phpContent.match( /namespace\s+WP_Rig\\WP_Rig\\([^;]+);/ );
				if ( namespaceMatch ) {
					const ns = namespaceMatch[ 1 ].trim();
					const expectedNs = toPascalCase( dir );
					if ( ns !== expectedNs ) {
						warnings.push( `Namespace mismatch: expected "WP_Rig\\WP_Rig\\${ expectedNs }", found "WP_Rig\\WP_Rig\\${ ns }"` );
					}
				} else {
					errors.push( 'Could not find namespace in Component.php' );
				}

				if ( ! phpContent.includes( 'implements Component_Interface' ) ) {
					errors.push( 'Component class does not implement Component_Interface' );
				}
			}

			// Check manifest.json
			if ( ! ( await fs.pathExists( manifestPath ) ) ) {
				warnings.push( 'Missing manifest.json' );
			} else {
				try {
					const manifest = await fs.readJson( manifestPath );
					if ( ! manifest.slug ) {
						warnings.push( 'Manifest is missing "slug" field' );
					}
					if ( ! manifest.version ) {
						warnings.push( 'Manifest is missing "version" field' );
					}
					if ( manifest.asset_mapping ) {
						for ( const type in manifest.asset_mapping ) {
							const asset = manifest.asset_mapping[ type ];
							if ( asset.src ) {
								const assetPath = path.join( themeRoot, asset.src );
								if ( ! ( await fs.pathExists( assetPath ) ) ) {
									warnings.push( `Asset not found: ${ asset.src }` );
								}
							}
						}
					}
				} catch ( e ) {
					errors.push( `Invalid manifest.json: ${ e.message }` );
				}
			}

			if ( errors.length === 0 && warnings.length === 0 ) {
				console.log( c.green( '✓ All checks passed' ) );
			} else {
				errors.forEach( ( e ) => console.log( c.red( `  [ERROR] ${ e }` ) ) );
				warnings.forEach( ( w ) => console.log( c.yellow( `  [WARN ] ${ w }` ) ) );
			}
		}
	} );

program.parse();
