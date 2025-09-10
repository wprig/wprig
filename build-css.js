import {
	readFileSync,
	writeFileSync,
	readdirSync,
	existsSync,
	mkdirSync,
	statSync,
} from 'fs';
import path from 'path';
import { bundleAsync } from 'lightningcss';
import { paths } from './gulp/constants.js';
import { replaceInlineCSS } from './gulp/utils.js';

// get this from config
const themeSlug = 'wp-rig';
// Determine if running in development mode
const isDev = process.argv.includes( '--dev' );

// Ensure output directories exist
const ensureDirectoryExistence = ( dir ) => {
	if ( ! existsSync( dir ) ) {
		mkdirSync( dir, { recursive: true } );
	}
};

ensureDirectoryExistence( paths.styles.dest );
ensureDirectoryExistence( paths.styles.editorDest );

// Read the contents of _custom-media.css
const customMediaCSS = readFileSync(
	path.resolve( paths.styles.srcDir, '_custom-media.css' ),
	'utf8'
);

/**
 * Process CSS content to replace theme URLs with actual paths
 *
 * This function handles both the url('~theme/path') and var(--theme-assets-path)/path
 * formats and converts them to proper absolute URLs with the theme path.
 *
 * @param {string} css - CSS content to process
 * @return {string} - Processed CSS content
 */
function processThemeUrls( css ) {
	// Extract theme slug from config if available, otherwise use default
	const themeName = themeSlug;

	// First replace all ~theme references (with or without quotes)
	let processedCSS = css.replace(
		/url\((['"]?)~theme\/([^'")]+)(['"]?)\)/g,
		( match, openQuote, assetPath, closeQuote ) => {
			// Ensure quotes are consistent
			const quote = openQuote || "'";
			const endQuote = closeQuote || "'";
			return `url(${ quote }/wp-content/themes/${ themeName }/${ assetPath }${ endQuote })`;
		}
	);

	// Then replace var(--theme-assets-path) pattern with proper URL format
	processedCSS = processedCSS.replace(
		/var\(--theme-assets-path\)\/([^\s;)]+)/g,
		( match, assetPath ) => {
			return `url('/wp-content/themes/${ themeName }/assets/${ assetPath }')`;
		}
	);

	return processedCSS;
}

// Recursive function to find all files
const getAllFiles = ( dir ) => {
	const files = readdirSync( dir );
	let filelist = [];
	files.forEach( ( file ) => {
		const filePath = path.join( dir, file );
		const fileStat = statSync( filePath );
		if ( fileStat.isDirectory() ) {
			filelist = filelist.concat( getAllFiles( filePath ) );
		} else if ( file.endsWith( '.css' ) && ! file.startsWith( '_' ) ) {
			filelist.push( filePath );
		}
	} );
	return filelist;
};

// Process CSS files recursively
const processCSSFile = async ( filePath, outputPath ) => {
	const entryAbs = path.resolve( filePath );

	const result = await bundleAsync( {
		filename: entryAbs,
		minify: ! isDev,
		sourceMap: isDev,
		sourceMapIncludeSources: true, // embed original sources so DevTools can jump to them
		drafts: { customMedia: true },
		resolver: {
			// Return processed source per file so each keeps its identity in the map
			read( readPath ) {
				// Read original file content
				let css = readFileSync( readPath, 'utf8' );

				// Prepend custom media only for the entry file (appears once at top)
				if ( path.resolve( readPath ) === entryAbs ) {
					css = customMediaCSS + css;
				}

				// Apply your text-level transforms; LightningCSS treats this as the "original" for mapping
				css = replaceInlineCSS( css );
				css = processThemeUrls( css );

				return css; // Important: return the string; bundler knows the file is `readPath`
			},
			resolve( specifier, from ) {
				return path.resolve( path.dirname( from ), specifier );
			},
		},
		targets: { browsers: [ '>0.2%', 'not dead', 'not op_mini all' ] },
	} );

	// Optional sanity-check: log what sources ended up in the map during dev
	if ( isDev && result.map ) {
		try {
			const mapJson = JSON.parse( result.map.toString() );
			console.log(
				'[css] map sources:',
				Array.isArray( mapJson.sources )
					? mapJson.sources.slice( 0, 5 )
					: mapJson.sources
			);
		} catch {}
	}

	if ( result.map ) {
		const mapFile = `${ outputPath }.map`;
		writeFileSync( mapFile, result.map );

		// Append a comment at the end of the CSS file that allows browsers to locate the corresponding map file.
		const cssWithMap = Buffer.concat( [
			result.code,
			Buffer.from(
				`\n/*# sourceMappingURL=${ path.basename( mapFile ) } */\n`
			),
		] );
		writeFileSync( outputPath, cssWithMap );
	} else {
		writeFileSync( outputPath, result.code );
	}
};

// Function to process all CSS files in a directory
const processDirectory = ( dir, destDir ) => {
	const files = getAllFiles( dir );
	files.forEach( ( file ) => {
		const relativePath = path.relative( dir, file );
		const outputPath = path.join(
			destDir,
			relativePath.replace( '.css', '.min.css' )
		);
		const outputDir = path.dirname( outputPath );
		ensureDirectoryExistence( outputDir );
		processCSSFile( file, outputPath );
	} );
};

// Process main CSS directory
processDirectory( paths.styles.srcDir, paths.styles.dest );

// Process editor CSS directory
processDirectory( paths.styles.editorSrcDir, paths.styles.editorDest );
