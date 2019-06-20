/* eslint-env es6 */
'use strict';

/**
 * External dependencies
 */
import browserSync from 'browser-sync';
import log from 'fancy-log';
import colors from 'ansi-colors';
import fs from 'fs';

/**
 * Internal dependencies
 */
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
    const config = getThemeConfig();

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

        // Use a custom path key/cert if defined, otherwise use the default path
        const certPath = config.dev.browserSync.hasOwnProperty('certPath') ? config.dev.browserSync.certPath : paths.browserSync.cert;
        const keyPath = config.dev.browserSync.hasOwnProperty('keyPath') ? config.dev.browserSync.keyPath : paths.browserSync.key;

        // Ensure the key/cert files exist
        const certFound = fs.existsSync(certPath);
        const keyFound = fs.existsSync(keyPath);

        // Let the user know if we found a cert
        if( certFound ){
            log(colors.yellow(`Using the SSL certificate ${colors.bold(certPath)}`));
        } else {
            log(colors.yellow(`No SSL certificate found, HTTPS will ${colors.bold('not')} be enabled`));
        }

        // Let the user know if we found a key
        if( keyFound ){
            log(colors.yellow(`Using the SSL key ${colors.bold(keyPath)}`));
        } else {
            log(colors.yellow(`No SSL key found, HTTPS will ${colors.bold('not')} be enabled`));
        }

        // Only enable HTTPS if there is a cert and a key
        if( certFound && keyFound ){
            log(colors.yellow(`HTTPS is ${colors.bold('on')}`));
            serverConfig.https = {
                key: keyPath,
                cert: certPath
            };
        }

    }

    // Start the BrowserSync server
    server.init(serverConfig);

	done();
}

// Reload the live site:
export function reload(done) {
	const config = getThemeConfig();

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