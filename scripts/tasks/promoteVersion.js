import fs from 'fs-extra';
import path from 'path';
import { logger } from '../lib/rig-utils.js';

/**
 * Promotes the theme version across multiple files.
 *
 * @param {string} themeRoot Path to the theme root.
 * @param {string} newVersion New version string.
 * @param {Object} options Optional settings.
 */
export default async function promoteVersion( themeRoot, newVersion, options = {} ) {
	if ( ! newVersion ) {
		throw new Error( 'No version specified.' );
	}

	// Basic SemVer validation
	if ( ! /^\d+\.\d+\.\d+/.test( newVersion ) ) {
		throw new Error( `Invalid version format: ${ newVersion }. Expected x.y.z` );
	}

	logger.info( `Promoting version to ${ newVersion }...` );

	const filesToUpdate = [
		{
			path: 'package.json',
			type: 'json',
			update: ( content ) => {
				content.version = newVersion;
				return content;
			},
		},
		{
			path: 'style.css',
			type: 'text',
			regex: /Version:\s*(\d+\.\d+\.\d+)/,
			replace: `Version: ${ newVersion }`,
		},
		{
			path: 'readme.txt',
			type: 'text',
			regex: /Stable tag:\s*(\d+\.\d+\.\d+)/,
			replace: `Stable tag: ${ newVersion }`,
		},
	];

	for ( const file of filesToUpdate ) {
		const filePath = path.join( themeRoot, file.path );
		if ( ! ( await fs.pathExists( filePath ) ) ) {
			logger.warn( `File not found: ${ file.path }. Skipping.` );
			continue;
		}

		try {
			if ( file.type === 'json' ) {
				const json = await fs.readJson( filePath );
				const updated = file.update( json );
				await fs.writeJson( filePath, updated, { spaces: 2 } );
			} else if ( file.type === 'text' ) {
				let text = await fs.readFile( filePath, 'utf8' );
				if ( file.regex.test( text ) ) {
					text = text.replace( file.regex, file.replace );
					await fs.writeFile( filePath, text, 'utf8' );
				} else {
					logger.warn( `Could not find version pattern in ${ file.path }.` );
				}
			}
			logger.success( `Updated ${ file.path }` );
		} catch ( e ) {
			logger.error( `Failed to update ${ file.path }: ${ e.message }` );
		}
	}

	// Update CHANGELOG.md
	const changelogPath = path.join( themeRoot, 'CHANGELOG.md' );
	if ( await fs.pathExists( changelogPath ) ) {
		try {
			let changelog = await fs.readFile( changelogPath, 'utf8' );
			const versionHeader = `## ${ newVersion }`;

			if ( ! changelog.includes( versionHeader ) ) {
				// Insert after the main # Changelog header
				const description = options.description || '- Added new features and improvements.';
				const newEntry = `\n${ versionHeader }\n${ description }\n`;
				changelog = changelog.replace( /# Changelog\s*/, `# Changelog\n${ newEntry }` );
				await fs.writeFile( changelogPath, changelog, 'utf8' );
				logger.success( 'Updated CHANGELOG.md with new version section.' );
			} else {
				logger.info( `CHANGELOG.md already has a section for ${ newVersion }.` );
			}
		} catch ( e ) {
			logger.error( `Failed to update CHANGELOG.md: ${ e.message }` );
		}
	}

	logger.success( `\n✓ Version promotion to ${ newVersion } completed.` );
}
