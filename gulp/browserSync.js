/* eslint-env es6 */
'use strict';

// External dependencies
import browserSync from 'browser-sync';
import log from 'fancy-log';
import colors from 'ansi-colors';
import fs from 'fs';

// Internal dependencies
import {paths} from './constants';
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

    // bail early if not serving via BrowserSync
    if (! config.dev.browserSync.live) {
		done();
	}

    let serverConfig = {
        proxy: config.dev.browserSync.proxyURL,
        port: config.dev.browserSync.bypassPort,
        liveReload: true,
        https: false
    };

    // Only setup HTTPS certificates if HTTPS is enabled
    if (config.dev.browserSync.https){

        const certFound = fs.existsSync(paths.browserSync.cert);
        const keyFound = fs.existsSync(paths.browserSync.key);

        if( certFound ){
            log(colors.yellow(`Using the custom SSL certificate ${colors.bold(config.dev.browserSync.certPath)}`));
        } else {
            log(colors.yellow(`No custom SSL certificate found, HTTPS will ${colors.bold('not')} be enabled`));
        }
        
        if( keyFound ){
            log(colors.yellow(`Using the custom SSL key ${colors.bold(config.dev.browserSync.keyPath)}`));
        } else {
            log(colors.yellow(`No custom SSL key found, HTTPS will ${colors.bold('not')} be enabled`));
        }

        // Only enable HTTPS if a cert and key exist
        if( certFound && keyFound ){
            log(colors.yellow(`HTTPS is ${colors.bold('on')}`));
            serverConfig.https = {
                key: paths.browserSync.key,
                cert: paths.browserSync.cert
            };
        }

    }

    server.init(serverConfig);

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