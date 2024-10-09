import esbuild from 'esbuild';
import { readdirSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

// Determine if running in development mode
const isDev = process.argv.includes('--dev');

// Directory paths
const srcDir = path.join(path.resolve(), 'assets/js/src');
const outDir = path.join(path.resolve(), 'assets/js');

// Ensure output directory exists
if (!existsSync(outDir)) {
	mkdirSync(outDir, { recursive: true });
}

// Read all files in the source JS directory
const files = readdirSync(srcDir);
files.forEach(file => {
	if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx')) {
		const filePath = path.join(srcDir, file);
		const outputFileName = file.replace(/\.(js|ts|tsx)$/, '.min.js');
		const outputPath = path.join(outDir, outputFileName);

		esbuild.build({
			entryPoints: [filePath],
			outfile: outputPath,
			minify: !isDev,
			sourcemap: isDev,
			bundle: true,
			target: ['es6'], // Adjust based on your target environments
			loader: {
				'.js': 'jsx',
				'.ts': 'ts',
				'.tsx': 'tsx',
			},
		}).catch(() => process.exit(1));
	}
});
