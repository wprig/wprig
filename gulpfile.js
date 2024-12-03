import gulp from 'gulp';
import shell from 'gulp-shell';
import browserSync from 'browser-sync';
import { exec } from 'child_process';
import generateCert from './gulp/generateCert.js';
import util from 'util';
const execPromise = util.promisify(exec);
import { serve, server } from './gulp/browserSync.js';
import watch from './gulp/watch.js';
import { images, convertToWebP } from './gulp/images.js';
import { cleanCSS, cleanJS } from './gulp/clean.js';
import phpTask from './gulp/php.js';  // Note the import as `phpTask`
import fonts from './gulp/fonts.js';
import prodPrep from './gulp/prodPrep.js';
import prodStringReplace from './gulp/prodStringReplace.js';
import prodCompress from './gulp/prodCompress.js';
import minimist from 'minimist';

// Create browserSync instance
browserSync.create();

// Check if the current environment is development or production
// eslint-disable-next-line no-undef
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
	gulp.watch('assets/js/src/**/*.{js,ts,tsx,json}', buildJS).on('change', server.reload);
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

async function lintCSS(done){
	gulp.task('stylint', shell.task([
		'stylint assets/css/src -c .stylintrc'
	]));
	done();
}

function watchCSS(done) {
	gulp.watch('assets/css/src/**/*.css', buildCSS).on('change', server.reload);
	done();
}

// Development task with BrowserSync server and file watching
function dev() {
	return gulp.series(
		cleanCSS,
		cleanJS,
		gulp.parallel(buildJS, buildCSS),
		gulp.parallel(watchJS, watchCSS),
		serve, watch
	)();
}

// Parse command line arguments
// eslint-disable-next-line no-undef
const argv = minimist(process.argv.slice(2));
const runPhpcs = argv.phpcs || false;

// Wrap the php task to pass the runPhpcs argument
const php = (done) => phpTask(runPhpcs, done);

// Build task without file watching
const build = gulp.series(
	gulp.parallel(cleanCSS, cleanJS),
	gulp.parallel(buildJS, buildCSS, lintCSS),
	gulp.parallel(images, php)
);

// Bundle theme
const bundle = gulp.series(
	prodPrep,
	gulp.parallel(cleanCSS, cleanJS),
	gulp.parallel(buildJS, buildCSS),
	gulp.parallel(images, php, fonts), // Put php process back in later before image
	prodStringReplace, prodCompress
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
export { dev as default, generateCert, build, bundle };
