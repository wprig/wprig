'use strict';
const fs = require( 'fs' );

const custom = __dirname + '/themeConfigCustom.json';
const defaultConfig = require(__dirname + '/themeConfigDefault.json' );
if ( fs.existsSync( custom ) ) {
	const merge = require( 'deepmerge' );
	module.exports = merge(defaultConfig,require( custom ));
} else {
	module.exports = defaultConfig;
}

