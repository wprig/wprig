import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import esbuild from 'esbuild';
import chokidar from 'chokidar';
import livereload from 'tiny-lr';
import config from '../../config/themeConfig.js';
import { paths } from '../lib/constants.js';
import { replaceInlineJS } from '../lib/utils.js';

/**
 * Modern development server with esbuild and live reload.
 */
export default async function runDevModern() {
	const bs = config?.dev?.browserSync || {};
	const LIVE = bs.live !== false;

	if ( ! LIVE ) {
		console.log(
			'[wprig] Modern dev server disabled via config.dev.browserSync.live=false'
		);
		return;
	}

	const TARGET_HTTPS = !! bs.https;
	const DEV_PORT = Number( bs.devPort || 3000 );
	const PROXY_TARGET = `http${ TARGET_HTTPS ? 's' : '' }://${
		bs.proxyURL || 'wprig.test'
	}`;

	const LR_PORT = 35729;
	const lrServer = livereload();
	lrServer.listen( LR_PORT, () => {
		console.log(
			`🔌 LiveReload listening on http://localhost:${ LR_PORT }`
		);
	} );

	function lrChanged( files ) {
		try {
			lrServer.changed( {
				body: { files: Array.isArray( files ) ? files : [ files ] },
			} );
		} catch ( e ) {
			// noop
		}
	}

	const jsSrcDir = paths.scripts.srcDir;
	const jsOutDir = paths.scripts.dest;

	const getAllJsEntries = () => {
		if ( ! fs.existsSync( jsSrcDir ) ) {
			return [];
		}
		return fs
			.readdirSync( jsSrcDir, { recursive: true } )
			.filter(
				( f ) =>
					( f.endsWith( '.js' ) ||
						f.endsWith( '.ts' ) ||
						f.endsWith( '.tsx' ) ) &&
					! path.basename( f ).startsWith( '_' )
			)
			.map( ( f ) => path.join( jsSrcDir, f ) );
	};

	const jsEntries = getAllJsEntries();

	const jsContext = await esbuild.context( {
		entryPoints: jsEntries,
		outdir: jsOutDir,
		bundle: true,
		format: 'esm',
		sourcemap: true,
		loader: { '.js': 'jsx', '.ts': 'tsx' },
		plugins: [
			{
				name: 'wprig-replacements',
				setup( build ) {
					build.onLoad( { filter: /\.js$/ }, async ( args ) => {
						const contents = await fs.promises.readFile(
							args.path,
							'utf8'
						);
						return { contents: replaceInlineJS( contents ) };
					} );
				},
			},
		],
	} );

	await jsContext.watch();
	console.log( 'JS Watcher started via esbuild' );

	const proxy = ( req, res ) => {
		const parsedUrl = new URL( req.url, `http://${ req.headers.host }` );
		const options = {
			hostname: new URL( PROXY_TARGET ).hostname,
			port: new URL( PROXY_TARGET ).port || ( TARGET_HTTPS ? 443 : 80 ),
			path: parsedUrl.pathname + parsedUrl.search,
			method: req.method,
			headers: {
				...req.headers,
				host: new URL( PROXY_TARGET ).host,
			},
			rejectUnauthorized: false,
		};

		const connector = ( TARGET_HTTPS ? https : http ).request(
			options,
			( proxyRes ) => {
				if (
					proxyRes.headers[ 'content-type' ] &&
					proxyRes.headers[ 'content-type' ].includes( 'text/html' )
				) {
					let body = '';
					proxyRes.on( 'data', ( chunk ) => ( body += chunk ) );
					proxyRes.on( 'end', () => {
						const lrScript = `<script src="http://localhost:${ LR_PORT }/livereload.js?snipver=1"></script>`;
						body = body.replace(
							'</body>',
							`${ lrScript }</body>`
						);
						res.writeHead( proxyRes.statusCode, proxyRes.headers );
						res.end( body );
					} );
				} else {
					res.writeHead( proxyRes.statusCode, proxyRes.headers );
					proxyRes.pipe( res );
				}
			}
		);

		req.pipe( connector );
	};

	http.createServer( proxy ).listen( DEV_PORT );
	console.log( `🚀 Dev server at http://localhost:${ DEV_PORT }` );

	const watcher = chokidar.watch( [ paths.styles.dest, paths.php.src ], {
		ignoreInitial: true,
	} );
	watcher.on( 'all', ( event, file ) => {
		lrChanged( file );
	} );
}
