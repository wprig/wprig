import { readFileSync, writeFileSync, readdirSync } from "fs";
import path from 'path';
import { transform } from '@parcel/css';

// Determine if running in development mode
const isDev = process.argv.includes('--dev');

// Directory paths
const srcDir = path.join(path.resolve(), 'assets/css/src');
const outDir = path.join(path.resolve(), 'assets/css');

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
	const inlinedCSS = inlineImports(filePath);

	const result = transform({
		filename: filePath,
		code: Buffer.from(inlinedCSS),
		minify: !isDev,
		sourceMap: isDev,
		targets: {
			// Example: Adjust to fit your target environments
			browsers: ['>0.2%', 'not dead', 'not op_mini all']
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
