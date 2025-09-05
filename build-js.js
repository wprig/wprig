import esbuild from 'esbuild';
import { readdirSync, existsSync, mkdirSync, statSync, readFileSync } from 'fs';
import path from 'path';
import { paths, isProd } from './gulp/constants.js';
import { replaceInlineJS } from './gulp/utils.js';

// Directory paths
const srcDir = paths.scripts.srcDir; // e.g., assets/js/src
const outDir = paths.scripts.dest; // e.g., assets/js

// Ensure the output directory exists
if ( ! existsSync( outDir ) ) {
	mkdirSync( outDir, { recursive: true } );
}

// Supported source extensions we want to process
const SUPPORTED_EXT = [ '.js', '.jsx', '.ts', '.tsx' ];

// Recursively collect all source files with supported extensions
const getAllFiles = ( dir ) => {
	const files = readdirSync( dir );
	let filelist = [];
	files.forEach( ( file ) => {
		const filePath = path.join( dir, file );
		const stats = statSync( filePath );
		if ( stats.isDirectory() ) {
			filelist = filelist.concat( getAllFiles( filePath ) );
		} else if ( SUPPORTED_EXT.includes( path.extname( file ) ) ) {
			filelist.push( filePath );
		}
	} );
	return filelist;
};

// Gather all JavaScript/TypeScript entries (including .jsx/.tsx)
const files = getAllFiles( srcDir );

// Plugin to transform code using replaceInlineJS before esbuild processes it
const replaceInlineJSPlugin = {
	name: 'replaceInlineJS',
	setup( build ) {
		build.onLoad( { filter: /\.(js|jsx|ts|tsx)$/ }, async ( args ) => {
			const filePath = args.path;
			const sourceCode = readFileSync( filePath, 'utf8' );
			const transformedCode = replaceInlineJS( sourceCode );

			// Choose the correct loader; treat .js as JSX-capable to allow JSX in .js files
			let ext = path.extname( filePath ).slice( 1 ); // -> js|jsx|ts|tsx
			if ( ext === 'js' ) {
				ext = 'jsx';
			}

			return {
				contents: transformedCode,
				loader: ext,
			};
		} );
	},
};

files.forEach( ( file ) => {
	const relativePath = path.relative( srcDir, file );

	// Keep the original behavior: always write .min.js outputs
	const outputPath = path.join(
		outDir,
		relativePath.replace( /\.(js|jsx|ts|tsx)$/, '.min.js' )
	);
	const outputDir = path.dirname( outputPath );

	if ( ! existsSync( outputDir ) ) {
		mkdirSync( outputDir, { recursive: true } );
	}

	esbuild
		.build( {
			entryPoints: [ file ],
			outfile: outputPath,
			minify: true, // ensure minification for all supported types
			sourcemap: isProd ? false : 'inline', // inline sourcemaps in dev
			bundle: true,
			target: [ 'es6' ], // adjust as needed
			loader: {
				'.js': 'jsx', // allow JSX in .js
				'.jsx': 'jsx', // explicit support for .jsx
				'.ts': 'ts',
				'.tsx': 'tsx',
			},
			plugins: [ replaceInlineJSPlugin ],
		} )
		.catch( () => process.exit( 1 ) );
} );
