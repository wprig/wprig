import fs from 'fs-extra';
import path from 'path';
import { logger } from '../lib/rig-utils.js';
import {
	isValidVersion,
	readFrameworkVersion,
	writeFrameworkVersion,
} from '../lib/versions.js';

/**
 * Promotes the **WP Rig framework** version.
 *
 * Updates `config/framework.json` (the source-only single source of truth) and
 * mirrors it into `package.json` so npm tooling stays consistent. This task
 * never touches the theme version (`config/config.default.json`,
 * `style.css`, `readme.txt`).
 *
 * @param {string} themeRoot  Path to the framework/theme root.
 * @param {string} newVersion New framework version string.
 * @param {Object} options    Optional settings.
 */
export default async function promoteFrameworkVersion(
	themeRoot,
	newVersion,
	options = {}
) {
	if ( ! newVersion ) {
		throw new Error( 'No version specified.' );
	}

	if ( ! isValidVersion( newVersion ) ) {
		throw new Error(
			`Invalid version format: ${ newVersion }. Expected x.y.z`
		);
	}

	const previous = readFrameworkVersion( themeRoot );
	logger.info(
		`Promoting WP Rig framework version from ${
			previous || 'unknown'
		} to ${ newVersion }...`
	);

	// 1. Single source of truth.
	try {
		writeFrameworkVersion( themeRoot, newVersion );
		logger.success( 'Updated config/framework.json' );
	} catch ( e ) {
		throw new Error(
			`Failed to update config/framework.json: ${ e.message }`
		);
	}

	// 2. Mirror into package.json (source-only, not bundled).
	const packagePath = path.join( themeRoot, 'package.json' );
	if ( await fs.pathExists( packagePath ) ) {
		try {
			const pkg = await fs.readJson( packagePath );
			pkg.version = newVersion;
			await fs.writeJson( packagePath, pkg, { spaces: 2 } );
			logger.success( 'Updated package.json' );
		} catch ( e ) {
			logger.error( `Failed to update package.json: ${ e.message }` );
		}
	}

	// 3. Framework CHANGELOG section.
	const changelogPath = path.join( themeRoot, 'CHANGELOG.md' );
	if ( await fs.pathExists( changelogPath ) ) {
		try {
			let changelog = await fs.readFile( changelogPath, 'utf8' );
			const versionHeader = `## ${ newVersion }`;

			if ( ! changelog.includes( versionHeader ) ) {
				const description =
					options.description || '- WP Rig framework release.';
				const newEntry = `\n${ versionHeader }\n${ description }\n`;
				changelog = changelog.replace(
					/# Changelog\s*/,
					`# Changelog\n${ newEntry }`
				);
				await fs.writeFile( changelogPath, changelog, 'utf8' );
				logger.success(
					'Updated CHANGELOG.md with new framework version section.'
				);
			} else {
				logger.info(
					`CHANGELOG.md already has a section for ${ newVersion }.`
				);
			}
		} catch ( e ) {
			logger.error( `Failed to update CHANGELOG.md: ${ e.message }` );
		}
	}

	logger.success(
		`\n✓ WP Rig framework version promotion to ${ newVersion } completed.`
	);
}
