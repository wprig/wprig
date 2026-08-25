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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const themeRoot = path.resolve(__dirname, '..');

const log = [];
const addLog = (msg) => {
	console.log(msg);
	log.push(msg);
};

function findThemesDir() {
	// node/childify.js -> theme root -> themes dir
	return path.resolve(themeRoot, '..');
}

function pathExists(p) {
	try {
		fs.accessSync(p);
		return true;
	} catch {
		return false;
	}
}

/**
 * Reads the merged theme config the same way the build does (config.default.json
 * as the base, config.json as the overlay). config.local.json is deliberately
 * NOT merged: it is environment-specific and must not leak into a shipped child.
 *
 * @return {Object} Merged configuration (may be empty).
 */
function readMergedConfig() {
	let cfg = {};
	try {
		const defaultCfgPath = path.join(themeRoot, 'config', 'config.default.json');
		if (pathExists(defaultCfgPath)) {
			cfg = JSON.parse(fs.readFileSync(defaultCfgPath, 'utf8'));
		}
		const cfgPath = path.join(themeRoot, 'config', 'config.json');
		if (pathExists(cfgPath)) {
			const custom = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
			// Shallow-deep merge preserving default keys not present in custom.
			cfg = mergeDeep(cfg, custom);
		}
	} catch {
		/* best-effort: fall through to empty config */
	}
	return cfg || {};
}

/**
 * Deep-merges two plain objects (right wins) for config overlays.
 *
 * @param {Object} base  Base object.
 * @param {Object} overlay Overlay object.
 * @return {Object} Merged object.
 */
function mergeDeep(base, overlay) {
	const out = Array.isArray(base) ? base.slice() : { ...(base || {}) };
	if (!overlay || typeof overlay !== 'object') {
		return out;
	}
	for (const [key, value] of Object.entries(overlay)) {
		if (value && typeof value === 'object' && !Array.isArray(value)) {
			out[key] = mergeDeep(out[key], value);
		} else {
			out[key] = value;
		}
	}
	return out;
}

/**
 * Resolves the active theme paradigm from the shared config system.
 * Falls back to 'classic' (the shipped default) when config is absent or
 * invalid so childify never hard-fails on a not-yet-configured clone.
 *
 * @return {string} Active theme type ('classic' | 'universal' | 'block-based').
 */
function readThemeType() {
	try {
		const paradigmsPath = path.join(themeRoot, 'config', 'paradigms.json');
		if (pathExists(paradigmsPath)) {
			const paradigms = JSON.parse(fs.readFileSync(paradigmsPath, 'utf8'));
			const valid = Object.keys(paradigms.themeTypes || {});
			const themeType = readMergedConfig()?.theme?.themeType;
			if (typeof themeType === 'string' && valid.includes(themeType)) {
				return themeType;
			}
		}
	} catch {
		/* fall through */
	}
	return 'classic';
}

/**
 * Resolves the child theme's component keep-list from the active paradigm.
 * This is how the generated child "inherits the context-aware block/classic
 * intelligence of the parent build": classic-capable themes keep the classic
 * core (Sidebars), and block-capable themes additionally keep the block
 * components (Editor, Blocks, Block_Patterns, Block_Styles, Icons) so the
 * child build continues to compile and gate block assets. Component PARADIGM
 * gating (`is_active()`) is respected at runtime regardless.
 *
 * @param {string} [themeType] Active theme type. Resolved if omitted.
 * @return {string[]} Component directory names to keep.
 */
function resolveKeepList(themeType = readThemeType()) {
	const isBlockCapable = ['universal', 'block-based'].includes(themeType);
	const keep = ['Styles', 'Scripts', 'Sidebars'];
	if (isBlockCapable) {
		keep.push('Editor', 'Blocks', 'Block_Patterns', 'Block_Styles', 'Icons');
	}
	return keep;
}

