'use strict';
const fs = require( 'fs' );

const custom = __dirname + '/config.json';
const local = __dirname + '/config.local.json';
const defaultConfig = require(__dirname + '/config.default.json' );

const hasCustom = fs.existsSync( custom );
const hasLocal = fs.existsSync( local );

if ( hasCustom || hasLocal ) {
	const merge = require( 'deepmerge' );
	let config = defaultConfig;
	if ( hasCustom ) {
		config = merge(config,require( custom ));
	}
	if ( hasLocal ) {
		config = merge(config,require( local ));
    }
    module.exports = config
} else {
	module.exports = defaultConfig;
}