import gulp, {parallel, series} from 'gulp';
import browserSync from 'browser-sync';
import { exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);
import {serve, server, reload} from './gulp/browserSync.js';
import watch from './gulp/watch.js';
import php from "./gulp/php.js";
import { images, convertToWebP } from "./gulp/images.js";
import {cleanCSS, cleanJS} from "./gulp/clean.js";

// Create browserSync instance
const bs = browserSync.create();

// Check if the current environment is development or production
const isDev = process.env.NODE_ENV === 'development';

async function buildJS() {
	try {
		const cmd = isDev ? 'npm run dev:js' : 'npm run build:js';
		const { stdout, stderr } = await execPromise(cmd);
		console.log(stdout);
		if (stderr) console.error(stderr);
		server.reload();
	} catch (err) {
		console.error(err);
	}
}

function watchJS(done) {
	gulp.watch('assets/js/src/**/*.{js,ts,tsx}', buildJS).on('change', server.reload);
	done();
}

async function buildCSS() {
	try {
		const cmd = isDev ? 'npm run dev:css' : 'npm run build:css';
		const { stdout, stderr } = await execPromise(cmd);
		console.log(stdout);
		if (stderr) console.error(stderr);
		server.reload();
	} catch (err) {
		console.error(err);
	}
}

function watchCSS(done) {
	gulp.watch('assets/css/src/**/*.css', buildCSS).on('change', server.reload);
	done();
}

// Placeholder build functions for other processes
function buildPHP() {
	return new Promise((resolve) => {
		// Add PHP build logic if any, otherwise just resolve
		resolve();
	});
}

// Placeholder functions for other watch tasks (retain original existing tasks)
function watchPHP() {
	gulp.watch('**/*.php').on('change', server.reload);
}

function watchImages() {
	gulp.watch('assets/images/**/*').on('change', server.reload);
}

// Development task with BrowserSync server and file watching
function dev() {

	gulp.series(
		cleanCSS,
		cleanJS,
		gulp.parallel(buildJS, buildCSS),
		//gulp.parallel( images, webp ), // Put php process back in later before image
		gulp.parallel(watchJS, watchCSS),
		serve, watch
	)();
}

// Build task without file watching
const build = gulp.series(
	gulp.parallel(buildJS, buildCSS, buildPHP) // Include all build tasks
);

// Define the 'images' task
gulp.task('images', gulp.series(
	(done) => {
		console.log('Optimizing images...');
		done();
	},
	gulp.parallel(images, convertToWebP),
	(done) => {
		console.log('Images processed');
		done();
	}
));

// Export tasks using ES Modules syntax
export { dev as default, build };
