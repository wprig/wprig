'use strict';

module.exports = {
	theme: {
		slug: 'wprig',
		name: 'WP Rig',
		author: 'Morten Rand-Hendriksen'
	},
	dev: {
		browserSync: {
			live: true,
			proxyURL: 'wprig.test:8888',
			bypassPort: '8181',

			// To use HTTPS you need a cert/key
			// Please see the README for instructions
			// keyPath: '',
			// certPath: '',
			https: false
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
