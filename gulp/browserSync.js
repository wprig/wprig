/* eslint-env es6 */
'use strict';

// External dependencies
import requireUncached from 'require-uncached';
import browserSync from 'browser-sync';
import log from 'fancy-log';
import colors from 'ansi-colors';

// Internal dependencies
import {paths} from './constants';

/**
 * Conditionally set up BrowserSync.
 * Only run BrowserSync if config.browserSync.live = true.
 */

// Create a BrowserSync instance:
export const server = browserSync.create();

// Initialize the BrowserSync server conditionally:
export function serve(done) {
    // get a fresh copy of the config
    const config = requireUncached(paths.config.themeConfig);

    // bail early if not serving via BrowserSync
    if (config.dev.browserSync.live) {
		done();
	}

    let serverConfig = {
        proxy: config.dev.browserSync.proxyURL,
        port: config.dev.browserSync.bypassPort,
        liveReload: true,
        https: false
    };

    // Default to included cert/key paths
    let certPath = `${paths.config.browserSync}/wp-rig-browser-sync.crt`;
    let keyPath = `${paths.config.browserSync}/wp-rig-browser-sync.key`;

    // Use custom cert and key paths if defined
    if( config.dev.browserSync.hasOwnProperty('certPath') ){
        certPath = config.dev.browserSync.certPath;
        log(colors.yellow(`Using the custom SSL certificate ${colors.bold(certPath)}`));
    } else {
        log(colors.yellow(`Using the default SSL certificate ${colors.bold(certPath)}`));
    }
    
    if( config.dev.browserSync.hasOwnProperty('keyPath') ){
        keyPath = config.dev.browserSync.keyPath;
        log(colors.yellow(`Using the custom SSL key ${colors.bold(keyPath)}`));
    } else {
        log(colors.yellow(`Using the default SSL key ${colors.bold(keyPath)}`));
    }

    if (config.dev.browserSync.https) {
        log(colors.yellow(`HTTPS is ${colors.bold('on')}`));
        serverConfig.https = {
            key: keyPath,
            cert: certPath
        };
    }

    server.init(serverConfig);

	done();
}

// Reload the live site:
export function reload(done) {
	// get a fresh copy of the config
    const config = requireUncached(paths.config.themeConfig);
    
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