/**
 * Task: Download Component from Registry
 */

import fs from 'fs-extra';
import path from 'path';
import { spawnSync } from 'child_process';
import inquirer from 'inquirer';
import { getAuth } from '../lib/auth.js';
import { fetchRegistry } from '../lib/registry.js';
import {
	logger,
	toPascalCase,
	updateRegistryManifest,
} from '../lib/rig-utils.js';
import { getAssetPath } from '../lib/utils.js';

/**
 * Main entry point for downloading or updating a component.
 *
 * @param {string} slug      Component slug
 * @param {string} themeRoot Theme root path
 * @param {Object} options   CLI options
 */
export default async function downloadComponent(
	slug,
	themeRoot,
	options = {}
) {
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
		validateSlug( slug );

		const component = await fetchComponentData( slug, auth, options );

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
				await downloadComponent( dep, themeRoot, {
					...options,
					processedSlugs,
				} );
			}
		}

		const rawSlug = component.slug || slug;
		validateSlug( rawSlug, 'manifest' );

		const componentSlug = toPascalCase( rawSlug );
		const componentDir = path.join( themeRoot, 'inc', componentSlug );

		const shouldProceed = await handleExistingComponent(
			componentSlug,
			componentDir,
			component,
			isUpdate,
			options
		);

		if ( ! shouldProceed ) {
			return;
		}

		await fs.ensureDir( componentDir );

		// Save manifest.json
		await fs.writeJson(
			path.join( componentDir, 'manifest.json' ),
			component,
			{ spaces: 2 }
		);

		await processAssets( component, themeRoot, componentDir, options );
		await saveComponentFiles( component, componentDir, options );
		await installDependencies( component, themeRoot );
		await setupAiSkills( rawSlug, componentDir, themeRoot );

		await updateRegistryManifest(
			themeRoot,
			componentSlug,
			`inc/${ componentSlug }/Component.php`
		);

		logger.success( `Component "${ slug }" added successfully!` );
		await runBuild( themeRoot );
	} catch ( error ) {
		logger.error( `Download failed: ${ error.message }` );
	}
}

/**
 * Validates a component slug.
 *
 * @param {string} slug   Slug to validate
 * @param {string} source Source of the slug (default: 'CLI')
 */
function validateSlug( slug, source = 'CLI' ) {
	if (
		slug.includes( '..' ) ||
		slug.includes( '/' ) ||
		slug.includes( '\\' )
	) {
		const message =
			source === 'manifest'
				? `Invalid component slug in manifest: ${ slug }`
				: `Invalid component slug: ${ slug }`;
		throw new Error( message );
	}
}

/**
 * Fetches component data from GitHub or Registry.
 *
 * @param {string} slug    Component slug
 * @param {Object} auth    Auth data
 * @param {Object} options CLI options
 * @return {Promise<Object>} Component data
 */
async function fetchComponentData( slug, auth, options ) {
	const isGitHubSource = auth.githubOwner && auth.githubRepo;

	if ( isGitHubSource ) {
		const branch = auth.githubBranch || 'main';
		const cacheBust = `?t=${ Date.now() }`;

		// Try to resolve the slug to a path using the registry
		let componentPath = slug;
		const registry = await fetchRegistry( auth );
		const registryItem = registry.find( ( r ) => r.slug === slug );
		if ( registryItem && registryItem.path ) {
			componentPath = registryItem.path;
		}

		const baseUrl = `https://raw.githubusercontent.com/${ auth.githubOwner }/${ auth.githubRepo }/${ branch }/${ componentPath }`;
		const rawUrl = `${ baseUrl }/manifest.json${ cacheBust }`;

		const manifestRes = await fetch( rawUrl );
		if ( ! manifestRes.ok ) {
			throw new Error(
				`Component "${ slug }" manifest not found on GitHub at ${ componentPath }.`
			);
		}

		const component = await manifestRes.json();
		component.slug = component.slug || slug;

		// Construct source URLs for GitHub components
		component.php_url = `${ baseUrl }/Component.php${ cacheBust }`;
		component.spec_url = `${ baseUrl }/SPEC.md${ cacheBust }`;
		component.skill_url = `${ baseUrl }/SKILL.md${ cacheBust }`;

		return component;
	}

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

	return await response.json();
}

