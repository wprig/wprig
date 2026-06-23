import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const rootDir = path.join( __dirname, '..', '..' );
const blocksDir = path.join( rootDir, 'assets', 'blocks' );

/**
 * Checks if the theme has blocks.
 *
 * @return {boolean} True if blocks exist.
 */
function hasBlocks() {
	if ( ! fs.existsSync( blocksDir ) ) {
		return false;
	}
	try {
		const entries = fs.readdirSync( blocksDir, { withFileTypes: true } );
		const blockDirs = entries.filter( ( e ) => e.isDirectory() );
		if ( blockDirs.length === 0 ) {
			return false;
		}

		return blockDirs.some( ( d ) =>
			fs.existsSync( path.join( blocksDir, d.name, 'src' ) )
		);
	} catch ( _ ) {
		return false;
	}
}

/**
 * Spawns a process.
 *
 * @param {string} command Command to run
 * @param {Array}  args    Arguments
 * @param {string} label   Process label
 * @return {import('child_process').ChildProcess} The spawned process
 */
function spawnProc( command, args, label ) {
	const proc = spawn( command, args, {
		cwd: rootDir,
		stdio: 'inherit',
		shell: process.platform === 'win32',
	} );
	proc.on( 'exit', ( code, signal ) => {
		if ( signal ) {
			console.log( `[${ label }] exited due to signal ${ signal }` );
		} else {
			console.log( `[${ label }] exited with code ${ code }` );
		}
	} );
	return proc;
}

/**
 * Runs the dynamic start script.
 */
export default function runStart() {
	const runBlocks = hasBlocks();

	if ( runBlocks ) {
		console.log(
			'Blocks detected. Starting dev server and block watcher...'
		);
	} else {
		console.log( 'Starting dev server. Watching for blocks...' );
	}

	// Always start the dev server
	const dev = spawnProc( 'node', [ 'scripts/cli.js', 'dev' ], 'dev' );

	let blocks;
	const startBlocks = () => {
		if ( blocks && ! blocks.killed ) {
			try {
				blocks.kill();
			} catch ( _ ) {
				// ignore
			}
		}
		blocks = spawnProc(
			'node',
			[ 'scripts/build-all-blocks.js', '--watch' ],
			'blocks'
		);
	};

	if ( runBlocks ) {
		startBlocks();
	}

	// Watch for new block directories
	const assetsDir = path.join( rootDir, 'assets' );
	if ( ! fs.existsSync( assetsDir ) ) {
		try {
			fs.mkdirSync( assetsDir, { recursive: true } );
		} catch ( _ ) {
			// ignore
		}
	}

	const watcher = chokidar.watch( assetsDir, {
		ignoreInitial: true,
		depth: 3,
	} );

	watcher.on( 'addDir', ( dirPath ) => {
		const absoluteBlocksDir = path.resolve( blocksDir );
		const absoluteDirPath = path.resolve( dirPath );
		const parentDir = path.dirname( absoluteDirPath );
		const grandParentDir = path.dirname( parentDir );

		const isBlocksDir = absoluteDirPath === absoluteBlocksDir;
		const isBlockDir = parentDir === absoluteBlocksDir;
		const isSrcDir =
			path.basename( absoluteDirPath ) === 'src' &&
			grandParentDir === absoluteBlocksDir;

		if ( isBlocksDir || isBlockDir || isSrcDir ) {
			console.log(
				`Block directory change detected: ${ path.basename(
					dirPath
				) }. Restarting block watcher...`
			);
			startBlocks();
		}
	} );

	function shutdown() {
		watcher.close();

		if ( blocks && ! blocks.killed ) {
			try {
				blocks.kill( 'SIGTERM' );
			} catch ( _ ) {
				// ignore
			}
		}
		if ( dev && ! dev.killed ) {
			try {
				dev.kill( 'SIGTERM' );
			} catch ( _ ) {
				// ignore
			}
		}
	}

	process.on( 'SIGINT', () => {
		shutdown();
		process.exit( 0 );
	} );
	process.on( 'SIGTERM', () => {
		shutdown();
		process.exit( 0 );
	} );

	dev.on( 'exit', () => shutdown() );
}
