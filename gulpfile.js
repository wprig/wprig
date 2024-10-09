import { src, dest, parallel, series, watch } from 'gulp';
import imagemin from 'gulp-imagemin';
import browserSync from 'browser-sync';
import { exec } from 'child_process';
import util from 'util';
import { paths } from './gulp/constants.js';

// Promisify exec to use with async/await
const execPromise = util.promisify(exec);

// BrowserSync instance
const server = browserSync.create();

// Clean CSS and JS tasks (implement appropriate logic)
async function cleanCSS() { /* Clean CSS logic */ }
async function cleanJS() { /* Clean JS logic */ }

// JavaScript build with Esbuild
async function buildJS() {
	try {
		const { stdout, stderr } = await execPromise('npm run build:js');
		console.log(stdout);
		if (stderr) console.error(stderr);
	} catch (err) {
		console.error(err);
	}
}

// CSS build with LightningCSS
async function buildCSS() {
	try {
		const { stdout, stderr } = await execPromise('npm run build:css');
		console.log(stdout);
		if (stderr) console.error(stderr);
	} catch (err) {
		console.error(err);
	}
}

// Optimize images
function images() {
	return src(paths.images.src)
		.pipe(imagemin())
		.pipe(dest(paths.images.dest));
}

// Watch files for changes
function watchFiles() {
	watch('src/js/**/*.js', buildJS);
	watch('src/styles/**/*.css', buildCSS);
	watch('src/images/**/*', images);
	watch(['dist/js/**/*.js', 'dist/css/**/*.css']).on('change', server.reload);
}

// Serve with BrowserSync
function serve() {
	server.init({
		server: {
			baseDir: './'
		}
	});
	watchFiles();
}

// Default task
const build = series(cleanCSS, cleanJS, parallel(buildCSS, buildJS, images), serve);

export {
	cleanCSS,
	cleanJS,
	buildCSS,
	buildJS,
	images,
	serve,
};

export default build;
