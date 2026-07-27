import fs from 'fs';
import path from 'path';
import esbuild from 'esbuild';
import { paths } from '../lib/constants.js';

/**
 * esbuild plugin to transform WordPress and React imports to global variables.
 */
const transformImportsPlugin = {
	name: 'transform-imports-plugin',
	setup( build ) {
		const getWpGlobal = ( pkg ) => {
			if ( pkg === 'react' ) {
				return 'window.React';
			}
			if ( pkg === 'react-dom' ) {
				return 'window.ReactDOM';
			}
			if ( pkg.startsWith( '@wordpress/' ) ) {
				const packageName = pkg.replace( '@wordpress/', '' );
				switch ( packageName ) {
					case 'server-side-render':
						return 'window.wp.serverSideRender';
					case 'block-editor':
						return 'window.wp.blockEditor';
					case 'html-entities':
						return 'window.wp.htmlEntities';
					default:
						return `window.wp.${ packageName.replace(
							/-([a-z])/g,
							( _, letter ) => letter.toUpperCase()
						) }`;
				}
			}
			return `window.wp.${ pkg }`;
		};

		build.onLoad( { filter: /\.(js|jsx|ts|tsx)$/ }, async ( args ) => {
			try {
				const source = await fs.promises.readFile( args.path, 'utf8' );
				let transformedCode = source.replace(
					/import\s+{([^}]+)}\s+from\s+['"](@wordpress\/[^'"]+|react|react-dom)['"]/g,
					( match, imports, pkg ) => {
						const globalPrefix = getWpGlobal( pkg );
						const importLines = imports
							.split( ',' )
							.map( ( item ) => {
								const parts = item.trim().split( ' as ' );
								const importName = parts[ 0 ].trim();
								const localName =
									parts.length > 1
										? parts[ 1 ].trim()
										: importName;

								return `const ${ localName } = ${ globalPrefix }.${ importName };`;
							} );

						return importLines.join( '\n' );
					}
				);

				transformedCode = transformedCode.replace(
					/import\s+(\w+)\s+from\s+['"](@wordpress\/[^'"]+|react|react-dom)['"]/g,
					( match, importName, pkg ) => {
						const globalVar = getWpGlobal( pkg );
						return `const ${ importName } = ${ globalVar };`;
					}
				);

				transformedCode = transformedCode.replace(
					/import\s+ServerSideRender\s+from\s+['"]@wordpress\/server-side-render['"]/g,
					'const ServerSideRender = window.wp.serverSideRender;'
				);

				return {
					contents: transformedCode,
					loader:
						args.path.endsWith( '.ts' ) ||
						args.path.endsWith( '.tsx' )
							? 'tsx'
							: 'jsx',
				};
			} catch ( e ) {
				return { errors: [ { text: e.message } ] };
			}
		} );
	},
};

/**
 * Build all blocks in the assets/blocks directory.
 *
 * @param {boolean} watch Whether to watch for changes.
 */
export default async function buildAllBlocks( watch = false ) {
	const blocksDir = paths.blocks.srcDir;

	if ( ! fs.existsSync( blocksDir ) ) {
		console.error( `Blocks directory not found: ${ blocksDir }` );
		return;
	}

	const blocks = fs
		.readdirSync( blocksDir )
		.filter( ( file ) =>
			fs.statSync( path.join( blocksDir, file ) ).isDirectory()
		);

	if ( blocks.length === 0 ) {
		console.log( 'No blocks found to build.' );
		return;
	}

	console.log( `Found ${ blocks.length } blocks. Starting build...` );

	for ( const block of blocks ) {
		const blockPath = path.join( blocksDir, block );
		const blockJsonPath = path.join( blockPath, 'block.json' );

		if ( fs.existsSync( blockJsonPath ) ) {
			try {
				const blockJson = JSON.parse(
					fs.readFileSync( blockJsonPath, 'utf8' )
				);
				if ( blockJson?.supports?.autoRegister === true ) {
					console.log(
						`Block "${ block }" is a PHP-only block (autoRegister enabled). Skipping build step.`
					);
					continue;
				}
			} catch {
				// Fallback if parsing fails
			}
		}

		const entryPoint = path.join( blockPath, 'src', 'index.js' );
		const entryPointTs = path.join( blockPath, 'src', 'index.tsx' );

		const finalEntryPoint = fs.existsSync( entryPointTs )
			? entryPointTs
			: entryPoint;

		if ( ! fs.existsSync( finalEntryPoint ) ) {
			console.warn(
				`Skipping block "${ block }": No entry point found at ${ finalEntryPoint }`
			);
			continue;
		}

		console.log( `Building block: ${ block }...` );

		const buildOptions = {
			entryPoints: [ finalEntryPoint ],
			outfile: path.join( blockPath, 'build', 'index.js' ),
			bundle: true,
			format: 'iife',
			globalName: `wpBlock${ block.replace( /-/g, '' ) }`,
			plugins: [ transformImportsPlugin ],
			loader: {
				'.js': 'jsx',
				'.ts': 'tsx',
			},
			jsxFactory: 'window.React.createElement',
			jsxFragment: 'window.React.Fragment',
			target: [ 'es2018' ],
			logLevel: 'info',
		};

		const viewEntryPoint = path.join( blockPath, 'src', 'view.js' );
		const viewEntryPointTs = path.join( blockPath, 'src', 'view.tsx' );
		const finalViewEntryPoint = fs.existsSync( viewEntryPointTs )
			? viewEntryPointTs
			: viewEntryPoint;

		if ( fs.existsSync( finalViewEntryPoint ) ) {
			console.log( `Building view script for block: ${ block }...` );
			const viewBuildOptions = {
				...buildOptions,
				entryPoints: [ finalViewEntryPoint ],
				outfile: path.join( blockPath, 'build', 'view.js' ),
			};

			try {
				if ( watch ) {
					const ctx = await esbuild.context( viewBuildOptions );
					await ctx.watch();
				} else {
					await esbuild.build( viewBuildOptions );
				}
			} catch ( e ) {
				console.error(
					`Error building view script for ${ block }:`,
					e.message
				);
			}
		}

		try {
			if ( watch ) {
				const ctx = await esbuild.context( buildOptions );
				await ctx.watch();
				console.log( `Watching block: ${ block }...` );
			} else {
				await esbuild.build( buildOptions );
				console.log( `Successfully built block: ${ block }` );
			}
		} catch ( e ) {
			console.error( `Error building block ${ block }:`, e.message );
		}
	}

	if ( watch ) {
		console.log( 'Watching for changes...' );
	} else {
		console.log( 'All blocks built successfully!' );
	}
}
