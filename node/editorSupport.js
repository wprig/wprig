/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Internal dependencies
 */
import { propagateTokens } from '../scripts/tasks/tokens.js';

// Initialize __dirname manually
const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

// Specify the paths to the files you want to modify.
const fseFolders = [ '../parts', '../templates' ];

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

		// Read starter content from template HTML file in scripts/templates/index.html.
		const templateSourcePath = path.resolve(
			__dirname,
			'../scripts/templates/index.html'
		);

		if ( ! fs.existsSync( templateSourcePath ) ) {
			console.error(
				`❌ Starter template source not found at ${ templateSourcePath }`
			);
			return;
		}

		const starterContent = fs.readFileSync( templateSourcePath, 'utf8' );

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
updateConfigThemeType( 'universal' );

// theme.json is generated from config/tokens.json (v3 / WP 7.1) — the single writer
// is scripts/tasks/tokens.js (D9); this setup step no longer hardcodes theme.json.
propagateTokens()
	.then( () =>
		console.log(
			'✅ theme.json generated from tokens (v3 / WP 7.1 schema) at ../theme.json'
		)
	)
	.catch( ( error ) =>
		console.error( `❌ Error propagating tokens: ${ error.message }` )
	);

function updateConfigThemeType( themeType ) {
	const configPath = path.resolve( __dirname, '../config/config.json' );
	if ( ! fs.existsSync( configPath ) ) {
		return;
	}

	try {
		const config = JSON.parse( fs.readFileSync( configPath, 'utf8' ) );
		config.theme = config.theme || {};

		// Only update if not already block-based, to preserve more specific type
		if ( config.theme.themeType !== 'block-based' ) {
			config.theme.themeType = themeType;
			fs.writeFileSync(
				configPath,
				JSON.stringify( config, null, 2 ) + '\n',
				'utf8'
			);
			console.log(
				`✅ config/config.json: updated themeType to ${ themeType }`
			);
		}
	} catch ( error ) {
		console.error(
			`❌ Error updating config/config.json: ${ error.message }`
		);
	}
}
