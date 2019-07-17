'use strict';
// External dependencies
const fs = require( 'fs' );
const merge = require( 'deepmerge' );

// Default config file
const defaultConfigPath = __dirname + '/config.default.json';
const hasDefault = fs.existsSync( defaultConfigPath );
if( ! hasDefault ) {
	console.error(`No default configuration detected. Please create the file ${defaultConfigPath}`);
	process.exit(1);
}

// Set config to the default config
const defaultConfig = require( defaultConfigPath );
let config = defaultConfig;


// Load custom config next
const custom = __dirname + '/config.json';
const hasCustom = fs.existsSync( custom );
if ( hasCustom ) {
	config = merge(config,require( custom ));
}

// Then append local config
const local = __dirname + '/config.local.json';
const hasLocal = fs.existsSync( local );
if ( hasLocal ) {
	config = merge(config,require( local ));
}

// Export the config
module.exports = config;