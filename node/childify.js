/**
 * WP Rig Childify Script
 *
 * One-time converter to turn a fresh WP Rig clone into a lightweight child theme.
 * - Prompts for parent theme slug
 * - Validates parent presence (best-effort)
 * - Backs up trimmed files into childify_backup/
 * - Writes Template header in style.css
 * - Adds child flags to config/config.default.json
 * - Removes all components except Styles and Scripts from Theme.php
 * - Removes most components from inc directory (keeps only Styles and Scripts)
 * - Preserves essential PHP files (functions.php, Template_Tags.php, etc.)
 * - Moves full template overrides (template-parts/, optional/, root templates) out of the way
 * - Adds dequeue helpers to functions.php
 * - Converts get_template_directory() calls to get_stylesheet_directory() for proper child theme path handling
 * - Minimizes assets: keeps minimal stubs so builds still run (preserves editor/ directory)
 */

import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );
const themeRoot = path.resolve( __dirname, '..' );

const log = [];
const addLog = ( msg ) => {
	console.log( msg );
	log.push( msg );
};

function findThemesDir() {
	// node/childify.js -> theme root -> themes dir
	return path.resolve( themeRoot, '..' );
}

function pathExists( p ) {
	try {
		fs.accessSync( p );
		return true;
	} catch {
		return false;
	}
}

async function promptForParentSlug() {
	// Try to read existing config for default
	let defaultSlug = '';
	try {
		const cfgPath = path.join( themeRoot, 'config', 'config.default.json' );
		if ( pathExists( cfgPath ) ) {
			const cfg = JSON.parse( fs.readFileSync( cfgPath, 'utf8' ) );
			defaultSlug = cfg?.child?.parentSlug || '';
		}
	} catch {
		/* noop */
	}

	const answers = await inquirer.prompt( [
		{
			type: 'input',
			name: 'parentSlug',
			message:
				'Enter the parent theme folder slug (in wp-content/themes):',
			default: defaultSlug,
			validate: ( input ) => {
				if ( ! input || ! /^[a-z0-9\-\_]+$/.test( input ) ) {
					return 'Please enter a valid theme slug (lowercase letters, numbers, dashes/underscores).';
				}
				return true;
			},
		},
		{
			type: 'confirm',
			name: 'validateExists',
			message:
				'Attempt to validate that parent theme exists in wp-content/themes? (recommended)',
			default: true,
		},
	] );

	if ( answers.validateExists ) {
		const themesDir = findThemesDir();
		const parentDir = path.join( themesDir, answers.parentSlug );
		if ( ! pathExists( themesDir ) ) {
			addLog(
				`⚠️ Could not locate themes directory at ${ themesDir }. Skipping existence validation.`
			);
		} else if ( ! pathExists( parentDir ) ) {
			addLog(
				`⚠️ Parent theme "${ answers.parentSlug }" not found at ${ parentDir }. You can continue, but ensure it exists in your WordPress install.`
			);
		} else {
			addLog( `✅ Found parent theme at ${ parentDir }` );
		}
	}

	return answers.parentSlug;
}

function ensureBackupDir() {
	const backupDir = path.join( themeRoot, 'childify_backup' );
	fse.ensureDirSync( backupDir );
	return backupDir;
}

function writeSummary( backupDir ) {
	try {
		const logPath = path.join( backupDir, 'childify-summary.txt' );
		fs.writeFileSync( logPath, log.join( '\n' ) + '\n', 'utf8' );
		console.log( `\n📄 Summary written to ${ logPath }` );
	} catch ( e ) {
		console.warn( 'Could not write summary log:', e.message );
	}
}

function upsertTemplateHeader( parentSlug ) {
	const stylePath = path.join( themeRoot, 'style.css' );
	if ( ! pathExists( stylePath ) ) {
		addLog( '❌ style.css not found. Cannot add Template header.' );
		return;
	}
	let css = fs.readFileSync( stylePath, 'utf8' );
	if ( ! css.trim().startsWith( '/*' ) ) {
		addLog(
			'⚠️ style.css does not start with a header comment. Skipping Template insertion.'
		);
		return;
	}
	if ( /^\s*Template\s*:/m.test( css ) ) {
		css = css.replace( /^(\s*Template\s*:\s*).*/m, `$1${ parentSlug }` );
		addLog(
			`🛠️ Updated existing Template header to "${ parentSlug }" in style.css`
		);
	} else {
		// Insert after Theme Name or before closing header
		const lines = css.split( /\r?\n/ );
		let inserted = false;
		for ( let i = 0; i < lines.length; i++ ) {
			if ( /^\s*Theme Name\s*:/.test( lines[ i ] ) ) {
				lines.splice( i + 1, 0, `Template: ${ parentSlug }` );
				inserted = true;
				break;
			}
			if ( /\*\//.test( lines[ i ] ) ) {
				lines.splice( i, 0, `Template: ${ parentSlug }` );
				inserted = true;
				break;
			}
		}
		if ( ! inserted ) {
			lines.unshift( '/*' );
			lines.unshift( `Template: ${ parentSlug }` );
			lines.unshift( '*/' );
		}
		css = lines.join( '\n' );
		addLog( `✅ Inserted Template: ${ parentSlug } in style.css` );
	}
	fs.writeFileSync( stylePath, css, 'utf8' );
}

