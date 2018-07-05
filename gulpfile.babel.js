/* eslint-env es6 */
'use strict';

/**
 * To start theme building process, define the theme name below,
 * then run "gulp" in command line.
 */

 // External dependencies
 import {src, dest, watch as gulpWatch, parallel, series} from 'gulp';
 import autoprefixer from 'autoprefixer';
 import browserSync from 'browser-sync';
 import log from 'fancy-log';
 import partialImport from 'postcss-partial-import';
 import postcssPresetEnv from 'postcss-preset-env';
 import requireUncached from 'require-uncached';

// Internal dependencies
import {paths, gulpPlugins} from './gulp/constants';

// Import theme-specific configurations.
let config = require('./dev/config/themeConfig.js');
let themeConfig = config.theme;
themeConfig.isFirstRun = true;

/**
 * Conditionally set up BrowserSync.
 * Only run BrowserSync if config.browserSync.live = true.
 */

// Create a BrowserSync instance:
const server = browserSync.create();

// Initialize the BrowserSync server conditionally:
function serve(done) {
	if (config.dev.browserSync.live) {
		server.init({
			proxy: config.dev.browserSync.proxyURL,
			port: config.dev.browserSync.bypassPort,
			liveReload: true
		});
	}
	done();
}

// Reload the live site:
function reload(done) {
	config = requireUncached('./dev/config/themeConfig.js');
	if (config.dev.browserSync.live) {
		if (server.paused) {
			server.resume();
		}
		server.reload();
	} else {
		server.pause();
	}
	done();
}


/**
 * PHP via PHP Code Sniffer.
 */
export function php() {
	config = requireUncached('./dev/config/themeConfig.js');
	// Check if theme slug has been updated.
	let isRebuild = themeConfig.isFirstRun ||
		( themeConfig.slug !== config.theme.slug ) ||
		( themeConfig.name !== config.theme.name );
	if ( isRebuild ) {
		themeConfig.slug = config.theme.slug;
		themeConfig.name = config.theme.name;
	}

	// Reset first run.
	if ( themeConfig.isFirstRun ) {
		themeConfig.isFirstRun = false;
	}

	return src(paths.php.src)
	// If not a rebuild, then run tasks on changed files only.
	.pipe(gulpPlugins.if(!isRebuild, gulpPlugins.newer(paths.php.dest)))
	.pipe(gulpPlugins.phpcs({
		bin: 'vendor/bin/phpcs',
		standard: 'WordPress',
		warningSeverity: 0
	}))
	// Log all problems that was found
	.pipe(gulpPlugins.phpcs.reporter('log'))
	.pipe(gulpPlugins.stringReplace('wprig', config.theme.slug))
	.pipe(gulpPlugins.stringReplace('WP Rig', config.theme.name))
	.pipe(dest(paths.verbose))
	.pipe(dest(paths.php.dest));

}

/**
 * Sass, if that's being used.
 */
export function sassStyles() {
	return src(paths.styles.sass, { base: "./" })
	.pipe(gulpPlugins.sourcemaps.init())
	.pipe(gulpPlugins.sass().on('error', gulpPlugins.sass.logError))
	.pipe(gulpPlugins.tabify(2, true))
	.pipe(gulpPlugins.sourcemaps.write('./maps'))
	.pipe(dest('.'));
}

/**
 * CSS via PostCSS + CSSNext (includes Autoprefixer by default).
 */
export function styles() {
	config = requireUncached('./dev/config/themeConfig.js');

	// Reload cssVars every time the task runs.
    let cssVars = requireUncached(paths.config.cssVars);

	return src(paths.styles.src)
	// .pipe(gulpPlugins.print())
	.pipe(gulpPlugins.phpcs({
		bin: 'vendor/bin/phpcs',
		standard: 'WordPress',
		warningSeverity: 0
	}))
	// Log all problems that was found
	.pipe(gulpPlugins.phpcs.reporter('log'))
	.pipe(gulpPlugins.postcss([
		postcssPresetEnv({
			stage: 3,
			browsers: config.dev.browserslist,
			features: {
				'custom-properties': {
					preserve: false,
					variables: cssVars.variables,
				},
				'custom-media-queries': {
					preserve: false,
					extensions: cssVars.queries,
				}
			}
		})
	]))
	.pipe(gulpPlugins.stringReplace('wprig', config.theme.slug))
	.pipe(gulpPlugins.stringReplace('WP Rig', config.theme.name))
	.pipe(dest(paths.verbose))
	.pipe(gulpPlugins.if(!config.dev.debug.styles, gulpPlugins.cssnano()))
	.pipe(dest(paths.styles.dest));
}


