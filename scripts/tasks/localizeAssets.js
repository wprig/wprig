import fse from 'fs-extra';
import path from 'path';
import fg from 'fast-glob';
import { logger } from '../lib/rig-utils.js';

const IMAGE_EXTENSIONS = [ 'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp' ];
const IMAGE_REGEX = new RegExp(
	`https?:\\/\\/[^\\s"'<>)]+\\.(?:${ IMAGE_EXTENSIONS.join( '|' ) })`,
	'gi'
);

/**
 * Localizes external assets by downloading them and updating source code references.
 *
 * @param {string} themeRoot Path to the theme root.
 */
export default async function localizeAssets( themeRoot ) {
	const assetsImagesDir = path.join( themeRoot, 'assets', 'images' );
	await fse.ensureDir( assetsImagesDir );

	const scanPatterns = [
		'inc/**/*.php',
		'template-parts/**/*.php',
		'patterns/**/*.php',
		'assets/css/src/**/*.css',
		'assets/js/src/**/*.{js,jsx,ts,tsx}',
		'*.php',
	];

	const files = await fg( scanPatterns, {
		cwd: themeRoot,
		absolute: true,
	} );

	logger.info( `Scanning ${ files.length } files for external images...` );

	const urlToLocalMap = new Map();
	const filesToUpdate = [];

	for ( const file of files ) {
		const content = await fse.readFile( file, 'utf8' );
		const matches = content.match( IMAGE_REGEX );

		if ( matches ) {
			filesToUpdate.push( { file, content, matches } );
			for ( const url of matches ) {
				if ( ! urlToLocalMap.has( url ) ) {
					try {
						const urlObj = new URL( url );
						const filename = path.basename( urlObj.pathname );
						urlToLocalMap.set( url, filename );
					} catch ( e ) {
						logger.warn( `Invalid URL found: ${ url }` );
					}
				}
			}
		}
	}

	if ( urlToLocalMap.size === 0 ) {
		logger.success( 'No external images found.' );
		return;
	}

	logger.info(
		`Found ${ urlToLocalMap.size } unique external images. Downloading...`
	);

	for ( const [ url, filename ] of urlToLocalMap.entries() ) {
		const destPath = path.join( assetsImagesDir, filename );

		// Handle name collisions by appending a hash or counter if needed
		let finalFilename = filename;
		let finalDestPath = destPath;
		let counter = 1;
		while (
			( await fse.pathExists( finalDestPath ) ) &&
			! ( await isSameFile( url, finalDestPath ) )
		) {
			const ext = path.extname( filename );
			const base = path.basename( filename, ext );
			finalFilename = `${ base }-${ counter }${ ext }`;
			finalDestPath = path.join( assetsImagesDir, finalFilename );
			counter++;
		}
		urlToLocalMap.set( url, finalFilename );

		if ( await fse.pathExists( finalDestPath ) ) {
			logger.debug(
				`File already exists: ${ finalFilename }, skipping.`
			);
			continue;
		}

		try {
			const response = await fetch( url );
			if ( ! response.ok ) {
				throw new Error(
					`Failed to fetch ${ url }: ${ response.statusText }`
				);
			}
			const buffer = Buffer.from( await response.arrayBuffer() );
			await fse.writeFile( finalDestPath, buffer );
			logger.success( `Downloaded: ${ finalFilename }` );
		} catch ( error ) {
			logger.error( `Error downloading ${ url }: ${ error.message }` );
			urlToLocalMap.delete( url ); // Don't try to replace if download failed
		}
	}

	logger.info( 'Updating source code references...' );

	let updatedCount = 0;
	for ( const { file, content } of filesToUpdate ) {
		let newContent = content;
		let fileChanged = false;

		const ext = path.extname( file );

		for ( const [ url, filename ] of urlToLocalMap.entries() ) {
			if ( ! content.includes( url ) ) {
				continue;
			}

			let replacement;
			if ( ext === '.css' ) {
				replacement = `../images/${ filename }`;
			} else {
				// Default to relative path from theme root for others
				replacement = `assets/images/${ filename }`;
			}

			newContent = newContent.split( url ).join( replacement );
			fileChanged = true;
		}

		if ( fileChanged ) {
			await fse.writeFile( file, newContent );
			updatedCount++;
			logger.debug( `Updated: ${ path.relative( themeRoot, file ) }` );
		}
	}

	logger.success( `✓ Finished! Updated ${ updatedCount } files.` );
}

/**
 * Checks if the file at localPath is the same as the one at url.
 * Very simple check for now: just returns false to force unique filenames unless we want to be smarter.
 *
 * @param {string} url       External URL.
 * @param {string} localPath Local file path.
 * @return {Promise<boolean>} Whether the files are the same.
 */
async function isSameFile( url, localPath ) {
	// For now, let's just assume they are different if we are localizing.
	// Or we could compare sizes, but let's keep it simple.
	return false && url && localPath;
}