function updateConfig( parentSlug ) {
	// Update config.default.json
	const defaultCfgPath = path.join(
		themeRoot,
		'config',
		'config.default.json'
	);
	if ( ! pathExists( defaultCfgPath ) ) {
		addLog(
			'⚠️ config/config.default.json not found. Skipping config update.'
		);
		return;
	}

	let cfg;
	try {
		cfg = JSON.parse( fs.readFileSync( defaultCfgPath, 'utf8' ) );
	} catch ( e ) {
		addLog( `⚠️ Could not parse config.default.json: ${ e.message }` );
		return;
	}

	cfg.child = cfg.child || {};
	cfg.child.enabled = true;
	cfg.child.parentSlug = parentSlug;
	// Optionally trim export: ensure style.css included; no need to add templates here.
	cfg.export = cfg.export || {};
	cfg.export.filesToCopy = Array.isArray( cfg.export.filesToCopy )
		? cfg.export.filesToCopy
		: [];
	if ( ! cfg.export.filesToCopy.includes( 'style.css' ) ) {
		cfg.export.filesToCopy.push( 'style.css' );
	}

	// Write updated config to config.default.json
	fs.writeFileSync(
		defaultCfgPath,
		JSON.stringify( cfg, null, 2 ) + '\n',
		'utf8'
	);
	addLog( '🛠️ Updated config.default.json with child mode settings' );

	// Also create or update config.json ensuring it mirrors default structure
	const cfgPath = path.join( themeRoot, 'config', 'config.json' );

	// Default list we expect in export.filesToCopy
	const defaultFilesToCopy = [
		'LICENSE',
		'readme.txt',
		'screenshot.png',
		'assets/css/vendor/**/*.css',
		'assets/js/vendor/**/*.js',
		'assets/svg/*.svg',
		'style.css',
	];

	let existingCfg = {};

	// Try to read existing config.json if it exists
	if ( pathExists( cfgPath ) ) {
		try {
			existingCfg = JSON.parse( fs.readFileSync( cfgPath, 'utf8' ) );
		} catch ( e ) {
			addLog( `⚠️ Could not parse existing config.json: ${ e.message }` );
			// Continue with empty object if parsing fails
		}
	}

	// Start from updated default config (keeps theme and other defaults)
	const targetCfg = JSON.parse( JSON.stringify( cfg ) );

	// Merge in any existing theme overrides (if present)
	if ( existingCfg.theme && typeof existingCfg.theme === 'object' ) {
		targetCfg.theme = {
			...( targetCfg.theme || {} ),
			...existingCfg.theme,
		};
	}

	// Ensure child settings
	targetCfg.child = targetCfg.child || {};
	targetCfg.child.enabled = true;
	targetCfg.child.parentSlug = parentSlug;

	// Merge and normalize export.filesToCopy
	const baseFiles = Array.isArray(
		targetCfg.export && targetCfg.export.filesToCopy
	)
		? targetCfg.export.filesToCopy
		: [];
	const existingFiles = Array.isArray(
		existingCfg.export && existingCfg.export.filesToCopy
	)
		? existingCfg.export.filesToCopy
		: [];
	targetCfg.export = targetCfg.export || {};
	targetCfg.export.filesToCopy = Array.from(
		new Set( [].concat( defaultFilesToCopy, baseFiles, existingFiles ) )
	);

	// Write updated config to config.json
	fs.writeFileSync(
		cfgPath,
		JSON.stringify( targetCfg, null, 2 ) + '\n',
		'utf8'
	);
	addLog(
		'✅ Created/updated config.json with child mode settings and defaults'
	);
}

