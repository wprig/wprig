#!/usr/bin/env node

/**
 * Script to build all blocks in the assets/blocks directory using esbuild directly.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';

// Create a simple imports transformer plugin
const transformImportsPlugin = {
	name: 'transform-imports-plugin',
	setup(build) {
		// Helper function to convert WordPress package names to their global variable format
		const getWpGlobal = (pkg) => {
			if (pkg === 'react') {
				return 'window.React';
			}
			if (pkg === 'react-dom') {
				return 'window.ReactDOM';
			}

			// Handle WordPress packages
			if (pkg.startsWith('@wordpress/')) {
				const packageName = pkg.replace('@wordpress/', '');

				// Handle hyphenated packages
				switch (packageName) {
					case 'server-side-render':
						return 'window.wp.serverSideRender';
					case 'block-editor':
						return 'window.wp.blockEditor';
					case 'html-entities':
						return 'window.wp.htmlEntities';
					default:
						// Convert hyphenated names to camelCase for other packages
						return `window.wp.${packageName.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())}`;
				}
			}

			return `window.wp.${pkg}`; // fallback
		};

		// Match imports of WordPress packages and React
		build.onLoad({ filter: /\.(js|jsx|ts|tsx)$/ }, async (args) => {
			try {
				// Read the file content
				const source = await fs.promises.readFile(args.path, 'utf8');

				console.log('Processing file:', args.path);

				// Replace import statements with global variable assignments
				// 1. Match import { X, Y } from '@wordpress/package'
				let transformedCode = source.replace(
					/import\s+{([^}]+)}\s+from\s+['"](@wordpress\/[^'"]+|react|react-dom)['"]/g,
					(match, imports, pkg) => {
						// Get the correct global variable prefix
						const globalPrefix = getWpGlobal(pkg);
						console.log(`Transforming ${pkg} to ${globalPrefix}`);

						const importLines = imports.split(',').map((item) => {
							const parts = item.trim().split(' as ');
							const importName = parts[0].trim();
							const localName =
								parts.length > 1 ? parts[1].trim() : importName;

							return `const ${localName} = ${globalPrefix}.${importName};`;
						});

						return importLines.join('\n');
					}
				);

				// 2. Match import X from '@wordpress/package'
				transformedCode = transformedCode.replace(
					/import\s+(\w+)\s+from\s+['"](@wordpress\/[^'"]+|react|react-dom)['"]/g,
					(match, importName, pkg) => {
						const globalVar = getWpGlobal(pkg);
						console.log(
							`Transforming default import ${pkg} to ${globalVar}`
						);

						return `const ${importName} = ${globalVar};`;
					}
				);

				// 3. Special case for ServerSideRender which is causing issues
				transformedCode = transformedCode.replace(
					/import\s+ServerSideRender\s+from\s+['"]@wordpress\/server-side-render['"]/g,
					'const ServerSideRender = window.wp.serverSideRender;'
				);

				// Log the transformed code for debugging
				if (
					transformedCode.includes('server-side-render') ||
					transformedCode.includes('ServerSideRender')
				) {
					console.log('Transformed ServerSideRender imports');
				}

				// Make sure React is available in the output
				if (
					transformedCode.includes('React.') ||
					transformedCode.includes('React,')
				) {
					console.log('Adding React availability check');
					transformedCode =
						'const React = window.React;\n' + transformedCode;
				}

				return {
					contents: transformedCode,
					loader:
						path.extname(args.path).substring(1) === 'ts'
							? 'ts'
							: 'jsx',
				};
			} catch (error) {
				return null; // Let esbuild handle it normally
			}
		});
	},
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const blocksDir = path.join(rootDir, 'assets', 'blocks');

// Determine if we're in watch mode
const isWatch = process.argv.includes('--watch');

console.log(`Building blocks using esbuild...`);

try {
	// Get all directories in the blocks folder
	const blockDirs = fs
		.readdirSync(blocksDir, { withFileTypes: true })
		.filter((dirent) => dirent.isDirectory())
		.map((dirent) => dirent.name);

	if (blockDirs.length === 0) {
		console.log('No blocks found in assets/blocks directory.');
		process.exit(0);
	}

	// Build each block
	for (const block of blockDirs) {
		const blockPath = path.join(blocksDir, block);
		const srcDir = path.join(blockPath, 'src');

		// Check if this is a valid block with a src directory
		if (fs.existsSync(srcDir)) {
			console.log(`Building block: ${block}`);

			// Clean previous build to avoid stale artifacts
			const buildPath = path.join(blockPath, 'build');
			console.log(`Cleaning build directory: ${buildPath}`);

			try {
				fs.rmSync(buildPath, { recursive: true, force: true });
			} catch (_) {}

			// Create build directory if it doesn't exist
			if (!fs.existsSync(buildPath)) {
				fs.mkdirSync(buildPath, { recursive: true });
			}

			// Find the entry file (index.js/ts/tsx)
			const entryFiles = [];
			for (const ext of ['.js', '.jsx', '.ts', '.tsx']) {
				const indexFile = path.join(srcDir, `index${ext}`);
				if (fs.existsSync(indexFile)) {
					entryFiles.push({ name: 'index', file: indexFile });
				}

				// Also check for view.js if it exists
				const viewFile = path.join(srcDir, `view${ext}`);
				if (fs.existsSync(viewFile)) {
					entryFiles.push({ name: 'view', file: viewFile });
				}
			}

			if (entryFiles.length === 0) {
				console.log(
					`No entry files found for block ${block}. Skipping.`
				);
				continue;
			}

			for (const { name, file } of entryFiles) {
				const outFile = path.join(buildPath, `${name}.js`);

				// Build the JS
				const buildConfig = {
					entryPoints: [file],
					bundle: true,
					minify: !isWatch,
					outfile: outFile,
					target: 'es2015',
					format: 'iife',
					globalName:
						'WPRigBlock' +
						block.charAt(0).toUpperCase() +
						block.slice(1),
					sourcemap: isWatch ? 'inline' : false,
					jsx: 'transform',
					jsxFactory: 'wp.element.createElement',
					jsxFragment: 'wp.element.Fragment',
					loader: {
						'.js': 'jsx',
						'.jsx': 'jsx',
						'.ts': 'ts',
						'.tsx': 'tsx',
					},
					// Use our simple transformer plugin instead of externals
					plugins: [transformImportsPlugin],
					external: ['react', 'react-dom', '@wordpress/*'],
					// Add a simple banner to ensure globals exist
					banner: {
						js: `
/**
 * ${block} block - built with WP Rig
 */
