'use strict';

module.exports = {
	theme: {
		slug: 'wp-rig', // The slug must only consist of lowercase letters, numbers and dashes.
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
			// certPath: '',
			// keyPath: '',
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
