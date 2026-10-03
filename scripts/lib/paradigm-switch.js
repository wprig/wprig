/**
 * Internal dependencies
 */
import fs from 'node:fs';
import path from 'node:path';

/**
 * FSE artifact directories that make WordPress core detect the theme as a
 * block theme (wp_is_block_theme() checks templates/index.html). When a user
 * switches to the classic paradigm these must leave the theme root or the
 * Site Editor stays available regardless of config.
 */
const FSE_ARTIFACT_DIRS = [ 'templates', 'parts' ];

/**
 * Paradigm-owned keys inside theme that the interactive init flow governs.
 * A stale config.local.json (gitignored machine layer) must never silently
 * override the user's explicit init choice at build or runtime.
 */
const PARADIGM_THEME_KEYS = [ 'themeType', 'enableBlocks' ];

/**
 * Moves FSE artifact directories out of the theme root when switching to the
 * classic paradigm. Directories are moved into a timestamped backup folder
 * (never hard-deleted) so user-authored block templates stay recoverable.
 *
 * @param {string} root                Theme root directory.
 * @param {Object} [options]           Options.
 * @param {string} [options.backupDir] Override the backup destination (tests).
 * @return {string[]} Absolute paths of the backup destinations created.
 */
export function teardownClassicArtifacts( root, options = {} ) {
	const moved = [];

	for ( const dir of FSE_ARTIFACT_DIRS ) {
		const src = path.join( root, dir );
		if ( ! fs.existsSync( src ) ) {
			continue;
		}

		const stamp = new Date()
			.toISOString()
			.replace( /[:.]/g, '-' )
			.replace( 'T', '_' )
			.replace( 'Z', '' );
		const backupRoot =
			options.backupDir ?? path.join( root, '.rig-backup', stamp );
		const dest = path.join( backupRoot, dir );

		fs.mkdirSync( path.dirname( dest ), { recursive: true } );
		fs.renameSync( src, dest );
		moved.push( dest );
	}

	return moved;
}

/**
 * Removes paradigm-owned overrides (theme.themeType, theme.enableBlocks) from
 * config.local.json so the interactive init choice is authoritative. All other
 * keys are preserved; missing or invalid files are ignored without error.
 *
 * @param {string} configDir Directory containing config.local.json.
 * @return {Object} { modified: boolean, stripped: string[] }.
 */
export function stripLocalParadigmOverrides( configDir ) {
	const localPath = path.join( configDir, 'config.local.json' );

	if ( ! fs.existsSync( localPath ) ) {
		return { modified: false, stripped: [] };
	}

	let config;
	try {
		config = JSON.parse( fs.readFileSync( localPath, 'utf8' ) );
	} catch {
		return { modified: false, stripped: [] };
	}

	if (
		! config ||
		typeof config !== 'object' ||
		! config.theme ||
		typeof config.theme !== 'object'
	) {
		return { modified: false, stripped: [] };
	}

	const stripped = [];
	for ( const key of PARADIGM_THEME_KEYS ) {
		if ( key in config.theme ) {
			delete config.theme[ key ];
			stripped.push( `theme.${ key }` );
		}
	}

	if ( stripped.length ) {
		if ( 0 === Object.keys( config.theme ).length ) {
			delete config.theme;
		}
		fs.writeFileSync(
			localPath,
			JSON.stringify( config, null, '\t' ) + '\n',
			'utf8'
		);
	}

	return { modified: stripped.length > 0, stripped };
}