/**
 * Handles existing component directory and version checks.
 *
 * @param {string}  componentSlug PascalCase component slug
 * @param {string}  componentDir  Component directory path
 * @param {Object}  component     Component data from registry
 * @param {boolean} isUpdate      Whether it's an update action
 * @param {Object}  options       CLI options
 * @return {Promise<boolean>} Whether to proceed with download
 */
async function handleExistingComponent(
	componentSlug,
	componentDir,
	component,
	isUpdate,
	options
) {
	if ( ! ( await fs.pathExists( componentDir ) ) ) {
		return true;
	}

	if ( isUpdate ) {
		logger.warn(
			`UPDATING: Component "${ component.slug }" already exists at inc/${ componentSlug }.`
		);
		logger.info( 'This will overwrite ALL files in the component folder.' );
		logger.info(
			'Recommendation: To preserve your changes, consider extending this component instead of modifying it directly.'
		);

		if ( ! options.yes ) {
			const { confirm } = await inquirer.prompt( [
				{
					type: 'confirm',
					name: 'confirm',
					message: `Overwrite all files for "${ componentSlug }"?`,
					default: false,
				},
			] );
			if ( ! confirm ) {
				logger.info( `Update cancelled for "${ componentSlug }".` );
				return false;
			}
		}

		// Enable all-or-nothing overwrite
		options.forceOverwrite = true;
		await checkVersions( componentDir, component );
		return true;
	}

	if ( options.yes ) {
		logger.warn(
			`Component "${ componentSlug }" already exists. Overwriting (--yes)...`
		);
		return true;
	}

	const { confirm } = await inquirer.prompt( [
		{
			type: 'confirm',
			name: 'confirm',
			message: `Component "${ componentSlug }" already exists. Overwrite?`,
			default: false,
		},
	] );

	return confirm;
}

/**
 * Compares local and registry versions.
 *
 * @param {string} componentDir Component directory path
 * @param {Object} component    Component data from registry
 */
async function checkVersions( componentDir, component ) {
	const localManifestPath = path.join( componentDir, 'manifest.json' );
	if ( ! ( await fs.pathExists( localManifestPath ) ) ) {
		return;
	}

	try {
		const localManifest = await fs.readJson( localManifestPath );
		if (
			localManifest.version &&
			component.version &&
			localManifest.version === component.version
		) {
			logger.info(
				`Component is already at version ${ component.version }.`
			);
		} else if (
			component.version &&
			localManifest.version > component.version
		) {
			logger.warn(
				`Note: Local version (${ localManifest.version }) is newer than registry version (${ component.version }). Downgrading.`
			);
		}
	} catch ( e ) {
		// Silent fail
	}
}

/**
 * Fetches and saves all component files.
 *
 * @param {Object} component    Component data
 * @param {string} componentDir Component directory
 * @param {Object} options      CLI options
 */
async function saveComponentFiles( component, componentDir, options ) {
	const filesToFetch = {
		'Component.php': component.php_url,
		'SPEC.md': component.spec_url,
		'SKILL.md': component.skill_url,
	};

	if ( component.files ) {
		Object.assign( filesToFetch, component.files );
	}

	for ( const [ fileName, url ] of Object.entries( filesToFetch ) ) {
		if ( ! url ) {
			continue;
		}

		try {
			logger.debug( `Fetching ${ fileName } from ${ url }...` );
			const res = await fetch( url );
			if ( ! res.ok ) {
				logger.warn(
					`✗ Failed to fetch ${ fileName }: ${ res.status } ${ res.statusText }`
				);
				continue;
			}

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
				fileName,
				options
			);
			if ( saved ) {
				logger.success( `✓ Saved ${ fileName }` );
			}
		} catch ( error ) {
			logger.error( `Error fetching ${ fileName }: ${ error.message }` );
		}
	}
}

