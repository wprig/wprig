const fs = require( 'fs' );
const path = require( 'path' );

// Specify the paths to the files you want to modify.
const fseFolders = [
	'../parts',
	'../templates',
];

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
			console.error( `Error checking/creating folder "${ folderPath }": ${ error.message }` );
		}
	} );
}

function createBlankIndexHtml( templatesFolderPath ) {
	try {
		// Ensure the templates folder exists.
		if ( ! fs.existsSync( templatesFolderPath ) ) {
			fs.mkdirSync( templatesFolderPath, { recursive: true } );
		}

		// Create the path for the new index.html file.
		const indexPath = path.join( templatesFolderPath, 'index.html' );
		const fullPath = path.resolve( __dirname, indexPath );

		// Check if the file already exists.
		if ( fs.existsSync( fullPath ) ) {
			console.log( `index.html already exists at ${ fullPath }.` );
			return;
		}

		// Create a blank index.html file.

		fs.writeFileSync( fullPath, '', 'utf8' );

		console.log( `Blank index.html created  at ${ fullPath } successfully.` );
	} catch ( error ) {
		console.error( `Error creating blank index.html: ${ error.message }` );
	}
}

function addFseSupport( filePath ) {
	try {
		// Read the content of the PHP file.
		let content = fs.readFileSync( filePath, 'utf8' );

		// Find the index of the opening curly brace of action_essential_theme_support.
		const openingBraceIndex = content.indexOf( '{', content.indexOf( 'function action_essential_theme_support(' ) );

		// Find the index of the closing curly brace of action_essential_theme_support.
		const closingBraceIndex = content.indexOf( '}', openingBraceIndex );

		// Check if both braces are found.
		if ( openingBraceIndex !== -1 && closingBraceIndex !== -1 ) {
			// Find the index of the starting line of the method.
			let startLineIndex = content.lastIndexOf( '\n', openingBraceIndex - 1 );

			// Find the index of the ending line of the method.
			let endLineIndex = content.indexOf( '\n', closingBraceIndex );

			// Adjust startLineIndex and endLineIndex to include 5 lines before and after the braces.
			startLineIndex = Math.max( 0, startLineIndex - 5 );
			endLineIndex = endLineIndex + 5 < content.length ? endLineIndex + 5 : content.length;

			// Extract the surrounding content.
			const surroundingContent = content.slice( startLineIndex, endLineIndex );

			const fseSupports = [ 'editor-styles', 'wp-block-styles' ];
			fseSupports.forEach( ( support ) => {
				const supportRegex = new RegExp( `add_theme_support\\s*\\(\\s*'${ support }'`, 'g' );
				const matches = surroundingContent.match( supportRegex );

				// If no matches are found, add a new call right before the closing curly brace.
				if ( ! matches ) {
					content = addThemeSupport( content, support, closingBraceIndex );
				}
			} );

			// Write the modified content back to the file.
			fs.writeFileSync( filePath, content, 'utf8' );
		} else {
			console.log( 'Opening or closing curly brace of action_essential_theme_support not found. Please check your PHP file.' );
		}
	} catch ( error ) {
		console.error( `Error adding fse_support function to "${ filePath }": ${ error.message }` );
	}
}

function addThemeSupport( content, themeSupport, closingBraceIndex ) {
	const newFunctionCall = '\n\t\t// Add support for editor styles\n\t\tadd_theme_support(\'' + themeSupport + '\');\n';
	console.log( `${ themeSupport } support added to Base_Support Component.` );
	return content.slice( 0, closingBraceIndex - 1 ) + '\t' + newFunctionCall + content.slice( closingBraceIndex - 1 );
}

function updateConfigJson( configFolderPath ) {
	try {
		// Read the content of the config.default.json file
		const configDefaultFullPath = path.resolve( __dirname, configFolderPath );
		const defaultConfigPath = path.join( configDefaultFullPath, 'config.default.json' );
		const defaultConfigContent = fs.readFileSync( defaultConfigPath, 'utf8' );
		const defaultConfigObject = JSON.parse( defaultConfigContent );

		// Retrieve the object.export.filesToCopy parameter
		const filesToCopy = defaultConfigObject.export.filesToCopy;

		// Create the path for the config.json file
		const configFullPath = path.resolve( __dirname, configFolderPath );
		const configPath = path.join( configFullPath, 'config.json' );

		// Check if the config.json file exists
		let configObject = {};
		if ( fs.existsSync( configPath ) ) {
			// Read the existing content of config.json
			const configContent = fs.readFileSync( configPath, 'utf8' );
			configObject = JSON.parse( configContent );
		}

		// Add the filesToCopy parameter to the configObject
		configObject.export = configObject.export || {};
		configObject.export.filesToCopy = filesToCopy;
		configObject.export.filesToCopy.push(
			'templates',
			'templates/*',
			'parts',
			'parts/*',
		);

		// Write the updated configObject back to the config.json file
		fs.writeFileSync( configPath, JSON.stringify( configObject, null, 2 ), 'utf8' );

		console.log( 'config.json updated successfully.' );
	} catch ( error ) {
		console.error( `Error updating config.json: ${ error.message }` );
	}
}

checkAndCreateFolders( fseFolders );
createBlankIndexHtml( '../templates' );
addFseSupport( path.resolve( __dirname, '../inc/Base_Support/Component.php' ) );
updateConfigJson( '../config' );
