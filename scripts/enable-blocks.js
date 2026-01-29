import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

const configPath = path.resolve( __dirname, '../config/config.json' );
const sourceDir = path.resolve( __dirname, '../optional/Blocks' );
const destDir = path.resolve( __dirname, '../inc/Blocks' );

if ( ! fs.existsSync( configPath ) ) {
	console.error(
		'Config file not found. Please ensure config/config.json exists.'
	);
	process.exit( 1 );
}

const config = JSON.parse( fs.readFileSync( configPath, 'utf8' ) );

if ( config.theme && config.theme.enableBlocks ) {
	console.log( 'Blocks are already enabled.' );
	process.exit( 0 );
}

// Move the component
if ( fs.existsSync( sourceDir ) ) {
	if ( ! fs.existsSync( destDir ) ) {
		fs.mkdirSync( destDir, { recursive: true } );
	}
	// Simple copy for the component files
	fs.cpSync( sourceDir, destDir, { recursive: true } );
	console.log( 'Blocks component moved to inc/Blocks.' );
} else {
	console.error( 'Optional Blocks component not found in optional/Blocks.' );
	process.exit( 1 );
}

// Update Config
if ( ! config.theme ) {
	config.theme = {};
}
config.theme.enableBlocks = true;
fs.writeFileSync( configPath, JSON.stringify( config, null, 2 ) );
console.log( 'Theme configuration updated: enableBlocks set to true.' );

// Update Theme.php
const themePath = path.resolve( __dirname, '../inc/Theme.php' );
if ( fs.existsSync( themePath ) ) {
	let themeContent = fs.readFileSync( themePath, 'utf8' );
	if ( ! themeContent.includes( 'new Blocks\\Component()' ) ) {
		const optionsLine = 'new Options\\Component(),';
		if ( themeContent.includes( optionsLine ) ) {
			themeContent = themeContent.replace(
				optionsLine,
				`${ optionsLine }\n\t\t\tnew Blocks\\Component(),`
			);
			fs.writeFileSync( themePath, themeContent );
			console.log(
				'inc/Theme.php updated: Blocks\\Component initialized.'
			);
		} else {
			console.error(
				'Could not find Options\\Component in inc/Theme.php to insert Blocks\\Component.'
			);
		}
	}
}

console.log( 'Success! You can now use "npm run block:new" to create blocks.' );
