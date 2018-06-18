'use strict';

module.exports = {
	theme: {
		name: 'wprig',
		author: 'Morten Rand-Hendriksen'
	},
	dev: {
		browserSync: {
			live: true,
			proxyURL: 'wprig.test:8888',
			bypassPort: '8181',
			https: false,

			// If true, path to local cert & key.
			certPath: '',
			keyPath: ''
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
