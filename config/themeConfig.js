'use strict';
const fs = require( 'fs' );

const custom = __dirname + '/config.json';
const defaultConfig = require(__dirname + '/config.default.json' );
if ( fs.existsSync( custom ) ) {
	const merge = require( 'deepmerge' );
	module.exports = merge(defaultConfig,require( custom ));
} else {
	module.exports = defaultConfig;
}