import { readFileSync, writeFileSync, readdirSync } from 'fs';
import path from 'path';
import { transform } from '@parcel/css'; // Assuming you meant LightningCSS, replace with actual package

// Determine if running in development mode
const isDev = process.argv.includes('--dev');

// Directory paths
const srcDir = path.join(path.resolve(), 'assets/css/src');
const editorSrcDir = path.join(path.resolve(), 'assets/css/src/editor');
const outDir = path.join(path.resolve(), 'assets/css');
const editorOutDir = path.join(path.resolve(), 'assets/css/editor');

// Read the contents of _custom-media.css
const customMediaCSS = readFileSync(path.resolve(srcDir, '_custom-media.css'), 'utf8');

// Function to recursively inline @import statements and move them to the top
function inlineImports(filePath, seenFiles = new Set()) {
	if (seenFiles.has(filePath)) {
		return ''; // Handle circular imports by skipping already processed files
	}
	seenFiles.add(filePath);

	const css = readFileSync(filePath, 'utf8');
	const dir = path.dirname(filePath);

	let inlinedCSS = '';
	let imports = '';

	css.replace(/@import\s+["']([^"']+)["'];/g, (match, importPath) => {
		const fullPath = path.resolve(dir, importPath);
		const importCSS = inlineImports(fullPath, seenFiles);
		imports += importCSS;
		return '';
	});

	inlinedCSS = imports + css.replace(/@import\s+["']([^"']+)["'];/g, '');

	return inlinedCSS;
}

// Function to process CSS files
function processCSSFile(filePath, outputPath) {
	let inlinedCSS = inlineImports(filePath);

	// Prepend the custom media CSS
	inlinedCSS = customMediaCSS + inlinedCSS;

	const result = transform({
		filename: filePath,
		code: Buffer.from(inlinedCSS),
		minify: !isDev,
		sourceMap: isDev,
		targets: {
			// Example: Adjust to fit your target environments
			browsers: ['>0.2%', 'not dead', 'not op_mini all'],
		},
		drafts: {
			customMedia: true,
		},
	});

	writeFileSync(outputPath, result.code);
	if (result.map) {
		writeFileSync(`${outputPath}.map`, result.map);
	}
}

// Read all files in the source CSS directory
const files = readdirSync(srcDir);
files.forEach(file => {
	if (!file.startsWith('_') && file.endsWith('.css')) {
		const filePath = path.join(srcDir, file);
		const outputFileName = file.replace('.css', '.min.css');
		const outputPath = path.join(outDir, outputFileName);
		processCSSFile(filePath, outputPath);
	}
});

// Editor files
const editorFiles = readdirSync(editorSrcDir);
editorFiles.forEach(file => {
	if (!file.startsWith('_') && file.endsWith('.css')) {
		const filePath = path.join(editorSrcDir, file);
		const outputFileName = file.replace('.css', '.min.css');
		const outputPath = path.join(editorOutDir, outputFileName);
		processCSSFile(filePath, outputPath);
	}
});