/**
 * Processes and downloads component assets.
 *
 * @param {Object} component    Component data
 * @param {string} themeRoot    Theme root path
 * @param {string} componentDir Component directory
 * @param {Object} options      CLI options
 */
async function processAssets( component, themeRoot, componentDir, options ) {
	if ( ! component.asset_mapping ) {
		return;
	}

	const resolvedThemeRoot = path.resolve( themeRoot );

	for ( const type in component.asset_mapping ) {
		const asset = component.asset_mapping[ type ];
		if ( ! asset.src ) {
			continue;
		}

		const assetUrl =
			( component.asset_urls && component.asset_urls[ type ] ) ||
			component.php_url.replace( 'Component.php', asset.src );

		try {
			const assetRes = await fetch( assetUrl );
			if ( ! assetRes.ok ) {
				logger.warn(
					`✗ Failed to fetch asset ${ asset.src } from ${ assetUrl }: ${ assetRes.status } ${ assetRes.statusText }`
				);
				continue;
			}

			const assetContent = await assetRes.text();
			const destPath = path.resolve(
				themeRoot,
				getAssetPath( asset.src )
			);

			// Security check: Ensure destPath is within themeRoot.
			const relativeDestPath = path.relative(
				resolvedThemeRoot,
				destPath
			);
			if (
				relativeDestPath.startsWith( '..' ) ||
				path.isAbsolute( relativeDestPath )
			) {
				throw new Error(
					`Security Alert: Malicious asset path detected: ${ asset.src }`
				);
			}

			const saved = await writeFileWithCheck(
				destPath,
				assetContent,
				asset.src,
				options
			);
			if ( saved ) {
				logger.success(
					`Downloaded asset to ${ getAssetPath( asset.src ) }`
				);
			}
		} catch ( assetError ) {
			logger.warn(
				`Error fetching asset ${ asset.src }: ${ assetError.message }`
			);
		}
	}
}

/**
 * Writes a file with change detection and confirmation.
 *
 * @param {string} filePath Path to write the file to
 * @param {string} content  Content to write
 * @param {string} fileName Friendly name for logging
 * @param {Object} options  CLI options
 * @return {Promise<boolean>} Whether the file was saved
 */