/**
 * Writes the child theme's inc/components-manifest.json so Theme.php loads
 * exactly the kept components (the framework-native manifest mechanism).
 *
 * @param {string[]} keepList Component directory names to keep.
 */
function writeComponentsManifest(keepList) {
	const manifestPath = path.join(themeRoot, 'inc', 'components-manifest.json');
	const manifest = {};
	for (const name of keepList) {
		const dir = path.join(themeRoot, 'inc', name);
		if (pathExists(path.join(dir, 'Component.php'))) {
			manifest[name] = `inc/${name}/Component.php`;
		}
	}
	try {
		fse.ensureDirSync(path.dirname(manifestPath));
		fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
		addLog(
			`🧩 Wrote inc/components-manifest.json with ${Object.keys(manifest).length} kept components: ${Object.keys(manifest).join(', ')}`
		);
	} catch (e) {
		addLog(`⚠️ Failed to write inc/components-manifest.json: ${e.message}`);
	}
}

async function promptForParentSlug() {
	// Try to read existing config for default
	let defaultSlug = '';
	try {
		const cfgPath = path.join(themeRoot, 'config', 'config.default.json');
		if (pathExists(cfgPath)) {
			const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
			defaultSlug = cfg?.child?.parentSlug || '';
		}
	} catch {
		/* noop */
	}

	const answers = await inquirer.prompt([
		{
			type: 'input',
			name: 'parentSlug',
			message:
				'Enter the parent theme folder slug (in wp-content/themes):',
			default: defaultSlug,
			validate: (input) => {
				if (!input || !/^[a-z0-9\-\_]+$/.test(input)) {
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
	]);

	if (answers.validateExists) {
		const themesDir = findThemesDir();
		const parentDir = path.join(themesDir, answers.parentSlug);
		if (!pathExists(themesDir)) {
			addLog(
				`⚠️ Could not locate themes directory at ${themesDir}. Skipping existence validation.`
			);
		} else if (!pathExists(parentDir)) {
			addLog(
				`⚠️ Parent theme "${answers.parentSlug}" not found at ${parentDir}. You can continue, but ensure it exists in your WordPress install.`
			);
		} else {
			addLog(`✅ Found parent theme at ${parentDir}`);
		}
	}

	return answers.parentSlug;
}

async function promptForOptions() {
	const answers = await inquirer.prompt([
		{
			type: 'confirm',
			name: 'trimTemplates',
			message:
				'Remove/backup top-level templates and template-parts/ to inherit fully from the parent theme?',
			default: true,
		},
		{
			type: 'confirm',
			name: 'trimComponents',
			message:
				'Remove/backup core theme components in /inc (keeping only Styles, Scripts, and Sidebars)?',
			default: true,
		},
		{
			type: 'confirm',
			name: 'minimizeAssets',
			message:
				'Reset assets/css and assets/js to clean, minimal child theme stubs? (This will overwrite existing src files)',
			default: true,
		},
	]);
	return answers;
}

function ensureBackupDir() {
	const backupDir = path.join(themeRoot, 'childify_backup');
	fse.ensureDirSync(backupDir);
	return backupDir;
}

function writeSummary(backupDir) {
	try {
		const logPath = path.join(backupDir, 'childify-summary.txt');
		fs.writeFileSync(logPath, log.join('\n') + '\n', 'utf8');
		console.log(`\n📄 Summary written to ${logPath}`);
	} catch (e) {
		console.warn('Could not write summary log:', e.message);
	}
}

function upsertTemplateHeader(parentSlug) {
	const stylePath = path.join(themeRoot, 'style.css');
	if (!pathExists(stylePath)) {
		addLog('❌ style.css not found. Cannot add Template header.');
		return;
	}
	let css = fs.readFileSync(stylePath, 'utf8');
	if (!css.trim().startsWith('/*')) {
		addLog(
			'⚠️ style.css does not start with a header comment. Skipping Template insertion.'
		);
		return;
	}
	if (/^\s*Template\s*:/m.test(css)) {
		css = css.replace(/^(\s*Template\s*:\s*).*/m, `$1${parentSlug}`);
		addLog(
			`🛠️ Updated existing Template header to "${parentSlug}" in style.css`
		);
	} else {
		// Insert after Theme Name or before closing header
		const lines = css.split(/\r?\n/);
		let inserted = false;
		for (let i = 0; i < lines.length; i++) {
			if (/^\s*Theme Name\s*:/.test(lines[i])) {
				lines.splice(i + 1, 0, `Template: ${parentSlug}`);
				inserted = true;
				break;
			}
			if (/\*\//.test(lines[i])) {
				lines.splice(i, 0, `Template: ${parentSlug}`);
				inserted = true;
				break;
			}
		}
		if (!inserted) {
			lines.unshift('/*');
			lines.unshift(`Template: ${parentSlug}`);
			lines.unshift('*/');
		}
		css = lines.join('\n');
		addLog(`✅ Inserted Template: ${parentSlug} in style.css`);
	}
	fs.writeFileSync(stylePath, css, 'utf8');
}

function updateConfig(parentSlug) {
	// Update config.default.json
	const defaultCfgPath = path.join(
		themeRoot,
		'config',
		'config.default.json'
	);
	if (!pathExists(defaultCfgPath)) {
		addLog(
			'⚠️ config/config.default.json not found. Skipping config update.'
		);
		return;
	}

	let cfg;
	try {
		cfg = JSON.parse(fs.readFileSync(defaultCfgPath, 'utf8'));
	} catch (e) {
		addLog(`⚠️ Could not parse config.default.json: ${e.message}`);
		return;
	}

	cfg.child = cfg.child || {};
	cfg.child.enabled = true;
	cfg.child.parentSlug = parentSlug;
	// Optionally trim export: ensure style.css included; no need to add templates here.
	cfg.export = cfg.export || {};
	cfg.export.filesToCopy = Array.isArray(cfg.export.filesToCopy)
		? cfg.export.filesToCopy
		: [];
	if (!cfg.export.filesToCopy.includes('style.css')) {
		cfg.export.filesToCopy.push('style.css');
	}

	// Write updated config to config.default.json
	fs.writeFileSync(
		defaultCfgPath,
		JSON.stringify(cfg, null, 2) + '\n',
		'utf8'
	);
	addLog('🛠️ Updated config.default.json with child mode settings');

	// Also create or update config.json ensuring it mirrors default structure
	const cfgPath = path.join(themeRoot, 'config', 'config.json');

	// Default list we expect in export.filesToCopy
	const defaultFilesToCopy = [
		'LICENSE',
		'readme.txt',
		'screenshot.png',
		'assets/css/vendor/**/*.css',
		'assets/js/vendor/**/*.js',
		'assets/svg/*.svg',
		'assets/icons/*.svg',
		'style.css',
	];

	let existingCfg = {};

	// Try to read existing config.json if it exists
	if (pathExists(cfgPath)) {
		try {
			existingCfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
		} catch (e) {
			addLog(`⚠️ Could not parse existing config.json: ${e.message}`);
			// Continue with empty object if parsing fails
		}
	}

	// Start from updated default config (keeps theme and other defaults)
	const targetCfg = JSON.parse(JSON.stringify(cfg));

	// Merge in any existing theme overrides (if present)
	if (existingCfg.theme && typeof existingCfg.theme === 'object') {
		targetCfg.theme = {
			...(targetCfg.theme || {}),
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
		new Set([].concat(defaultFilesToCopy, baseFiles, existingFiles))
	);

	// Write updated config to config.json
	fs.writeFileSync(
		cfgPath,
		JSON.stringify(targetCfg, null, 2) + '\n',
		'utf8'
	);
	addLog(
		'✅ Created/updated config.json with child mode settings and defaults'
	);
}

/**
 * @deprecated Modern WP Rig discovers components dynamically (Theme.php glob /
 *   components-manifest.json + `is_active()` gating). Stripping `new X\Component()`
 *   lines from get_default_components() no longer applies. Kept-elsewhere logic
 *   lives in resolveKeepList() + writeComponentsManifest().
 */

function appendDequeueHelper(parentSlug) {
	const fnPath = path.join(themeRoot, 'functions.php');
	if (!pathExists(fnPath)) {
		addLog('⚠️ functions.php not found. Skipping dequeue helper.');
		return;
	}
	let php = fs.readFileSync(fnPath, 'utf8');
	if (php.includes('CHILDIFY: dequeue parent assets')) {
		addLog('ℹ️ Dequeue helper already present in functions.php.');
		return;
	}
	const snippet = `\n/**\n * CHILDIFY: dequeue parent assets if needed.\n * Adjust handles as necessary for your parent theme.\n */\nadd_action( 'wp_enqueue_scripts', function() {\n\t$handles = array(\n\t\t'parent-style',\n\t\t'${parentSlug}-style',\n\t\t'${parentSlug}-global',\n\t\t'${parentSlug}-scripts',\n\t);\n\tforeach ( $handles as $h ) {\n\t\twp_dequeue_style( $h );\n\t\twp_deregister_style( $h );\n\t\twp_dequeue_script( $h );\n\t\twp_deregister_script( $h );\n\t}\n}, 20 );\n// CHILDIFY: dequeue parent assets end\n`;
	// Insert before final initialize call to keep file readable
	php = php.replace(
		/\n\s*call_user_func\(\s*'WP_Rig\\\\WP_Rig\\\\wp_rig'\s*\);\s*\n?$/,
		`\n${snippet}\ncall_user_func( 'WP_Rig\\WP_Rig\\wp_rig' );\n`
	);
	fs.writeFileSync(fnPath, php, 'utf8');
	addLog('✅ Appended dequeue helper to functions.php');
}

/**
 * Recursively retrieves all PHP files under a directory, excluding specific folders.
 * @param {string} dir        Root directory to search.
 * @param {Array}  [fileList] Accumulated list of files.
 */
function getPhpFiles(dir, fileList = []) {
	const files = fs.readdirSync(dir);
	files.forEach((file) => {
		const filePath = path.join(dir, file);
		const stat = fs.statSync(filePath);
		if (stat.isDirectory()) {
			if (
				[
					'node_modules',
					'vendor',
					'tests',
					'childify_backup',
					'.git',
					'.github',
					'.ai',
				].includes(file)
			) {
				return;
			}
			getPhpFiles(filePath, fileList);
		} else if (file.endsWith('.php')) {
			fileList.push(filePath);
		}
	});
	return fileList;
}

/**
 * Converts get_template_directory() calls to get_stylesheet_directory() in functions.php
 * and all other theme PHP files to ensure proper child theme functionality.
 */
function convertTemplateToCssDirectory() {
	// Dynamically find all PHP files to process recursively
	const filesToProcess = getPhpFiles(themeRoot);

	let convertCount = 0;

	filesToProcess.forEach((filePath) => {
		try {
			let fileContent = fs.readFileSync(filePath, 'utf8');

			// Skip files that already handle stylesheet directory explicitly to avoid breaking fallback logic (e.g. Template_Tags.php)
			if (
				fileContent.includes('get_stylesheet_directory()') ||
				fileContent.includes('get_stylesheet_directory_uri()')
			) {
				return;
			}

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
			if (fileContent !== originalContent) {
				// Create backup of original file
				const backupPath = `${filePath}.bak`;
				fs.writeFileSync(backupPath, originalContent, 'utf8');

				fs.writeFileSync(filePath, fileContent, 'utf8');
				const relPath = path.relative(themeRoot, filePath);
				addLog(
					`✅ Converted template directory calls to stylesheet directory in ${relPath}`
				);
				convertCount++;
			}
		} catch (e) {
			const relPath = path.relative(themeRoot, filePath);
			addLog(
				`⚠️ Failed to update directory references in ${relPath}: ${e.message}`
			);
		}
	});

	if (convertCount > 0) {
		addLog(
			`🔄 Updated ${convertCount} files to use get_stylesheet_directory() instead of get_template_directory()`
		);
	}
}

function moveFileOrDir(relPath, backupDir) {
	const abs = path.join(themeRoot, relPath);
	if (!pathExists(abs)) {
		return false;
	}
	const dest = path.join(backupDir, relPath);
	fse.ensureDirSync(path.dirname(dest));
	fse.moveSync(abs, dest, { overwrite: true });
	addLog(`📦 Moved ${relPath} -> childify_backup/${relPath}`);
	return true;
}

function ensureMinimalIndex() {
	const indexPath = path.join(themeRoot, 'index.php');
	let needsStub = true;
	if (pathExists(indexPath)) {
		const content = fs.readFileSync(indexPath, 'utf8');
		if (/Silence is golden/i.test(content)) {
			needsStub = false;
		} else {
			// Backup existing heavy index
			const backupDir = ensureBackupDir();
			moveFileOrDir('index.php', backupDir);
		}
	}
	if (needsStub) {
		fs.writeFileSync(
			indexPath,
			'<?php\n// CHILDIFY: Minimal index.php to satisfy theme requirements.\n// Silence is golden.\n',
			'utf8'
		);
		addLog('✅ Wrote minimal index.php stub');
	}
}

function trimTemplatesAndPartials(backupDir) {
	// Move directories that commonly override parent
	['template-parts', 'optional'].forEach((dir) =>
		moveFileOrDir(dir, backupDir)
	);
	// Move top-level template PHP files except functions.php and index.php
	const rootFiles = fs.readdirSync(themeRoot);
	const moveList = rootFiles.filter(
		(f) =>
			/\.php$/.test(f) &&
			!['functions.php', 'index.php'].includes(f) &&
			!['wp-cli'].includes(f)
	);
	moveList.forEach((f) => moveFileOrDir(f, backupDir));
	ensureMinimalIndex();
}

function minimizeAssets(backupDir) {
	const cssSrc = path.join(themeRoot, 'assets', 'css', 'src');
	const jsSrc = path.join(themeRoot, 'assets', 'js', 'src');

	if (pathExists(cssSrc)) {
		// backup existing
		const cssBackup = path.join(backupDir, 'assets', 'css', 'src');
		fse.ensureDirSync(cssBackup);
		fse.copySync(cssSrc, cssBackup, { overwrite: true });

		// Check for editor directory
		const editorDir = path.join(cssSrc, 'editor');
		const hasEditorDir = pathExists(editorDir);

		// Instead of emptying the whole directory, we'll selectively handle files
		// Get all files and directories in cssSrc
		const items = fs.readdirSync(cssSrc);

		// Remove everything except the editor directory
		items.forEach((item) => {
			const itemPath = path.join(cssSrc, item);
			if (item !== 'editor') {
				if (fs.statSync(itemPath).isDirectory()) {
					fse.removeSync(itemPath);
				} else {
					fs.unlinkSync(itemPath);
				}
			}
		});

		// Make sure editor directory exists
		fse.ensureDirSync(editorDir);

		// If editor directory existed, empty it but keep the directory
		if (hasEditorDir) {
			const editorItems = fs.readdirSync(editorDir);
			editorItems.forEach((item) => {
				const itemPath = path.join(editorDir, item);
				if (fs.statSync(itemPath).isDirectory()) {
					fse.removeSync(itemPath);
				} else {
					fs.unlinkSync(itemPath);
				}
			});

			// Add a placeholder file in editor directory
			fs.writeFileSync(
				path.join(editorDir, 'editor.css'),
				'/* Child theme editor CSS overrides go here */\n',
				'utf8'
			);
		}

		// Write stub CSS file
		fs.writeFileSync(
			path.join(cssSrc, 'global.css'),
			'/* Child theme CSS overrides go here */\n',
			'utf8'
		);

		addLog(
			'🧹 Trimmed CSS src to a global.css stub (preserving editor/ directory)'
		);
	}

	if (pathExists(jsSrc)) {
		const jsBackup = path.join(backupDir, 'assets', 'js', 'src');
		fse.ensureDirSync(jsBackup);
		fse.copySync(jsSrc, jsBackup, { overwrite: true });
		fse.emptyDirSync(jsSrc);
		fs.writeFileSync(
			path.join(jsSrc, 'child.ts'),
			'// Child theme JS overrides go here\n',
			'utf8'
		);
		addLog('🧹 Trimmed JS src to a single child.ts stub');
	}
}

// Define components to keep for each paradigm (see resolveKeepList) so the
// child theme inherits the parent's context-aware block/classic intelligence.

function removeIncComponents(backupDir, keepList) {
	const incDir = path.join(themeRoot, 'inc');
	if (!pathExists(incDir)) {
		addLog('⚠️ inc directory not found. Skipping component removal.');
		return;
	}

	try {
		// Get all directories inside inc
		const items = fs.readdirSync(incDir);

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

		const dirsToMove = items.filter((item) => {
			// Keep our desired components and required files
			if (
				keepList.includes(item) ||
				requiredFiles.includes(item)
			) {
				return false;
			}
			// Move directories and non-required files
			return true;
		});

		// Move each directory/file to the backup
		let movedCount = 0;
		dirsToMove.forEach((item) => {
			if (moveFileOrDir(path.join('inc', item), backupDir)) {
				movedCount++;
			}
		});

		addLog(
			`🧹 Removed ${movedCount} items from /inc (keeping paradigm components: ${keepList.join(
				', '
			)} and required PHP files)`
		);
	} catch (e) {
		addLog(`⚠️ Failed to clean up inc directory: ${e.message}`);
	}
}

async function main() {
	console.log(
		'WP Rig Childify – convert this theme into a lightweight child theme'
	);
	const { proceed } = await inquirer.prompt([
		{
			type: 'confirm',
			name: 'proceed',
			message:
				'This will modify files in-place and create a childify_backup/. Continue?',
			default: true,
		},
	]);
	if (!proceed) {
		console.log('Aborted. No changes made.');
		return;
	}

	const parentSlug = await promptForParentSlug();
	const options = await promptForOptions();
	const backupDir = ensureBackupDir();

	const themeType = readThemeType();
	const keepList = resolveKeepList(themeType);

	addLog(
		`🧭 Child theme paradigm: ${themeType} (keeping ${keepList.join(', ')})`
	);

	upsertTemplateHeader(parentSlug);
	updateConfig(parentSlug);
	writeComponentsManifest(keepList);
	appendDequeueHelper(parentSlug);

	if (options.trimTemplates) {
		trimTemplatesAndPartials(backupDir);
	}
	if (options.minimizeAssets) {
		minimizeAssets(backupDir);
	}
	if (options.trimComponents) {
		removeIncComponents(backupDir, keepList);
	}
	convertTemplateToCssDirectory();

	writeSummary(backupDir);
	console.log(
		'\n✅ Childify complete. You can now run `npm run dev` or `npm run build`.'
	);
	console.log(
		'If something looks off, see childify_backup/ to restore files.'
	);
}

export {
	getPhpFiles,
	convertTemplateToCssDirectory,
	readThemeType,
	resolveKeepList,
	readMergedConfig,
};

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
	main().catch((e) => {
		console.error('Childify failed:', e);
		process.exitCode = 1;
	});
}
