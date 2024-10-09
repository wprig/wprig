import gulp from 'gulp';
import browserSync from 'browser-sync';
import { exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);

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
	} catch (err) {
		console.error(err);
	}
}

function watchJS(done) {
	gulp.watch('assets/js/src/**/*.{js,ts,tsx}', buildJS).on('change', bs.reload);
	done();
}

async function buildCSS() {
	try {
		const cmd = isDev ? 'npm run dev:css' : 'npm run build:css';
		const { stdout, stderr } = await execPromise(cmd);
		console.log(stdout);
		if (stderr) console.error(stderr);
	} catch (err) {
		console.error(err);
	}
}

function watchCSS(done) {
	gulp.watch('assets/css/src/**/*.css', buildCSS).on('change', bs.reload);
	done();
}

// Placeholder build functions for other processes
function buildPHP() {
	return new Promise((resolve) => {
		// Add PHP build logic if any, otherwise just resolve
		resolve();
	});
}

function buildImages() {
	return new Promise((resolve) => {
		// Add Images build logic if any, otherwise just resolve
		resolve();
	});
}

// Placeholder functions for other watch tasks (retain original existing tasks)
function watchPHP() {
	gulp.watch('**/*.php').on('change', bs.reload);
}

function watchImages() {
	gulp.watch('assets/images/**/*').on('change', bs.reload);
}

// Development task with BrowserSync server and file watching
function dev() {
	bs.init({
		proxy: 'your-local-site-url' // Adjust your local server URL
	});

	gulp.series(
		gulp.parallel(buildJS, buildCSS, buildPHP, buildImages),
		gulp.parallel(watchJS, watchCSS, watchPHP, watchImages)
	)();
}

// Build task without file watching
const build = gulp.series(
	gulp.parallel(buildJS, buildCSS, buildPHP, buildImages) // Include all build tasks
);

// Export tasks using ES Modules syntax
export { dev as default, build };