function updateThemeComponents() {
	const themePhp = path.join( themeRoot, 'inc', 'Theme.php' );
	if ( ! pathExists( themePhp ) ) {
		addLog( '⚠️ inc/Theme.php not found. Skipping component adjustments.' );
		return;
	}

	// Components to keep (should match the list in removeIncComponents)
	const keepComponents = [ 'Styles', 'Scripts', 'Sidebars' ];

	try {
		// Read the Theme.php file
		const themeContent = fs.readFileSync( themePhp, 'utf8' );

		// Find the get_default_components method
		const componentsMethodMatch = themeContent.match(
			/protected\s+function\s+get_default_components\(\)[\s\S]*?\{([\s\S]*?)\}/
		);

		if ( ! componentsMethodMatch ) {
			addLog(
				'⚠️ Could not find get_default_components method in Theme.php'
			);
			return;
		}

		// Get the method body
		const methodBody = componentsMethodMatch[ 1 ];

		// Find all component instantiations in the array
		const componentRegex = /\s*new\s+([^\s\\]+)\\Component\(\),/g;
		let matches;
		let updatedMethodBody = methodBody;
		const removedComponents = [];

		// Keep track of what we find in order to log it
		const keptComponents = [];

		// Process each component line
		while ( ( matches = componentRegex.exec( methodBody ) ) !== null ) {
			const fullMatch = matches[ 0 ];
			const componentName = matches[ 1 ];

			// If this component is not in our keep list, remove it
			if ( ! keepComponents.includes( componentName ) ) {
				updatedMethodBody = updatedMethodBody.replace(
					fullMatch,
					`\n\t\t// CHILDIFY: removed ${ componentName }\\Component`
				);
				removedComponents.push( componentName );
			} else {
				keptComponents.push( componentName );
			}
		}

		// Replace the method body in the full file content
		const updatedThemeContent = themeContent.replace(
			componentsMethodMatch[ 0 ],
			`protected function get_default_components() {${ updatedMethodBody }}`
		);

		// Write the updated file
		fs.writeFileSync( themePhp, updatedThemeContent, 'utf8' );

		addLog(
			`✅ Kept components in Theme.php: ${ keptComponents.join( ', ' ) }`
		);
		addLog(
			`🧹 Removed ${ removedComponents.length } components from Theme.php`
		);
	} catch ( e ) {
		addLog( `⚠️ Failed to update Theme.php: ${ e.message }` );
	}
}

function appendDequeueHelper( parentSlug ) {
	const fnPath = path.join( themeRoot, 'functions.php' );
	if ( ! pathExists( fnPath ) ) {
		addLog( '⚠️ functions.php not found. Skipping dequeue helper.' );
		return;
	}
	let php = fs.readFileSync( fnPath, 'utf8' );
	if ( php.includes( 'CHILDIFY: dequeue parent assets' ) ) {
		addLog( 'ℹ️ Dequeue helper already present in functions.php.' );
		return;
	}
	const snippet = `\n/**\n * CHILDIFY: dequeue parent assets if needed.\n * Adjust handles as necessary for your parent theme.\n */\nadd_action( 'wp_enqueue_scripts', function() {\n\t$handles = array(\n\t\t'parent-style',\n\t\t'${ parentSlug }-style',\n\t\t'${ parentSlug }-global',\n\t\t'${ parentSlug }-scripts',\n\t);\n\tforeach ( $handles as $h ) {\n\t\twp_dequeue_style( $h );\n\t\twp_deregister_style( $h );\n\t\twp_dequeue_script( $h );\n\t\twp_deregister_script( $h );\n\t}\n}, 20 );\n// CHILDIFY: dequeue parent assets end\n`;
	// Insert before final initialize call to keep file readable
	php = php.replace(
		/\n\s*call_user_func\(\s*'WP_Rig\\\\WP_Rig\\\\wp_rig'\s*\);\s*\n?$/,
		`\n${ snippet }\ncall_user_func( 'WP_Rig\\WP_Rig\\wp_rig' );\n`
	);
	fs.writeFileSync( fnPath, php, 'utf8' );
	addLog( '✅ Appended dequeue helper to functions.php' );
}

/**
 * Converts get_template_directory() calls to get_stylesheet_directory() in functions.php
 * and other PHP files to ensure proper child theme functionality.
 */
