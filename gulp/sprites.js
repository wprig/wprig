/* eslint-env es6 */
'use strict';

/**
 * External dependencies
 */
import { src, dest } from 'gulp';
import pump from 'pump';

/**
 * Internal dependencies
 */
import { paths, gulpPlugins } from './constants';

let config = {
	shape: {
		meta: paths.sprites.srcDir + '/meta.yaml',
	},
	svg: {
		xmlDeclaration: false,
		doctypeDeclaration: false,
		namespaceIDs: true,
		namespaceIDPrefix: 'wprig',
	},
	mode: {
		symbol: {
			dest: '.',
			sprite: 'sprite.svg.php',
			inline: true,
			render: { css: true, },
		},
	},
};

/**
 * Compile svg images into sprite
 * @param {function} done function to call when async processes finish
 * @return {Stream} single stream
 */
export default function sprites( done ) {
	return pump( [
		src( paths.sprites.src ),
		gulpPlugins.newer( paths.sprites.dest ),
		gulpPlugins.svgSprite( config ),
		dest( paths.sprites.dest ),
	], done );
}
