import gulp from 'gulp';
import shell from 'gulp-shell';
import browserSync from 'browser-sync';
import { exec } from 'child_process';
import generateCert from './gulp/generateCert.js';
import util from 'util';
const execPromise = util.promisify( exec );
import { serve, server } from './gulp/browserSync.js';
import watch from './gulp/watch.js';
import { images, convertToWebP } from './gulp/images.js';
import { cleanCSS, cleanJS } from './gulp/clean.js';
import phpTask from './gulp/php.js'; // Note the import as `phpTask`
import fonts from './gulp/fonts.js';
import prodPrep from './gulp/prodPrep.js';
import prodStringReplace from './gulp/prodStringReplace.js';
import prodCompress from './gulp/prodCompress.js';
import minimist from 'minimist';

// Create browserSync instance
browserSync.create();

// Check if the current environment is development or productions
// eslint-disable-next-line no-undef
const isDev = process.env.npm_lifecycle_event === 'dev';

// Parse command line arguments
// eslint-disable-next-line no-undef
const argv = minimist( process.argv.slice( 2 ) );
const runLint = process.env.npm_config_lint || false;
const runPhpcs = argv.phpcs || false;

// Conditional linting
async function lintTasks() {
	runLint
		? gulp.parallel( lintCSS, lintJS )
		: ( done ) => {
				console.log( 'Skipping linting as --lint flag is not set.' );
				done();
		  };
}

async function buildJS() {
	try {
		const cmd = isDev ? 'npm run dev:js' : 'npm run build:js';
		const { stderr } = await execPromise( cmd );
		if ( stderr ) {
			console.error( stderr );
		}
		server.reload();
	} catch ( err ) {
		console.error( err );
	}
}

function watchJS( done ) {
	gulp.watch( 'assets/js/src/**/*.{js,ts,tsx,json}', buildJS ).on(
		'change',
		server.reload
	);
	done();
}

async function buildCSS() {
	try {
		const cmd = isDev ? 'npm run dev:css' : 'npm run build:css';
		const { stderr } = await execPromise( cmd );
		if ( stderr ) {
			console.error( stderr );
		}
		server.reload();
	} catch ( err ) {
		console.error( err );
	}
}

async function lintCSS( done ) {
	try {
		await shell.task( [ 'node lint-css.js' ] )();
		console.log( 'CSS Linting Completed.' );
	} catch ( err ) {
		console.error( 'CSS Linting Errors:', err.message );
	}
	done();
}

async function lintJS( done ) {
	try {
		await shell.task( [ 'eslint assets/js/src' ] )();
		console.log( 'JavaScript Linting Completed.' );
	} catch ( err ) {
		console.error( 'JavaScript Linting Errors:', err.message );
	}
	done();
}

function watchCSS( done ) {
	gulp.watch( 'assets/css/src/**/*.css', buildCSS ).on(
		'change',
		server.reload
	);
	done();
}

// Development task with BrowserSync server and file watching
function dev() {
	return gulp.series(
		cleanCSS,
		cleanJS,
		gulp.parallel( buildJS, buildCSS ),
		gulp.parallel( watchJS, watchCSS ),
		serve,
		watch
	)();
}

// Wrap the php task to pass the runPhpcs argument
const php = ( done ) => phpTask( runPhpcs, done );

const build = gulp.series(
	gulp.parallel( cleanCSS, cleanJS ),
	lintTasks, // Add linting tasks here conditionally
	gulp.parallel( buildJS, buildCSS ),
	gulp.parallel( images, convertToWebP, php )
);

// Bundle theme
const bundle = gulp.series(
	prodPrep,
	gulp.parallel( cleanCSS, cleanJS ),
	lintTasks,
	gulp.parallel( buildJS, buildCSS ),
	gulp.parallel( images, convertToWebP, php, fonts ), // Put php process back in later before image
	prodStringReplace,
	prodCompress
);

// Define the 'images' task
gulp.task(
	'images',
	gulp.series(
		( done ) => {
			console.log( 'Optimizing images...' );
			done();
		},
		images,
		convertToWebP,
		( done ) => {
			console.log( 'Images processed' );
			done();
		}
	)
);

// Export tasks using ES Modules syntax
export { dev as default, generateCert, build, bundle };