function convertTemplateToCssDirectory() {
	// The list of files to process
	const filesToProcess = [
		path.join( themeRoot, 'functions.php' ),
		path.join( themeRoot, 'inc', 'functions.php' ),
		// Add other PHP files that might need conversion
	];

	let convertCount = 0;

	filesToProcess.forEach( ( filePath ) => {
		if ( ! pathExists( filePath ) ) {
			return; // Skip if file doesn't exist
		}

		try {
			let fileContent = fs.readFileSync( filePath, 'utf8' );

			// Create backup of original file
			const backupPath = `${ filePath }.bak`;
			fs.writeFileSync( backupPath, fileContent, 'utf8' );

			// Perform replacements
			const originalContent = fileContent;

			// Replace all instances of get_template_directory() with get_stylesheet_directory()
			fileContent = fileContent.replace(
				/get_template_directory\(\)/g,
				'get_stylesheet_directory()'
			);

			// Replace all instances of get_template_directory_uri() with get_stylesheet_directory_uri()
			fileContent = fileContent.replace(
				/get_template_directory_uri\(\)/g,
				'get_stylesheet_directory_uri()'
			);

			// If changes were made, write the file and log it
			if ( fileContent !== originalContent ) {
				fs.writeFileSync( filePath, fileContent, 'utf8' );
				const relPath = path.relative( themeRoot, filePath );
				addLog(
					`✅ Converted template directory calls to stylesheet directory in ${ relPath }`
				);
				convertCount++;
			}
		} catch ( e ) {
			const relPath = path.relative( themeRoot, filePath );
			addLog(
				`⚠️ Failed to update directory references in ${ relPath }: ${ e.message }`
			);
		}
	} );

	if ( convertCount > 0 ) {
		addLog(
			`🔄 Updated ${ convertCount } files to use get_stylesheet_directory() instead of get_template_directory()`
		);
	}
}

function moveFileOrDir( relPath, backupDir ) {
	const abs = path.join( themeRoot, relPath );
	if ( ! pathExists( abs ) ) {
		return false;
	}
	const dest = path.join( backupDir, relPath );
	fse.ensureDirSync( path.dirname( dest ) );
	fse.moveSync( abs, dest, { overwrite: true } );
	addLog( `📦 Moved ${ relPath } -> childify_backup/${ relPath }` );
	return true;
}

function ensureMinimalIndex() {
	const indexPath = path.join( themeRoot, 'index.php' );
	let needsStub = true;
	if ( pathExists( indexPath ) ) {
		const content = fs.readFileSync( indexPath, 'utf8' );
		if ( /Silence is golden/i.test( content ) ) {
			needsStub = false;
		} else {
			// Backup existing heavy index
			const backupDir = ensureBackupDir();
			moveFileOrDir( 'index.php', backupDir );
		}
	}
	if ( needsStub ) {
		fs.writeFileSync(
			indexPath,
			'<?php\n// CHILDIFY: Minimal index.php to satisfy theme requirements.\n// Silence is golden.\n',
			'utf8'
		);
		addLog( '✅ Wrote minimal index.php stub' );
	}
}

function trimTemplatesAndPartials( backupDir ) {
	// Move directories that commonly override parent
	[ 'template-parts', 'optional' ].forEach( ( dir ) =>
		moveFileOrDir( dir, backupDir )
	);
	// Move top-level template PHP files except functions.php and index.php
	const rootFiles = fs.readdirSync( themeRoot );
	const moveList = rootFiles.filter(
		( f ) =>
			/\.php$/.test( f ) &&
			! [ 'functions.php', 'index.php' ].includes( f ) &&
			! [ 'wp-cli' ].includes( f )
	);
	moveList.forEach( ( f ) => moveFileOrDir( f, backupDir ) );
	ensureMinimalIndex();
}

