import fse from 'fs-extra';
import path from 'node:path';
import { blocksRoot, parseName, pathExists, root } from '../lib/block-utils.js';
import themeConfig from '../../config/themeConfig.js';

/**
 * Promotes a block to a standalone plugin.
 *
 * @param {string} name Block name <namespace>/<slug> or <slug>
 */
export default async function promotePlugin( name ) {
	const { slug, full } = parseName( name );
	const dir = path.join( blocksRoot, slug );

	if ( ! pathExists( dir ) ) {
		console.error( `Block not found: ${ dir }` );
		process.exit( 1 );
	}

	const pluginsOut = path.join( root, 'optional', 'promoted-blocks' );
	const pluginDir = path.join( pluginsOut, `${ slug }-block` );
	await fse.ensureDir( pluginDir );

	// Minimal plugin scaffold
	const pluginPhp = `<?php
/**
 * Plugin Name: ${ slug } (from theme)
 * Description: Promoted block ${ full } exported from theme.
 * Version: 0.1.0
 * Author: ${ themeConfig?.theme?.author || 'WP Rig' }
 */
if (!defined('ABSPATH')) { exit; }
add_action('init', function() {
  register_block_type(__DIR__ . '/block');
});
`;

	const pluginBlockDir = path.join( pluginDir, 'block' );
	await fse.ensureDir( pluginBlockDir );

	// Copy block directory contents
	await fse.copy( dir, pluginBlockDir, { overwrite: true } );
	await fse.writeFile( path.join( pluginDir, `${ slug }.php` ), pluginPhp );

	console.log(
		`Promoted block to plugin at ${ path.relative( root, pluginDir ) }.`
	);
	console.log(
		'Activate it from Plugins after moving to wp-content/plugins if needed.'
	);
}
