'use strict';
const fs = require('fs');

const defaultConfig = {
	theme: {
		slug: 'wprig',
		name: 'WP Rig',
		author: 'Morten Rand-Hendriksen'
	},
	dev: {
		browserSync: {
			live: true,
			proxyURL: 'wprig.test:8888',
			bypassPort: '8181'
		},
		browserslist: [ // See https://github.com/browserslist/browserslist
			'> 1%',
			'last 2 versions'
		],
		debug: {
			styles: false, // Render verbose CSS for debugging.
			scripts: false // Render verbose JS for debugging.
		}
	},
	export: {
		compress: true
	}
};

const custom = __dirname + '/themeConfigCustom.json';
if ( fs.existsSync( custom ) ) {
	module.exports = require( custom );
} else {
	module.exports = defaultConfig;
}