function minimizeAssets( backupDir ) {
	const cssSrc = path.join( themeRoot, 'assets', 'css', 'src' );
	const jsSrc = path.join( themeRoot, 'assets', 'js', 'src' );

	if ( pathExists( cssSrc ) ) {
		// backup existing
		const cssBackup = path.join( backupDir, 'assets', 'css', 'src' );
		fse.ensureDirSync( cssBackup );
		fse.copySync( cssSrc, cssBackup, { overwrite: true } );

		// Check for editor directory
		const editorDir = path.join( cssSrc, 'editor' );
		const hasEditorDir = pathExists( editorDir );

		// Instead of emptying the whole directory, we'll selectively handle files
		// Get all files and directories in cssSrc
		const items = fs.readdirSync( cssSrc );

		// Remove everything except the editor directory
		items.forEach( ( item ) => {
			const itemPath = path.join( cssSrc, item );
			if ( item !== 'editor' ) {
				if ( fs.statSync( itemPath ).isDirectory() ) {
					fse.removeSync( itemPath );
				} else {
					fs.unlinkSync( itemPath );
				}
			}
		} );

		// Make sure editor directory exists
		fse.ensureDirSync( editorDir );

		// If editor directory existed, empty it but keep the directory
		if ( hasEditorDir ) {
			const editorItems = fs.readdirSync( editorDir );
			editorItems.forEach( ( item ) => {
				const itemPath = path.join( editorDir, item );
				if ( fs.statSync( itemPath ).isDirectory() ) {
					fse.removeSync( itemPath );
				} else {
					fs.unlinkSync( itemPath );
				}
			} );

			// Add a placeholder file in editor directory
			fs.writeFileSync(
				path.join( editorDir, 'editor.css' ),
				'/* Child theme editor CSS overrides go here */\n',
				'utf8'
			);
		}

		// Write stub CSS file
		fs.writeFileSync(
			path.join( cssSrc, 'global.css' ),
			'/* Child theme CSS overrides go here */\n',
			'utf8'
		);

		addLog(
			'🧹 Trimmed CSS src to a global.css stub (preserving editor/ directory)'
		);
	}

	if ( pathExists( jsSrc ) ) {
		const jsBackup = path.join( backupDir, 'assets', 'js', 'src' );
		fse.ensureDirSync( jsBackup );
		fse.copySync( jsSrc, jsBackup, { overwrite: true } );
		fse.emptyDirSync( jsSrc );
		fs.writeFileSync(
			path.join( jsSrc, 'child.ts' ),
			'// Child theme JS overrides go here\n',
			'utf8'
		);
		addLog( '🧹 Trimmed JS src to a single child.ts stub' );
	}
}

// Define components to keep in a const at the top level for consistency
const COMPONENTS_TO_KEEP = [ 'Styles', 'Scripts', 'Sidebars' ];

function removeIncComponents( backupDir ) {
	const incDir = path.join( themeRoot, 'inc' );
	if ( ! pathExists( incDir ) ) {
		addLog( '⚠️ inc directory not found. Skipping component removal.' );
		return;
	}

	try {
		// Get all directories inside inc
		const items = fs.readdirSync( incDir );

		// Filter out directories that should be moved (everything except those we want to keep)
		// Also keep non-component files that are needed
		const requiredFiles = [
			'Component_Interface.php',
			'Templating_Component_Interface.php',
			'Template_Tags.php',
			'Theme.php',
			'functions.php',
			'back-compat.php',
			'wordpress-shims.php',
		];

		const dirsToMove = items.filter( ( item ) => {
			// Keep our desired components and required files
			if (
				COMPONENTS_TO_KEEP.includes( item ) ||
				requiredFiles.includes( item )
			) {
				return false;
			}
			// Move directories and non-required files
			return true;
		} );

		// Move each directory/file to the backup
		let movedCount = 0;
		dirsToMove.forEach( ( item ) => {
			if ( moveFileOrDir( path.join( 'inc', item ), backupDir ) ) {
				movedCount++;
			}
		} );

		addLog(
			`🧹 Removed ${ movedCount } items from /inc (keeping only ${ COMPONENTS_TO_KEEP.join(
				', '
			) } components and required PHP files)`
		);
	} catch ( e ) {
		addLog( `⚠️ Failed to clean up inc directory: ${ e.message }` );
	}
}

async function main() {
	console.log(
		'WP Rig Childify – convert this theme into a lightweight child theme'
	);
	const { proceed } = await inquirer.prompt( [
		{
			type: 'confirm',
			name: 'proceed',
			message:
				'This will modify files in-place and create a childify_backup/. Continue?',
			default: true,
		},
	] );
	if ( ! proceed ) {
		console.log( 'Aborted. No changes made.' );
		return;
	}

	const parentSlug = await promptForParentSlug();
	const backupDir = ensureBackupDir();

	upsertTemplateHeader( parentSlug );
	updateConfig( parentSlug );
	updateThemeComponents();
	appendDequeueHelper( parentSlug );
	trimTemplatesAndPartials( backupDir );
	minimizeAssets( backupDir );
	removeIncComponents( backupDir );
	convertTemplateToCssDirectory();

	writeSummary( backupDir );
	console.log(
		'\n✅ Childify complete. You can now run `npm run dev` or `npm run build`.'
	);
	console.log(
		'If something looks off, see childify_backup/ to restore files.'
	);
}

main().catch( ( e ) => {
	console.error( 'Childify failed:', e );
	process.exitCode = 1;
} );
