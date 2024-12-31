import {
	readFileSync,
	writeFileSync,
	readdirSync,
	existsSync,
	mkdirSync,
	statSync,
} from 'fs';
import path from 'path';
import { transform } from '@parcel/css'; // Use LightningCSS or the package you intended to use
import { paths } from './gulp/constants.js';
import { replaceInlineCSS } from './gulp/utils.js';
// Determine if running in development mode
const isDev = process.argv.includes('--dev');

// Ensure output directories exist
const ensureDirectoryExistence = (dir) => {
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}
};

ensureDirectoryExistence(paths.styles.dest);
ensureDirectoryExistence(paths.styles.editorDest);

// Read the contents of _custom-media.css
const customMediaCSS = readFileSync(
	path.resolve(paths.styles.srcDir, '_custom-media.css'),
	'utf8'
);

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

// Recursive function to find all files
const getAllFiles = (dir) => {
	const files = readdirSync(dir);
	let filelist = [];
	files.forEach((file) => {
		const filePath = path.join(dir, file);
		const fileStat = statSync(filePath);
		if (fileStat.isDirectory()) {
			filelist = filelist.concat(getAllFiles(filePath));
		} else if (file.endsWith('.css') && !file.startsWith('_')) {
			filelist.push(filePath);
		}
	});
	return filelist;
};

// Process CSS files recursively
const processCSSFile = (filePath, outputPath) => {
	let inlinedCSS = inlineImports(filePath);

	// Prepend the custom media CSS
	inlinedCSS = customMediaCSS + inlinedCSS;
	inlinedCSS = replaceInlineCSS(inlinedCSS);
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
};

// Function to process all CSS files in a directory
const processDirectory = (dir, destDir) => {
	const files = getAllFiles(dir);
	files.forEach((file) => {
		const relativePath = path.relative(dir, file);
		const outputPath = path.join(
			destDir,
			relativePath.replace('.css', '.min.css')
		);
		const outputDir = path.dirname(outputPath);
		ensureDirectoryExistence(outputDir);
		processCSSFile(file, outputPath);
	});
};

// Process main CSS directory
processDirectory(paths.styles.srcDir, paths.styles.dest);

// Process editor CSS directory
processDirectory(paths.styles.editorSrcDir, paths.styles.editorDest);
