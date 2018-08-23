/* eslint-env es6 */
'use strict';

// External dependencies
import pem from 'pem';
import log from 'fancy-log';
import colors from 'ansi-colors';
import fs from 'fs';

// Internal dependencies
import {paths} from './constants';

export default function generateCert(done) {

    // Use pem to create a new key/cert
    const pemOptions = {
        days: 1825,
        selfSigned: true,
        country: 'US',
        state: 'OR',
        locality: 'Portland',
        altNames: ['localhost'],
        organization: 'WP Rig'
    };

    pem.createCertificate(pemOptions, function (err, keys) {

        if (err) {
          throw err;
        }

        let keySaved = false;
        let certSaved = false;

        // Save the key
        fs.writeFileSync(paths.browserSync.key, keys.serviceKey, (err) => {  
            
            if (err) {
                throw err;
              }
        
            keySaved = true;
        });
        
        // Save the cert
        fs.writeFileSync(paths.browserSync.cert, keys.certificate, (err) => {  
            
            if (err) {
                throw err;
            }
        
            certSaved = true;
        });

        if ( keySaved && certSaved ){
            log(colors.green('Custom SSL key and certificate generated succressfully!'));
        } else {
            log(colors.red('There was an error generating a custom SSL key and certificate. Please generate them manually to use HTTPS.'));
        }

        done();

      });

}