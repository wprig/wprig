import esbuild from 'esbuild';
import { readdirSync, existsSync, mkdirSync, statSync, readFileSync } from 'fs';
import path from 'path';
import { paths, isProd } from './gulp/constants.js';
import { replaceInlineJS } from './gulp/utils.js';

// Directory paths
const srcDir = paths.scripts.srcDir;
const outDir = paths.scripts.dest;

// Ensure output directory exists
if (!existsSync(outDir)) {
	mkdirSync(outDir, { recursive: true });
}

// Recursively find all files in the source JS directory
const getAllFiles = (dir) => {
	const files = readdirSync(dir);
	let filelist = [];
	files.forEach(file => {
		const filePath = path.join(dir, file);
		const fileStat = statSync(filePath);
		if (fileStat.isDirectory()) {
			filelist = filelist.concat(getAllFiles(filePath));
		} else if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx')) {
			filelist.push(filePath);
		}
	});
	return filelist;
};

// Get all JavaScript and TypeScript files
const files = getAllFiles(srcDir);

// Plugin to transform code using replaceInlineJS
const replaceInlineJSPlugin = {
	name: 'replaceInlineJS',
	setup(build) {
		build.onLoad({ filter: /\.(js|ts|tsx)$/ }, async (args) => {
			const filePath = args.path;
			const sourceCode = readFileSync(filePath, 'utf8');
			const transformedCode = replaceInlineJS(sourceCode);
			let loader = path.extname(filePath).slice(1);
			if(loader === 'js'){
				loader = 'jsx';
			}
			return {
				contents: transformedCode,
				loader: loader
			};
		});
	}
};

files.forEach(file => {
	const relativePath = path.relative(srcDir, file);
	const outputPath = path.join(outDir, relativePath.replace(/\.(js|ts|tsx)$/, '.min.js'));
	const outputDir = path.dirname(outputPath);

	if (!existsSync(outputDir)) {
		mkdirSync(outputDir, { recursive: true });
	}

	esbuild.build({
		entryPoints: [file],
		outfile: outputPath,
		minify: true,
		sourcemap: isProd ? false : 'inline',
		bundle: true,
		target: ['es6'], // Adjust based on your target environments
		loader: {
			'.js': 'jsx',
			'.ts': 'ts',
			'.tsx': 'tsx',
		},
		plugins: [replaceInlineJSPlugin]
	}).catch(() => process.exit(1));
});
