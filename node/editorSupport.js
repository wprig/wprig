/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Initialize __dirname manually
const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

// Specify the paths to the files you want to modify.
const fseFolders = [ '../parts', '../templates' ];

/**
 * Generates a theme.json file in the theme's root directory.
 * This file provides default settings for the block editor.
 */
function generateThemeJson() {
	console.log( 'Generating theme.json...' );

	// Define the structure and content of the theme.json file.
	const themeJsonData = {
		$schema: 'https://schemas.wp.org/wp/6.4/theme.json',
		version: 2,
		settings: {
			appearanceTools: true,
			layout: {
				contentSize: '800px',
				wideSize: '1200px',
			},
			color: {
				palette: [
					{
						slug: 'primary',
						color: '#0073e5',
						name: 'Primary',
					},
					{
						slug: 'secondary',
						color: '#0050a0',
						name: 'Secondary',
					},
					{
						slug: 'foreground',
						color: '#333333',
						name: 'Foreground',
					},
					{
						slug: 'background',
						color: '#ffffff',
						name: 'Background',
					},
				],
			},
			typography: {
				fontFamilies: [
					{
						fontFamily:
							"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif",
						slug: 'system-fonts',
						name: 'System Fonts',
					},
				],
			},
		},
		styles: {
			color: {
				text: 'var(--wp--preset--color--foreground)',
				background: 'var(--wp--preset--color--background)',
			},
			elements: {
				link: {
					color: {
						text: 'var(--wp--preset--color--primary)',
					},
				},
			},
		},
	};

	// Define the output path for the theme.json file (theme root).
	const outputPath = path.resolve( __dirname, '../theme.json' );

	// Write the theme.json file.
	try {
		fs.writeFileSync(
			outputPath,
			JSON.stringify( themeJsonData, null, 2 )
		);
		console.log(
			`✅ theme.json generated successfully at ${ outputPath }`
		);
	} catch ( error ) {
		console.error( `❌ Error generating theme.json: ${ error.message }` );
	}
}

function checkAndCreateFolders( folderPaths ) {
	folderPaths.forEach( ( folderPath ) => {
		try {
			// Check if the folder exists.
			const fullPath = path.resolve( __dirname, folderPath );
			if ( ! fs.existsSync( fullPath ) ) {
				// If the folder does not exist, create it.
				fs.mkdirSync( fullPath );
				console.log( `Folder "${ fullPath }" created.` );
			} else {
				console.log( `Folder "${ fullPath }" already exists.` );
			}
		} catch ( error ) {
			console.error(
				`Error checking/creating folder "${ folderPath }": ${ error.message }`
			);
		}
	} );
}

function createIndexHtmlWithStarterContent( templatesFolderPath ) {
	try {
		// Ensure the templates folder exists.
		const fullTemplatesPath = path.resolve(
			__dirname,
			templatesFolderPath
		);
		if ( ! fs.existsSync( fullTemplatesPath ) ) {
			fs.mkdirSync( fullTemplatesPath, { recursive: true } );
		}

		// Create the path for the new index.html file.
		const indexPath = path.join( fullTemplatesPath, 'index.html' );

		// Check if the file already exists.
		if ( fs.existsSync( indexPath ) ) {
			console.log( `index.html already exists at ${ indexPath }.` );
			return;
		}

		// Define Gutenberg-ready starter content.
		const starterContent = `
<!-- wp:header {"style":{"spacing":{"margin":{"bottom":"40px"}}}} /-->

<!-- wp:group {"layout":{"type":"constrained"}} -->
<div class="wp-block-group">
    <!-- wp:post-content /-->
</div>
<!-- /wp:group -->

<!-- wp:footer {"style":{"spacing":{"margin":{"top":"40px"}}}} /-->
        `;

		// Write starter content to index.html.
		fs.writeFileSync( indexPath, starterContent, 'utf8' );
		console.log(
			`index.html with starter content created at ${ indexPath } successfully.`
		);
	} catch ( error ) {
		console.error( `Error creating index.html: ${ error.message }` );
	}
}

// --- SCRIPT EXECUTION ---

checkAndCreateFolders( fseFolders );
createIndexHtmlWithStarterContent( '../templates' );
generateThemeJson(); // Call the new function to create theme.json
