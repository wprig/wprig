import esbuild from 'esbuild';
import { readdirSync, existsSync, mkdirSync, statSync, readFileSync } from 'fs';
import path from 'path';
import { paths, isProd } from './gulp/constants.js';
import { replaceInlineJS } from './gulp/utils.js';

// Directory paths
const srcDir = paths.scripts.srcDir; // e.g., assets/js/src
const outDir = paths.scripts.dest; // e.g., assets/js

// Ensure the output directory exists
if ( ! existsSync( outDir ) ) {
	mkdirSync( outDir, { recursive: true } );
}

// Supported source extensions we want to process
const SUPPORTED_EXT = [ '.js', '.jsx', '.ts', '.tsx' ];

// Recursively collect all source files with supported extensions
const getAllFiles = ( dir ) => {
	const files = readdirSync( dir );
	let filelist = [];
	files.forEach( ( file ) => {
		const filePath = path.join( dir, file );
		const stats = statSync( filePath );
		if ( stats.isDirectory() ) {
			filelist = filelist.concat( getAllFiles( filePath ) );
		} else if ( SUPPORTED_EXT.includes( path.extname( file ) ) ) {
			filelist.push( filePath );
		}
	} );
	return filelist;
};

// Gather all JavaScript/TypeScript entries for theme scripts
const files = getAllFiles( srcDir );

// Also gather block entry points: assets/blocks/*/src/index.* and optional view.*
const blocksDir = path.join(paths.assetsDir || path.join(process.cwd(), 'assets'), 'blocks');
let blockEntries = [];
try {
	const blockSlugs = readdirSync(blocksDir, { withFileTypes: true }).filter(d=>d.isDirectory()).map(d=>d.name);
	for (const slug of blockSlugs) {
		const base = path.join(blocksDir, slug, 'src');
		for (const baseName of ['index', 'view']) {
			for (const ext of ['js','jsx','ts','tsx']) {
				const p = path.join(base, `${baseName}.${ext}`);
				if (existsSync(p)) blockEntries.push({ slug, baseName, file: p });
			}
		}
	}
} catch(e) {
	// no blocks dir
}

// Plugin to transform code using replaceInlineJS before esbuild processes it
const replaceInlineJSPlugin = {
	name: 'replaceInlineJS',
	setup( build ) {
		build.onLoad( { filter: /\.(js|jsx|ts|tsx)$/ }, async ( args ) => {
			const filePath = args.path;
			const sourceCode = readFileSync( filePath, 'utf8' );
			const transformedCode = replaceInlineJS( sourceCode );

			// Choose the correct loader; treat .js as JSX-capable to allow JSX in .js files
			let ext = path.extname( filePath ).slice( 1 ); // -> js|jsx|ts|tsx
			if ( ext === 'js' ) {
				ext = 'jsx';
			}

			return {
				contents: transformedCode,
				loader: ext,
			};
		} );
	},
};

// Tiny plugin: ignore the broken source map reference in @wordpress/i18n ESM entry
const stripI18nSourceMapPlugin = {
	name: 'stripI18nSourceMap',
	setup( build ) {
		// Cross-platform match for .../@wordpress/i18n/build-module/index.js
		const filter = /@wordpress[\/\\]i18n[\/\\]build-module[\/\\]index\.js$/;
		build.onLoad( { filter }, ( args ) => {
			const code = readFileSync( args.path, 'utf8' )
				// remove any `//# sourceMappingURL=...` so esbuild won't try to parse the broken map
				.replace( /\/\/\s*#\s*sourceMappingURL=.*$/gm, '' );
			return { contents: code, loader: 'js' };
		} );
	},
};

files.forEach((file) => {
	const relativePath = path.relative(srcDir, file);
	const outputPath = path.join(outDir, relativePath.replace(/\.(js|jsx|ts|tsx)$/, '.min.js'));
	const outputDir = path.dirname(outputPath);
	if (!existsSync(outputDir)) {
		mkdirSync(outputDir, { recursive: true });
	}
	esbuild
		.build({
			entryPoints: [file],
			outfile: outputPath,
			minify: true,
			sourcemap: isProd ? false : 'inline',
			bundle: true,
			target: ['es6'],
			loader: { '.js': 'jsx', '.jsx': 'jsx', '.ts': 'ts', '.tsx': 'tsx' },
			plugins: [stripI18nSourceMapPlugin, replaceInlineJSPlugin],
		})
		.catch(() => process.exit(1));
});

// Build blocks: each entry to assets/blocks/<slug>/build/<baseName>.js
blockEntries.forEach(({ slug, baseName, file }) => {
	const outFile = path.join(blocksDir, slug, 'build', `${baseName}.js`);
	const outFolder = path.dirname(outFile);
	if (!existsSync(outFolder)) mkdirSync(outFolder, { recursive: true });
	esbuild
		.build({
			entryPoints: [file],
			outfile: outFile,
			minify: !isProd ? false : true,
			sourcemap: isProd ? false : 'inline',
			bundle: true,
			target: ['es6'],
			loader: { '.js': 'jsx', '.jsx': 'jsx', '.ts': 'ts', '.tsx': 'tsx' },
			plugins: [stripI18nSourceMapPlugin, replaceInlineJSPlugin],
		})
		.catch(() => process.exit(1));
});
