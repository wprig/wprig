/* eslint-env es6 */
'use strict';

/**
 * External dependencies
 */
import createCert from 'create-cert';
import log from 'fancy-log';
import colors from 'ansi-colors';
import fs from 'fs';

/**
 * Internal dependencies
 */
import { paths } from './constants';

export default function generateCert( done ) {
	// Use pem to create a new key/cert
	/*
    const createCertOptions = {
        days: 1825,
        commonName: 'localhost'
    };
    */

	const createCertOptions = {
		days: 1825,
		selfSigned: true,
		country: 'US',
		state: 'OR',
		locality: 'Portland',
		altNames: [ 'localhost' ],
		organization: 'WP Rig',
		commonName: 'localhost',
	};

	createCert( createCertOptions ).then( ( keys ) => {
		// Create the BrowserSync directory if needed
		if ( ! fs.existsSync( paths.browserSync.dir ) ) {
			fs.mkdirSync( paths.browserSync.dir );
		}

		// Save the key
		fs.writeFileSync( paths.browserSync.key, keys.key, ( err ) => {
			if ( err ) {
				throw err;
			}
		} );

		// Save the cert
		fs.writeFileSync( paths.browserSync.cert, keys.cert, ( err ) => {
			if ( err ) {
				throw err;
			}
		} );

		// Save the CA cert
		fs.writeFileSync( paths.browserSync.caCert, keys.caCert, ( err ) => {
			if ( err ) {
				throw err;
			}
		} );

		log( colors.green( 'Custom SSL key and certificate generated successfully!' ) );

		done();
	} );
}
