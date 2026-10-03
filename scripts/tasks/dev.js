import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import chokidar from 'chokidar';
import { cleanCSS, cleanJS } from './clean.js';
import { images, convertToModernFormats } from './images.js';
import { serve, server } from './browserSync.js';
import { paths } from '../lib/constants.js';
import {
	runTask,
	lintCSS,
	lintJS,
	buildCSS,
	buildJS,
	buildBlocks,
} from '../lib/cli-utils.js';

/**
 * Runs the development server and watchers.
 *
 * @param {Object}  options      Dev options
 * @param {boolean} options.lint Run linters before starting
 */
export default async function runDev( options = {} ) {
	// Clean CSS/JS first
	await Promise.all( [
		runTask( cleanCSS, 'cleanCSS' ),
		runTask( cleanJS, 'cleanJS' ),
	] );

	// Optional linting
	if ( options.lint ) {
		await Promise.all( [ lintCSS(), lintJS() ] );
	}

	// Helper to check if any blocks exist with a src directory
	const hasBlocks = () => {
		if ( ! fs.existsSync( paths.blocks.srcDir ) ) {
			return false;
		}
		try {
			const entries = fs.readdirSync( paths.blocks.srcDir, {
				withFileTypes: true,
			} );
			const blockDirs = entries.filter( ( e ) => e.isDirectory() );
			return blockDirs.some( ( d ) =>
				fs.existsSync( path.join( paths.blocks.srcDir, d.name, 'src' ) )
			);
		} catch ( _ ) {
			return false;
		}
	};

	// Initial dev builds
	await Promise.all( [
		buildCSS( { dev: true } ),
		buildJS( { dev: true } ),
		hasBlocks() ? buildBlocks() : Promise.resolve(),
	] );

	let blocksProcess;
	const startBlocksWatcher = () => {
		if ( blocksProcess && ! blocksProcess.killed ) {
			blocksProcess.kill();
		}
		blocksProcess = spawn(
			'node',
			[ 'scripts/build-all-blocks.js', '--watch' ],
			{ stdio: 'inherit', shell: process.platform === 'win32' }
		);
	};

	if ( hasBlocks() ) {
		startBlocksWatcher();
	}

	// Clean up child process on exit
	process.on( 'SIGINT', () => {
		if ( blocksProcess ) {
			blocksProcess.kill();
		}
		process.exit();
	} );
	process.on( 'SIGTERM', () => {
		if ( blocksProcess ) {
			blocksProcess.kill();
		}
		process.exit();
	} );

	// Start BrowserSync server
	await runTask( serve, 'serve' );

	// Helper actions for watchers
	const rebuildJS = async () => {
		try {
			await buildJS( { dev: true } );
			server.reload();
		} catch ( e ) {
			console.error( e?.message || e );
		}
	};
	const rebuildCSS = async () => {
		try {
			await buildCSS( { dev: true } );
			server.reload();
		} catch ( e ) {
			console.error( e?.message || e );
		}
	};
	const processImagesWatcher = async () => {
		try {
			await runTask( images, 'images' );
			await runTask( convertToModernFormats, 'convertToModernFormats' );
			server.reload();
		} catch ( e ) {
			console.error( e?.message || e );
		}
	};
	const reloadOnly = () => server.reload();

	// Set up watchers
	const jsWatcher = chokidar.watch( paths.scripts.srcDir, {
		ignoreInitial: true,
	} );
	jsWatcher.on( 'all', ( event, file ) => {
		if ( file && /\.(js|ts|tsx|json)$/.test( file ) ) {
			rebuildJS();
		}
	} );

	const cssWatcher = chokidar.watch( paths.styles.srcDir, {
		ignoreInitial: true,
	} );
	cssWatcher.on( 'all', ( event, file ) => {
		if ( file && /\.css$/.test( file ) ) {
			rebuildCSS();
		}
	} );

	const phpWatcher = chokidar.watch( paths.php.src, { ignoreInitial: true } );
	phpWatcher.on( 'all', reloadOnly );

	const imageWatcher = chokidar.watch( paths.images.src, {
		ignoreInitial: true,
	} );
	imageWatcher.on( 'all', processImagesWatcher );

	console.log( 'Watching for changes...' );
}
