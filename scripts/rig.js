#!/usr/bin/env node
/**
 * WP Rig Component Registry CLI
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import c from 'ansi-colors';
import testComponent from './tasks/testComponent.js';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const themeRoot = path.resolve( __dirname, '..' );

const program = new Command();

program
	.name( 'rig' )
	.description( 'WP Rig Component Registry CLI' )
	.version( '1.0.0' )
	.option( '-r, --registry <name>', 'Registry to use', 'default' );

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

program
	.command( 'add <slug>' )
	.description( 'Add a component from the registry' )
	.action( async ( slug ) => {
		const auth = await getAuth( program.opts() );
		console.log(
			c.blue( `Adding component "${ slug }" from ${ auth.url }...` )
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

			const component = await response.json();
			const componentDir = path.join( themeRoot, 'inc', slug );

			if ( await fs.pathExists( componentDir ) ) {
				const { confirm } = await inquirer.prompt( [
					{
						type: 'confirm',
						name: 'confirm',
						message: `Component "${ slug }" already exists. Overwrite?`,
						default: false,
					},
				] );
				if ( ! confirm ) {
					return;
				}
			}

			await fs.ensureDir( componentDir );

			// Fetch and save required files
			const filesToFetch = {
				'Component.php': component.php_url,
				'manifest.json': `${ auth.url }/wp-json/wprig-registry/v1/components/${ slug }`, // or direct raw url if available
				'SPEC.md': component.spec_url,
				'SKILL.md': component.skill_url,
			};

			for ( const [ fileName, url ] of Object.entries( filesToFetch ) ) {
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
			}

			console.log(
				c.green( `Component "${ slug }" added successfully!` )
			);
			console.log(
				c.yellow(
					'Note: Run "npm run build" to process any new assets.'
				)
			);
		} catch ( error ) {
			console.error( c.red( `Add failed: ${ error.message }` ) );
		}
	} );

program
	.command( 'update <slug>' )
	.description( 'Update a component from the registry (diff-based)' )
	.action( async ( slug ) => {
		console.log( c.blue( `Updating component "${ slug }"...` ) );
		// TODO: Implement diff-based update
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
		console.log(
			c.blue( `Submitting component "${ slug }" to ${ auth.url }...` )
		);

		const componentDir = path.join( themeRoot, 'inc', slug );
		if ( ! ( await fs.pathExists( componentDir ) ) ) {
			console.error( c.red( `Component "${ slug }" not found in inc/` ) );
			return;
		}

		// Pre-flight check
		await testComponent( themeRoot, slug );

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
						slug,
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
		await testComponent( themeRoot, componentSlug );
	} );

program.parse();