/**
 * JavaScript via Babel, ESlint, and uglify.
 */
export function scripts() {
	config = requireUncached('./dev/config/themeConfig.js');
	return src(paths.scripts.src)
	.pipe(gulpPlugins.newer(paths.scripts.dest))
	.pipe(gulpPlugins.eslint())
	.pipe(gulpPlugins.eslint.format())
	.pipe(gulpPlugins.babel())
	.pipe(dest(paths.verbose))
	.pipe(gulpPlugins.if(!config.dev.debug.scripts, gulpPlugins.uglify()))
	.pipe(gulpPlugins.stringReplace('wprig', config.theme.slug))
	.pipe(gulpPlugins.stringReplace('WP Rig', config.theme.name))
	.pipe(dest(paths.scripts.dest));
}


/**
 * Copy JS libraries without touching them.
 */
export function jsLibs() {
	return src(paths.scripts.libs)
	.pipe(gulpPlugins.newer(paths.scripts.verboseLibsDest))
	.pipe(dest(paths.scripts.verboseLibsDest))
	.pipe(dest(paths.scripts.libsDest));
}


/**
 * Copy minified JS files without touching them.
 */
export function jsMin() {
	return src(paths.scripts.min)
	.pipe(gulpPlugins.newer(paths.scripts.dest))
	.pipe(dest(paths.verbose))
	.pipe(dest(paths.scripts.dest));
}

/**
 * Optimize images.
 */
export function images() {
	return src(paths.images.src)
	.pipe(gulpPlugins.newer(paths.images.dest))
	.pipe(gulpPlugins.image())
	.pipe(dest(paths.images.dest));
}


/**
 * Watch everything
 */
export function watch() {
	gulpWatch(paths.php.src, series(php, reload));
	gulpWatch(paths.config.themeConfig, series(php, reload));
	gulpWatch(paths.config.cssVars, series(styles, reload));
	gulpWatch(paths.styles.sass, sassStyles);
	gulpWatch(paths.styles.src, series(styles, reload));
	gulpWatch(paths.scripts.src, series(scripts, reload));
	gulpWatch(paths.scripts.min, series(jsMin, reload));
	gulpWatch(paths.scripts.libs, series(jsLibs, reload));
	gulpWatch(paths.images.src, series(images, reload));
}


/**
 * Map out the sequence of events on first load:
 */
const firstRun = series(php, parallel(scripts, jsMin, jsLibs), sassStyles, styles, images, serve, watch);


/**
 * Run the whole thing.
 */
export default firstRun;


/**
 * Generate translation files.
 */
export function translate() {
	return src(paths.languages.src)
	.pipe(gulpPlugins.sort())
	.pipe(gulpPlugins.wpPot({
		domain: config.theme.name,
		package: config.theme.name,
		bugReport: config.theme.name,
		lastTranslator: config.theme.author
	}))
	.pipe(dest(paths.languages.dest));
}


/**
 * Create zip archive from generated theme files.
 */
export function bundle() {
	return src(paths.export.src)
	// .pipe(gulpPlugins.print())
	.pipe(gulpPlugins.if(config.export.compress, gulpPlugins.zip(`${config.theme.name}.zip`), dest(`${paths.export.dest}${config.theme.name}`)))
	.pipe(gulpPlugins.if(config.export.compress, dest(paths.export.dest)));
}


/**
 * Test the theme.
 */
const testTheme = series(php);


/**
 * Export theme for distribution.
 */
const bundleTheme = series(testTheme, parallel(scripts, jsMin, jsLibs), styles, images, translate, bundle);

export { testTheme, bundleTheme };
