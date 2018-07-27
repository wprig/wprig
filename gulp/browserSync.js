/* eslint-env es6 */
'use strict';

// External dependencies
import browserSync from 'browser-sync';

// Internal dependencies
import {getThemeConfig} from './utils';

/**
 * Conditionally set up BrowserSync.
 * Only run BrowserSync if config.browserSync.live = true.
 */

// Create a BrowserSync instance:
export const server = browserSync.create();

// Initialize the BrowserSync server conditionally:
export function serve(done) {
    // get a fresh copy of the config
    const config = getThemeConfig(true);

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
export function reload(done) {
	// get a fresh copy of the config
    const config = getThemeConfig(true);
    
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