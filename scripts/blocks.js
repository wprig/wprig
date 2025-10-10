#!/usr/bin/env node
/**
 * WP Rig Blocks CLI
 * - block:new <namespace>/<slug> [options]
 * - block:list
 * - block:remove <namespace>/<slug>
 * - block:promote-plugin <namespace>/<slug>
 *
 * Works under Node and Bun (bun run). Uses @wordpress/create-block with --no-plugin
 * to scaffold into assets/blocks/<slug>, then adjusts to WP Rig conventions.
 */
import { Command } from 'commander';
import path from 'node:path';
import fs from 'node:fs';
import fse from 'fs-extra';
import { spawn } from 'node:child_process';
import readline from 'node:readline';
// import url from 'node:url';
import themeConfig from '../config/themeConfig.js';

const program = new Command();
const root = process.cwd();
const blocksRoot = path.join(root, 'assets', 'blocks');
const defaultNamespace =
	themeConfig?.theme?.slug?.replace(/[^a-z0-9-]/gi, '-') || 'wprig';

function parseName(input) {
	// Accept "namespace/slug" or just "slug"
	if (!input) {
		throw new Error(
			'Missing block name. Expected <namespace>/<slug> or <slug>.'
		);
	}
	const parts = String(input).split('/');
	let ns, slug;
	if (parts.length === 1) {
		slug = parts[0];
		ns = defaultNamespace;
	} else if (parts.length === 2) {
		[ns, slug] = parts;
	} else {
		throw new Error(
			'Invalid name. Use <namespace>/<slug> (e.g., wprig/hero).'
		);
	}
	slug = slug
		.toLowerCase()
		.replace(/[^a-z0-9-]/g, '-')
		.replace(/^-+|-+$/g, '');
	ns = ns.toLowerCase().replace(/[^a-z0-9-]/g, '-');
	if (!slug || !ns) {
		throw new Error('Invalid namespace or slug.');
	}
	return { namespace: ns, slug, full: `${ns}/${slug}` };
}

function ensureBlocksRoot() {
	fse.ensureDirSync(blocksRoot);
}

function pathExists(p) {
	try {
		fs.accessSync(p);
		return true;
	} catch {
		return false;
	}
}

function execCreateBlock(cwd, args) {
	// prefer local bin to work with bun and avoid npx requirement
	const bin = path.join(root, 'node_modules', '.bin', 'create-block');
	const cmd = pathExists(bin) ? bin : 'npx';
	const finalArgs = pathExists(bin)
		? args
		: ['-y', '@wordpress/create-block', ...args];
	return new Promise((resolve, reject) => {
		const child = spawn(cmd, finalArgs, {
			cwd,
			stdio: 'inherit',
			shell: process.platform === 'win32',
		});
		child.on('exit', (code) =>
			code === 0
				? resolve()
				: reject(new Error(`create-block failed with code ${code}`))
		);
	});
}

// Remove stray subfolder (e.g., theme slug) created by create-block
async function cleanupCreateBlockArtifacts(blockDir) {
	try {
		const normalize = (s) =>
			String(s || '')
				.toLowerCase()
				.replace(/[^a-z0-9-]/g, '-')
				.replace(/^-+|-+$/g, '');
		const candidates = [];
		const themeSlug = normalize(themeConfig?.theme?.slug || '');
		if (themeSlug) {
			candidates.push(themeSlug);
		}
		const projectDir = normalize(path.basename(root) || '');
		if (projectDir) {
			candidates.push(projectDir);
		}

		const entries = fs.readdirSync(blockDir, { withFileTypes: true });
		for (const ent of entries) {
			if (!ent.isDirectory()) {
				continue;
			}
			const name = ent.name;
			// Only remove known artifact names, never touch expected dirs
			if (['src', 'build'].includes(name)) {
				continue;
			}
			if (candidates.includes(name)) {
				await fse.remove(path.join(blockDir, name));
			}
		}
	} catch {
		// best-effort cleanup; ignore errors
	}
}

