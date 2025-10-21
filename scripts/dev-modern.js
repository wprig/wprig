#!/usr/bin/env node
/* eslint-env node */
'use strict';

// ESM script (theme package.json has "type": "module")
import fs from 'fs';
import { readdirSync, existsSync, mkdirSync, statSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import https from 'https';
import esbuild from 'esbuild';
import chokidar from 'chokidar';
import livereload from 'tiny-lr';
import { spawn, exec } from 'node:child_process';

// Theme utilities
import config from '../config/themeConfig.js';
import { paths, rootPath } from './lib/constants.js';
import { replaceInlineJS } from './lib/utils.js';

const __filename = fileURLToPath( import.meta.url );

// Debug/verbose mode
const DEBUG =
	process.env.WPRIG_DEBUG === '1' || process.argv.includes( '--debug' );

// Global error handlers to surface stack traces instead of silent exits
process.on( 'unhandledRejection', ( reason, promise ) => {
	// eslint-disable-next-line no-console
	console.error(
		'[wprig] Unhandled promise rejection:',
		reason?.stack || reason
	);
	// Don't kill immediately; set exit code so CI can detect failure while keeping server alive for inspection
	process.exitCode = 1;
} );
process.on( 'uncaughtException', ( err ) => {
	// eslint-disable-next-line no-console
	console.error( '[wprig] Uncaught exception:', err?.stack || err );
	process.exitCode = 1;
} );

// 1) Resolve config (already merged: default -> config.json -> config.local.json)
const bs = config?.dev?.browserSync || {};
const LIVE = bs.live !== false; // default true
const TARGET_HTTPS = !! bs.https;
const DEV_PORT = Number( bs.devPort || 3000 );
const PROXY_TARGET = `http${ TARGET_HTTPS ? 's' : '' }://${
	bs.proxyURL || 'wprig.test'
}`;
const THEME_SLUG = config?.theme?.slug || 'wp-rig';

if ( DEBUG ) {
	console.log( '[wprig] Debug config:', {
		theme: THEME_SLUG,
		proxyTarget: PROXY_TARGET,
		httpsRequested: TARGET_HTTPS,
		devPort: DEV_PORT,
		lrPort: 35729,
		assetsDir: paths?.assetsDir,
		jsSrc: paths?.scripts?.srcDir,
		jsOut: paths?.scripts?.dest,
		cssSrc: [ paths?.styles?.srcDir, paths?.styles?.editorSrcDir ].filter(
			Boolean
		),
	} );
}

if ( ! LIVE ) {
	// Opt-in only; respect legacy flow when disabled
	console.log(
		'[wprig] Modern dev server disabled via config.dev.browserSync.live=false'
	);
	console.log( '[wprig] Use: npm run dev (legacy)' );
	process.exit( 0 );
}

// 2) Start Livereload server (TinyLR) on standard port
const LR_PORT = 35729;
const lrServer = livereload();
lrServer.on( 'error', ( err ) => {
	console.error( '[wprig] LiveReload server error:', err?.stack || err );
} );
lrServer.listen( LR_PORT, () => {
	console.log( `🔌 LiveReload listening on http://localhost:${ LR_PORT }` );
	if ( DEBUG ) {
		console.log(
			`[wprig] Debug mode ON (Node ${ process.version }, esbuild ${
				esbuild.version || 'unknown'
			})`
		);
	}
} );

// Utility: notify livereload clients
function lrChanged( files ) {
	try {
		lrServer.changed( {
			body: { files: Array.isArray( files ) ? files : [ files ] },
		} );
	} catch ( e ) {
		// noop
	}
}

// 3) Build/watch theme JS via esbuild (fast incremental rebuilds)
// Discover all JS/TS entries under assets/js/src (mirrors build-js.js behavior)

const srcDir = paths.scripts.srcDir; // assets/js/src
const outDir = paths.scripts.dest; // assets/js

if ( ! existsSync( outDir ) ) {
	mkdirSync( outDir, { recursive: true } );
}

const SUPPORTED_EXT = [ '.js', '.jsx', '.ts', '.tsx' ];
function getAllFiles( dir ) {
	const files = readdirSync( dir );
	let out = [];
	for ( const f of files ) {
		const fp = path.join( dir, f );
		const st = statSync( fp );
		if ( st.isDirectory() ) {
			out = out.concat( getAllFiles( fp ) );
		} else if ( SUPPORTED_EXT.includes( path.extname( f ) ) ) {
			out.push( fp );
		}
	}
	return out;
}

// Plugins to mirror build-js.js behavior
const replaceInlineJSPlugin = {
	name: 'replaceInlineJS',
	setup( build ) {
		build.onLoad( { filter: /\.(js|jsx|ts|tsx)$/ }, async ( args ) => {
			const filePath = args.path;
			const sourceCode = readFileSync( filePath, 'utf8' );
			const transformedCode = replaceInlineJS( sourceCode );
			let ext = path.extname( filePath ).slice( 1 );
			if ( ext === 'js' ) {
				ext = 'jsx';
			}
			return { contents: transformedCode, loader: ext };
		} );
	},
};

const stripI18nSourceMapPlugin = {
	name: 'stripI18nSourceMap',
	setup( build ) {
		const filter = /@wordpress[\/\\]i18n[\/\\]build-module[\/\\]index\.js$/;
		build.onLoad( { filter }, ( args ) => {
			const code = readFileSync( args.path, 'utf8' ).replace(
				/\/\/\s*#\s*sourceMappingURL=.*$/gm,
				''
			);
			return { contents: code, loader: 'js' };
		} );
	},
};

// Notify LiveReload on successful JS build/rebuilds via esbuild plugin API
const notifyRebuildPlugin = {
	name: 'notify-rebuild',
	setup( build ) {
		build.onEnd( ( result ) => {
			if (
				result &&
				Array.isArray( result.errors ) &&
				result.errors.length
			) {
				const msgs = result.errors.map( ( e ) =>
					e && e.text ? e.text : String( e )
				);
				console.error( '✖ JS rebuild failed:', msgs.join( '\n' ) );
			} else {
				// Trigger immediate full reload (JS extension ensures non-CSS reload)
				lrChanged( '/__wprig_reload__.js' );
				console.log( '✔ JS rebuilt' );
			}
		} );
	},
};

const jsEntries = existsSync( srcDir ) ? getAllFiles( srcDir ) : [];
if ( jsEntries.length ) {
	const contexts = [];
	( async () => {
		for ( const file of jsEntries ) {
			const rel = path.relative( srcDir, file );
			const outfile = path.join(
				outDir,
				rel.replace( /\.(js|jsx|ts|tsx)$/i, '.min.js' )
			);
			const outdir = path.dirname( outfile );
			if ( ! existsSync( outdir ) ) {
				mkdirSync( outdir, { recursive: true } );
			}

			const ctx = await esbuild.context( {
				entryPoints: [ file ],
				outfile,
				minify: false,
				sourcemap: 'inline',
				bundle: true,
				target: [ 'es6' ],
				loader: {
					'.js': 'jsx',
					'.jsx': 'jsx',
					'.ts': 'ts',
					'.tsx': 'tsx',
				},
				plugins: [
					stripI18nSourceMapPlugin,
					replaceInlineJSPlugin,
					notifyRebuildPlugin,
				],
				external: [
					'@wordpress/*',
					'react',
					'react-dom',
					'react-dom/client',
				],
			} );

			await ctx.watch();
			contexts.push( ctx );
		}
		console.log( '🔄 Watching JS in', srcDir );
	} )().catch( ( err ) => {
		console.error(
			'[wprig] Failed to initialize JS watcher:',
			err?.stack || err
		);
		// Keep server running for debugging; set exit code for CI visibility
		process.exitCode = 1;
	} );
} else {
	console.log( 'ℹ️ No JS entries found in', srcDir );
}

// 4) CSS: run one build at startup and watch source to rebuild using existing script
// We reuse build-css.js for correctness; chokidar triggers rebuilds on change
const cssSrcDirs = [ paths.styles.srcDir, paths.styles.editorSrcDir ].filter(
	Boolean
);
const cssBuildScript = path.join( rootPath, 'build-css.js' );
function runCssBuild() {
	if ( ! fs.existsSync( cssBuildScript ) ) {
		return;
	}
	const proc = process.platform === 'win32' ? 'node.exe' : 'node';
	const cp = spawn( proc, [ cssBuildScript, '--dev' ], {
		cwd: rootPath,
		stdio: 'inherit',
		env: { ...process.env },
	} );
	cp.on( 'exit', ( code ) => {
		if ( code === 0 ) {
			lrChanged( [ '/assets/css/**' ] );
			console.log( '✔ CSS rebuilt' );
		} else {
			console.error( '✖ CSS build failed' );
		}
	} );
}

// Kick off initial CSS build (non-blocking)
runCssBuild();

// Watch CSS sources to rebuild
if ( cssSrcDirs.length ) {
	chokidar
		.watch(
			cssSrcDirs.map( ( d ) => path.join( d, '**/*.css' ) ),
			{
				ignoreInitial: true,
			}
		)
		.on( 'change', () => runCssBuild() );
	console.log( '🔄 Watching CSS in', cssSrcDirs.join( ', ' ) );
}

// 5) Watch PHP templates to trigger a soft reload
const phpGlobs = paths.php?.src || [ path.join( rootPath, '**/*.php' ) ];
chokidar.watch( phpGlobs, { ignoreInitial: true } ).on( 'change', ( p ) => {
	console.log( '🧩 PHP changed:', path.relative( rootPath, p ) );
	lrChanged( [ p ] );
} );

console.log( '[wprig] Initializing proxy middleware to ' + PROXY_TARGET );

// 6) Dev proxy server to target local WP site
// Serve theme assets directly from the filesystem for instant freshness. All else is proxied.
function tryServeThemeAsset( req, res ) {
	// Map /wp-content/themes/<slug>/assets/... -> <root>/assets/...
	const prefix = `/wp-content/themes/${ THEME_SLUG }/assets/`;
	if ( ! req.url.startsWith( prefix ) ) {
		return false;
	}
	const rel = req.url.slice( prefix.length );
	// Normalize and prevent path traversal
	const safeRel = rel.replace( /\\/g, '/' ).replace( /\.\.+/g, '' );
	const abs = path.join( rootPath, 'assets', safeRel );
	if ( fs.existsSync( abs ) && fs.statSync( abs ).isFile() ) {
		const stream = fs.createReadStream( abs );
		// Basic content-type handling
		if ( abs.endsWith( '.js' ) ) {
			res.setHeader( 'Content-Type', 'application/javascript' );
		} else if ( abs.endsWith( '.css' ) ) {
			res.setHeader( 'Content-Type', 'text/css' );
		} else if ( abs.endsWith( '.map' ) ) {
			res.setHeader( 'Content-Type', 'application/json' );
		}
		stream.pipe( res );
		return true;
	}
	return false;
}

// Manual proxy configuration using core http/https
const backendUrl = new URL( PROXY_TARGET );
const backendIsHttps = backendUrl.protocol === 'https:';
const backendAgent = backendIsHttps
	? new https.Agent( { rejectUnauthorized: false } ) // tolerate self-signed certs in local envs
	: undefined;

function setDevCookieHeader( res ) {
	try {
		const existing = res.getHeader( 'Set-Cookie' );
		const cookie = 'wprig_dev=1; Path=/; SameSite=Lax; Max-Age=3600';
		if ( Array.isArray( existing ) ) {
			res.setHeader( 'Set-Cookie', [ ...existing, cookie ] );
		} else if ( typeof existing === 'string' && existing.length ) {
			res.setHeader( 'Set-Cookie', [ existing, cookie ] );
		} else {
			res.setHeader( 'Set-Cookie', cookie );
		}
	} catch ( e ) {
		if ( DEBUG ) {
			console.warn(
				'[wprig] Could not set cookie header:',
				e?.message || e
			);
		}
	}
}

function forwardToBackend( req, res ) {
	const requestHeaders = { ...req.headers };
	// Ensure Host header matches backend
	requestHeaders.host = backendUrl.host;
	// Inject dev header for PHP detection
	requestHeaders[ 'x-wprig-dev' ] = '1';
	if ( DEBUG ) {
		requestHeaders[ 'x-wprig-dev-trace' ] = '1';
	}
	// Forwarded headers for awareness
	requestHeaders[ 'x-forwarded-host' ] =
		requestHeaders[ 'x-forwarded-host' ] || `localhost:${ DEV_PORT }`;
	requestHeaders[ 'x-forwarded-proto' ] =
		requestHeaders[ 'x-forwarded-proto' ] ||
		( useHttps ? 'https' : 'http' );

	const options = {
		protocol: backendUrl.protocol,
		hostname: backendUrl.hostname,
		port: backendUrl.port || ( backendIsHttps ? 443 : 80 ),
		path: req.url,
		method: req.method,
		headers: requestHeaders,
		agent: backendAgent,
	};

	const client = ( backendIsHttps ? https : http ).request(
		options,
		( backendRes ) => {
			// Copy headers and inject the cookie fallback
			for ( const [ key, value ] of Object.entries(
				backendRes.headers
			) ) {
				if ( value !== undefined ) {
					res.setHeader( key, value );
				}
			}
			setDevCookieHeader( res );
			res.writeHead( backendRes.statusCode || 502 );
			backendRes.pipe( res );
		}
	);

	client.on( 'error', ( err ) => {
		const code = err && err.code ? err.code : 'UNKNOWN';
		const msg = err && err.message ? err.message : String( err );
		console.error(
			'[wprig] Proxy error:',
			code,
			msg,
			'\n',
			err?.stack || ''
		);
		try {
			if ( ! res.headersSent ) {
				res.writeHead( 502, { 'Content-Type': 'text/plain' } );
			}
			res.end(
				`Proxy error to ${ PROXY_TARGET } (code: ${ code }): ${ msg }\nTip: set WPRIG_DEBUG=1 for verbose logs.`
			);
		} catch {}
		process.exitCode = 1;
	} );

	req.pipe( client );
}

const serverOptions = {};
let useHttps = false;
if ( TARGET_HTTPS ) {
	try {
		if (
			bs.keyPath &&
			bs.certPath &&
			fs.existsSync( bs.keyPath ) &&
			fs.existsSync( bs.certPath )
		) {
			serverOptions.key = fs.readFileSync( bs.keyPath );
			serverOptions.cert = fs.readFileSync( bs.certPath );
			useHttps = true;
		} else {
			console.warn(
				'[wprig] HTTPS requested but key/cert missing. Falling back to HTTP.'
			);
		}
	} catch {
		console.warn(
			'[wprig] HTTPS key/cert could not be read. Falling back to HTTP.'
		);
	}
}

const server = ( useHttps ? https : http ).createServer(
	serverOptions,
	( req, res ) => {
		console.log(
			'[wprig] Incoming request: ' + req.method + ' ' + req.url
		);

		// Short-circuit theme assets
		if ( tryServeThemeAsset( req, res ) ) {
			console.log( '[wprig] Served theme asset directly: ' + req.url );
			return;
		}

		// Otherwise proxy to WP using manual forwarder
		if ( DEBUG ) {
			console.log(
				'[wprig] → forward',
				req.method,
				req.url,
				'to',
				PROXY_TARGET
			);
		}
		forwardToBackend( req, res );
	}
);

// Server-level diagnostics
server.on( 'error', ( err ) => {
	console.error( '[wprig] Server error:', err?.stack || err );
	process.exitCode = 1;
} );
server.on( 'clientError', ( err, socket ) => {
	try {
		socket.end( 'HTTP/1.1 400 Bad Request\r\n\r\n' );
	} catch {}
	console.error( '[wprig] Client error:', err?.stack || err );
} );
// Forward websocket upgrades to proxy (if supported)
server.on( 'upgrade', ( req, socket ) => {
	try {
		// No WS proxying needed for LiveReload (browser connects to :35729 directly)
		socket.write( 'HTTP/1.1 501 Not Implemented\r\n\r\n' );
		socket.destroy();
	} catch ( err ) {
		console.error( '[wprig] WS upgrade error:', err?.stack || err );
	}
} );

server.listen( DEV_PORT, () => {
	const scheme = useHttps ? 'https' : 'http';
	console.log(
		`🚀 Modern Dev Server running at ${ scheme }://localhost:${ DEV_PORT }`
	);
	console.log( `↪︎ Proxying to ${ PROXY_TARGET }` );
	console.log( '💡 Tip: Keep your browser on the localhost URL above.' );
	openBrowser();
} );

// Auto-open browser on startup for improved DX (cross-platform)
function openBrowser() {
	try {
		const scheme = useHttps ? 'https' : 'http';
		const url = `${ scheme }://localhost:${ DEV_PORT }`;
		let command;
		switch ( process.platform ) {
			case 'darwin':
				command = `open "${ url }"`;
				break;
			case 'win32':
				// Use Windows 'start' via cmd shell (exec uses cmd.exe by default)
				command = `start "" "${ url }"`;
				break;
			default:
				command = `xdg-open "${ url }"`;
		}
		exec( command, ( err ) => {
			if ( err ) {
				console.warn( `[wprig] Auto-open failed (visit: ${ url })` );
			} else {
				console.log( `Opened browser at ${ url }` );
			}
		} );
	} catch ( e ) {
		const scheme = useHttps ? 'https' : 'http';
		const fallbackUrl = `${ scheme }://localhost:${ DEV_PORT }`;
		console.warn( `[wprig] Auto-open error (visit: ${ fallbackUrl })` );
	}
}