async function writeFileWithCheck( filePath, content, fileName, options ) {
	if ( await fs.pathExists( filePath ) ) {
		if ( options.forceOverwrite ) {
			// Proceed
		} else {
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
	}

	await fs.ensureDir( path.dirname( filePath ) );
	await fs.writeFile( filePath, content );
	return true;
}

/**
 * Installs NPM and Composer dependencies.
 *
 * @param {Object} component Component data
 * @param {string} themeRoot Theme root path
 */
async function installDependencies( component, themeRoot ) {
	// NPM Dependencies
	if ( component.npm_dependencies ) {
		const deps = Array.isArray( component.npm_dependencies )
			? component.npm_dependencies
			: Object.keys( component.npm_dependencies );

		if ( deps.length > 0 ) {
			const safeDeps = sanitizeDependencyList( deps, 'npm' );
			logger.info(
				`Installing npm dependencies: ${ safeDeps.join( ', ' ) }`
			);
			try {
				runSafeCommand(
					'npm',
					[ 'install', ...safeDeps, '--save-dev' ],
					themeRoot
				);
			} catch ( e ) {
				logger.error(
					`Failed to install npm dependencies: ${ e.message }`
				);
			}
		}
	}

	// Composer Dependencies
	if ( component.composer_dependencies ) {
		const deps = Array.isArray( component.composer_dependencies )
			? component.composer_dependencies
			: Object.keys( component.composer_dependencies );

		if ( deps.length > 0 ) {
			const safeDeps = sanitizeDependencyList( deps, 'composer' );
			logger.info(
				`Installing composer dependencies: ${ safeDeps.join( ', ' ) }`
			);
			try {
				runSafeCommand(
					'composer',
					[ 'require', ...safeDeps ],
					themeRoot
				);
			} catch ( e ) {
				logger.error(
					`Failed to install composer dependencies: ${ e.message }`
				);
			}
		}
	}

	// WP Plugin Dependencies Warning
	const wpPlugins =
		component.wp_plugins ||
		( component.dependencies && component.dependencies.wp_plugins );

	if ( wpPlugins ) {
		const plugins = Array.isArray( wpPlugins )
			? wpPlugins
			: Object.keys( wpPlugins );

		if ( plugins.length > 0 ) {
			logger.warn(
				`Attention: This component requires the following WordPress plugins: ${ plugins.join(
					', '
				) }`
			);
			logger.info( 'Please ensure they are installed and active.' );
		}
	}
}

/**
 * Validates and normalizes dependency names before passing them to child processes.
 *
 * @param {Array<string>} dependencies Raw dependency list from manifest.
 * @param {string}        source       Source package manager name for error context.
 * @return {Array<string>} Sanitized dependency list.
 */
function sanitizeDependencyList( dependencies, source ) {
	const pattern = /^[A-Za-z0-9@/._:+\-~^*]+$/;

	return dependencies.map( ( dependency ) => {
		if ( 'string' !== typeof dependency ) {
			throw new Error(
				`Invalid ${ source } dependency value: expected string, got ${ typeof dependency }`
			);
		}

		const normalizedDependency = dependency.trim();

		if (
			'' === normalizedDependency ||
			! pattern.test( normalizedDependency )
		) {
			throw new Error(
				`Invalid ${ source } dependency value: ${ dependency }`
			);
		}

		return normalizedDependency;
	} );
}

/**
 * Runs a command safely without invoking a shell.
 *
 * @param {string}        command Command binary name.
 * @param {Array<string>} args    Command arguments.
 * @param {string}        cwd     Working directory.
 */
function runSafeCommand( command, args, cwd ) {
	const result = spawnSync( command, args, {
		cwd,
		stdio: 'inherit',
		shell: false,
	} );

	if ( result.error ) {
		throw result.error;
	}

	if ( 0 !== result.status ) {
		throw new Error( `${ command } exited with status ${ result.status }` );
	}
}

/**
 * Sets up AI skills by symlinking SPEC.md and SKILL.md.
 *
 * @param {string} rawSlug      Original component slug
 * @param {string} componentDir Component directory
 * @param {string} themeRoot    Theme root path
 */
async function setupAiSkills( rawSlug, componentDir, themeRoot ) {
	const aiSkillsDir = path.join( themeRoot, '.ai', 'skills', rawSlug );
	await fs.ensureDir( aiSkillsDir );

	for ( const file of [ 'SPEC.md', 'SKILL.md' ] ) {
		const srcPath = path.join( componentDir, file );
		const destPath = path.join( aiSkillsDir, file );

		if ( ! ( await fs.pathExists( srcPath ) ) ) {
			continue;
		}

		try {
			// Use relative symlink if possible
			const relativeSrc = path.relative(
				path.dirname( destPath ),
				srcPath
			);

			if ( await fs.pathExists( destPath ) ) {
				const stats = await fs.lstat( destPath );
				if ( stats.isSymbolicLink() ) {
					await fs.unlink( destPath );
				} else {
					await fs.remove( destPath );
				}
			}

			await fs.symlink( relativeSrc, destPath );
			logger.success( `Symlinked ${ file } to .ai/skills/${ rawSlug }/` );
		} catch ( e ) {
			// Fallback to copy if symlink fails
			await fs.copy( srcPath, destPath );
			logger.warn(
				`Copied ${ file } to .ai/skills/${ rawSlug }/ (symlink failed)`
			);
		}
	}
}

/**
 * Runs the build process.
 *
 * @param {string} themeRoot Theme root path
 */
async function runBuild( themeRoot ) {
	logger.info( 'Running "npm run build" to process assets...' );
	try {
		runSafeCommand( 'npm', [ 'run', 'build' ], themeRoot );
		logger.success( '✓ Build completed successfully!' );
	} catch ( buildError ) {
		logger.error( `Build failed: ${ buildError.message }` );
		logger.warn( 'Note: You may need to run "npm run build" manually.' );
	}
}