window.wp = window.wp || {};
window.wp.blockEditor = window.wp.blockEditor || {};
window.wp.blocks = window.wp.blocks || {};
window.wp.components = window.wp.components || {};
window.wp.element = window.wp.element || {};
window.wp.i18n = window.wp.i18n || {};
window.wp.serverSideRender = window.wp.serverSideRender || {};
window.wp.htmlEntities = window.wp.htmlEntities || {
  // Simple decoding function to handle common HTML entities
  decode: function(text) {
    if (!text) return text;
    return String(text)
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'");
  }
};

// Ensure ServerSideRender is available at runtime
if (window.wp.serverSideRender) {
  // Create alias if needed
  window.wp['server-side-render'] = window.wp.serverSideRender;
}
`,
					},
				};

				if (isWatch) {
					// For watch mode, use context API
					const ctx = await esbuild.context(buildConfig);
					await ctx.watch();
					console.log(`Watching ${block}/${name}.js...`);
				} else {
					// One-time build
					await esbuild.build(buildConfig);
					console.log(`Built ${block}/${name}.js`);
				}

				// Generate WordPress asset file
				const assetPhpContent = `<?php
return array(
  'dependencies' => array('wp-blocks', 'wp-element', 'wp-polyfill', 'wp-i18n', 'wp-block-editor', 'wp-components', 'wp-server-side-render'),
  'version' => '${Date.now()}',
);
`;
				fs.writeFileSync(
					path.join(buildPath, `${name}.asset.php`),
					assetPhpContent
				);
			}

			// Copy CSS files if they exist
			for (const cssFile of ['style.css', 'editor.css']) {
				const srcCss = path.join(blockPath, cssFile);
				if (fs.existsSync(srcCss)) {
					fs.copyFileSync(srcCss, path.join(buildPath, cssFile));
					console.log(`Copied ${block}/${cssFile}`);
				}
			}
		}
	}

	if (!isWatch) {
		console.log('All blocks built successfully!');
	} else {
		console.log('Watching for changes in block files...');
	}
} catch (error) {
	console.error('Error building blocks:', error);
	process.exit(1);
}