async function createMinimalBlockJson(dir, options) {
	const raw = {
		name: `${options.namespace}/${options.slug}`,
		apiVersion: 2,
		title:
			(options.title ?
				options.title.replace(/&quot;/g, '"')
					.replace(/&amp;/g, '&')
					.replace(/&lt;/g, '<')
					.replace(/&gt;/g, '>')
					.replace(/&#39;/g, "'")
				:
				options.slug
					.replace(/[-_]/g, ' ')
					.replace(/\b\w/g, (m) => m.toUpperCase())),
		category: options.category || 'widgets',
		icon: options.icon || 'block-default',
		description: options.description || '',
		textdomain: themeConfig?.theme?.slug || 'wp-rig',
		editorScript: 'file:./build/index.js',
	};
	if (options.view) {
		raw.script = 'file:./build/view.js';
	}
	if (options.styleFlag) {
		raw.style = 'file:./build/style.css';
	}
	if (options.editorStyleFlag) {
		raw.editorStyle = 'file:./build/editor.css';
	}
	if (options.keywords) {
		raw.keywords = options.keywords
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
	}
	if (options.dynamic) {
		raw.render = 'file:./render.php';
	}
	raw.supports = { spacing: true, color: { text: true, background: true } };
	await fse.writeJSON(path.join(dir, 'block.json'), raw, { spaces: 2 });
}

// Helper function to decode HTML entities
function decodeHtmlEntities(text) {
	if (!text || typeof text !== 'string') return text;

	// Create a textarea element to use browser's built-in decoding
	const textarea = document.createElement('textarea');
	textarea.innerHTML = text;
	const decoded = textarea.value;

	// For Node.js environment, we need a different approach
	// This simple regex handles the most common entities like &quot;
	return decoded.replace(/&quot;/g, '"')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&#39;/g, "'");
}

async function adjustBlockJson(dir, options) {
	const blockJsonPath = path.join(dir, 'block.json');
	if (!pathExists(blockJsonPath)) {
		return;
	}
	const raw = await fse.readJSON(blockJsonPath);
	// Ensure name, title, category, icon, description. Use file: refs to build outputs.
	raw.name = `${options.namespace}/${options.slug}`;
	if (options.title) {
		// Decode HTML entities in the title to prevent &quot; artifacts
		raw.title = options.title.replace(/&quot;/g, '"')
			.replace(/&amp;/g, '&')
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&#39;/g, "'");
	}
	raw.category = options.category || raw.category || 'widgets';
	if (options.icon) {
		raw.icon = options.icon;
	}
	if (options.description) {
		raw.description = options.description;
	}
	if (options.keywords) {
		raw.keywords = options.keywords
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
	}
	// Ensure textdomain to theme slug for i18n
	raw.textdomain = themeConfig?.theme?.slug || 'wp-rig';
	// Point scripts/styles to built assets
	raw.editorScript = 'file:./build/index.js';
	// Optional separate front-end only script if requested via --view
	if (options.view) {
		raw.script = 'file:./build/view.js';
	}
	if (options.styleFlag) {
		raw.style = 'file:./build/style.css';
	}
	if (options.editorStyleFlag) {
		raw.editorStyle = 'file:./build/editor.css';
	}

	// Minimal supports if not present
	raw.supports = raw.supports || {
		spacing: true,
		color: { text: true, background: true },
		__experimentalBorder: false,
	};

	// Dynamic render callback reference when requested
	if (options.dynamic) {
		raw.render = 'file:./render.php';
	} else if (raw.render) {
		// Ensure static blocks don't keep a render property
		delete raw.render;
	}

	await fse.writeJSON(blockJsonPath, raw, { spaces: 2 });
}

async function writeTemplates(dir, opts) {
	// Ensure src exists and add example edit/save or TS variants
	const srcDir = path.join(dir, 'src');
	await fse.ensureDir(srcDir);
	const ext = opts.ts ? 'tsx' : 'js';
	let idx = await fse.readFile(
		path.join(
			root,
			'scripts',
			'templates',
			'block',
			opts.ts ? 'index.tsx' : 'index.js'
		),
		'utf8'
	);
	const edit = await fse.readFile(
		path.join(
			root,
			'scripts',
			'templates',
			'block',
			opts.dynamic
				? opts.ts
					? 'edit.dynamic.tsx'
					: 'edit.dynamic.js'
				: opts.ts
					? 'edit.tsx'
					: 'edit.js'
		),
		'utf8'
	);
	// Replace placeholders in index.* for correct name/title
	const fullName = `${opts.namespace}/${opts.slug}`;
	idx = idx.replace(/wprig\/example/g, fullName);
	if (opts.title) {
		idx = idx.replace(/Example Block/g, opts.title);
	}
	await fse.writeFile(path.join(srcDir, `index.${ext}`), idx);
	await fse.writeFile(path.join(srcDir, `edit.${ext}`), edit);
	if (opts.dynamic) {
		const render = await fse.readFile(
			path.join(root, 'scripts', 'templates', 'block', 'render.php'),
			'utf8'
		);
		await fse.writeFile(path.join(dir, 'render.php'), render);
	}
	if (opts.styleFlag && !pathExists(path.join(dir, 'style.css'))) {
		const style = await fse.readFile(
			path.join(root, 'scripts', 'templates', 'block', 'style.css'),
			'utf8'
		);
		await fse.writeFile(path.join(dir, 'style.css'), style);
	}
	if (opts.editorStyleFlag && !pathExists(path.join(dir, 'editor.css'))) {
		const estyle = await fse.readFile(
			path.join(root, 'scripts', 'templates', 'block', 'editor.css'),
			'utf8'
		);
		await fse.writeFile(path.join(dir, 'editor.css'), estyle);
	}
	if (!pathExists(path.join(dir, 'jest.config.cjs'))) {
		const jestCfg = await fse.readFile(
			path.join(root, 'scripts', 'templates', 'block', 'jest.config.cjs'),
			'utf8'
		);
		await fse.writeFile(path.join(dir, 'jest.config.cjs'), jestCfg);
	}
	if (
		!pathExists(
			path.join(dir, 'src', `index.test.${opts.ts ? 'ts' : 'js'}`)
		)
	) {
		const testTpl = await fse.readFile(
			path.join(
				root,
				'scripts',
				'templates',
				'block',
				opts.ts ? 'index.test.ts' : 'index.test.js'
			),
			'utf8'
		);
		await fse.writeFile(
			path.join(srcDir, `index.test.${opts.ts ? 'ts' : 'js'}`),
			testTpl
		);
	}
}

async function cmdNew(name, options) {
	ensureBlocksRoot();
	const { namespace, slug, full } = parseName(name);
	const dest = path.join(blocksRoot, slug);
	if (pathExists(dest)) {
		console.error(`Block directory already exists: ${dest}`);
		process.exit(1);
	}
	await fse.ensureDir(dest);

	// Invoke create-block in the destination directory with --no-plugin and minimal flags
	const cbArgs = [
		`${namespace}/${slug}`,
		'--no-plugin',
		// Use supported flag for dynamic variant if available. Older versions ignore it harmlessly.
		...(options.dynamic ? ['--variant', 'dynamic'] : []),
		// Removed deprecated/unsupported flag that caused failures:
		// '--starter=false',
	];
	try {
		await execCreateBlock(dest, cbArgs);
	} catch (e) {
		console.error([e, dest, cbArgs]);
		console.warn(
			'[warn] @wordpress/create-block failed or not present, proceeding with WP Rig templates only.'
		);
	}

	// Remove any stray artifact folder (e.g., theme slug) created by create-block
	await cleanupCreateBlockArtifacts(dest);

	// Ensure block.json exists even if create-block produced nothing
	const blockJsonPath = path.join(dest, 'block.json');
	if (!pathExists(blockJsonPath)) {
		await createMinimalBlockJson(dest, {
			namespace,
			slug,
			title: options.title,
			category: options.category,
			icon: options.icon,
			description: options.description,
			keywords: options.keywords,
			view: !!options.view,
			// Default to including CSS unless explicitly disabled by --no-style or --no-editor-style
			styleFlag: options.style !== false,
			editorStyleFlag: options.editorStyle !== false,
			dynamic: !!options.dynamic,
		});
	}

	// Apply our templates and adjust block.json
	await writeTemplates(dest, {
		ts: !!options.ts,
		dynamic: !!options.dynamic,
		// Default to including CSS unless explicitly disabled
		styleFlag: options.style !== false,
		editorStyleFlag: options.editorStyle !== false,
		namespace,
		slug,
		title: options.title,
	});
	await adjustBlockJson(dest, {
		namespace,
		slug,
		title: options.title,
		category: options.category,
		icon: options.icon,
		description: options.description,
		keywords: options.keywords,
		view: !!options.view,
		// Default to including CSS unless explicitly disabled
		styleFlag: options.style !== false,
		editorStyleFlag: options.editorStyle !== false,
		dynamic: !!options.dynamic,
	});
	console.log(`Created block ${full} at ${path.relative(root, dest)}`);
}

function listBlocks() {
	ensureBlocksRoot();
	const entries = fs
		.readdirSync(blocksRoot, { withFileTypes: true })
		.filter((d) => d.isDirectory())
		.map((d) => path.join(blocksRoot, d.name, 'block.json'))
		.filter((p) => pathExists(p));
	if (!entries.length) {
		console.log('No blocks found under assets/blocks.');
		return;
	}
	entries.forEach((p) => {
		try {
			const j = JSON.parse(fs.readFileSync(p, 'utf8'));
			console.log(
				`${j.name || '(unknown)'} -> ${path.relative(root, path.dirname(p))}`
			);
		} catch {
			console.log(
				`(invalid block.json) -> ${path.relative(root, path.dirname(p))}`
			);
		}
	});
}

async function removeBlock(name) {
	const { slug } = parseName(name);
	const dir = path.join(blocksRoot, slug);
	if (!pathExists(dir)) {
		console.error(`Block not found: ${dir}`);
		process.exit(1);
	}
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	const question = (q) => new Promise((res) => rl.question(q, res));
	const ans = (
		await question(
			`Are you sure you want to delete assets/blocks/${slug}? (y/N): `
		)
	)
		.trim()
		.toLowerCase();
	rl.close();
	if (ans !== 'y' && ans !== 'yes') {
		console.log('Aborted.');
		return;
	}
	await fse.remove(dir);
	console.log(`Removed assets/blocks/${slug}`);
}

async function promotePlugin(name) {
	const { namespace, slug, full } = parseName(name);
	const dir = path.join(blocksRoot, slug);
	if (!pathExists(dir)) {
		console.error(`Block not found: ${dir}`);
		process.exit(1);
	}
	const pluginsOut = path.join(root, 'optional', 'promoted-blocks');
	const pluginDir = path.join(pluginsOut, `${slug}-block`);
	await fse.ensureDir(pluginDir);

	// Minimal plugin scaffold
	const pluginPhp = `<?php\n/**\n * Plugin Name: ${slug} (from theme)\n * Description: Promoted block ${full} exported from theme.\n * Version: 0.1.0\n * Author: ${themeConfig?.theme?.author || 'WP Rig'}\n */\nif (!defined('ABSPATH')) { exit; }\nadd_action('init', function() {\n  register_block_type(__DIR__ . '/block');\n});\n`;
	const pluginBlockDir = path.join(pluginDir, 'block');
	await fse.ensureDir(pluginBlockDir);
	// Copy block directory contents except build? Keep build in case
	await fse.copy(dir, pluginBlockDir, { overwrite: true });
	await fse.writeFile(path.join(pluginDir, `${slug}.php`), pluginPhp);
	console.log(
		`Promoted block to plugin at ${path.relative(root, pluginDir)}. Activate it from Plugins after moving to wp-content/plugins if needed.`
	);
}

program
	.name('wprig-blocks')
	.description('WP Rig theme-scoped blocks CLI')
	.version('0.1.0');

program
	.command('block:new')
	.argument('<name>', 'Block name <namespace>/<slug> or <slug>')
	.option('--title <title>', 'Human title')
	.option('-d, --dynamic', 'Create dynamic block with render.php')
	.option('--ts', 'Use TypeScript template')
	.option('--category <category>', 'Block category', 'widgets')
	.option('--icon <icon>', 'Dashicon or SVG')
	.option('--description <description>', 'Block description')
	.option('--keywords <csv>', 'Comma-separated keywords')
	.option('--no-style', 'Do not generate style.css or wire style')
	.option(
		'--no-editor-style',
		'Do not generate editor.css or wire editorStyle'
	)
	.option(
		'--view',
		'Generate separate frontend script loaded on frontend only'
	)
	.action((name, opts) => {
		cmdNew(name, opts).catch((e) => {
			console.error(e?.message || e);
			process.exitCode = 1;
		});
	});

program.command('block:list').action(() => {
	try {
		listBlocks();
	} catch (e) {
		console.error(e?.message || e);
		process.exitCode = 1;
	}
});

program
	.command('block:remove')
	.argument('<name>', 'Block name <namespace>/<slug> or <slug>')
	.action((name) => {
		removeBlock(name).catch((e) => {
			console.error(e?.message || e);
			process.exitCode = 1;
		});
	});

program
	.command('block:promote-plugin')
	.argument('<name>', 'Block name <namespace>/<slug> or <slug>')
	.action((name) => {
		promotePlugin(name).catch((e) => {
			console.error(e?.message || e);
			process.exitCode = 1;
		});
	});

program.parse(process.argv);
