import fse from 'fs-extra';
import path from 'path';
import { logger } from '../lib/rig-utils.js';
import themeConfig from '../../config/themeConfig.js';

/**
 * Scaffolds a new Block Pattern.
 *
 * @param {string} themeRoot Path to the theme root.
 * @param {Object} options   Pattern options.
 */
export default async function scaffoldPattern( themeRoot, options ) {
	const patternsDir = path.join( themeRoot, 'patterns' );
	await fse.ensureDir( patternsDir );

	const title = options.title || 'New Pattern';
	const rawSlug =
		options.slug ||
		title
			.toLowerCase()
			.replace( /[^a-z0-9 ]/g, '' )
			.replace( / /g, '-' );
	const themeSlug = themeConfig?.theme?.slug || 'wp-rig';
	const fullSlug = `${ themeSlug }/${ rawSlug }`;

	const categories = options.categories || 'featured';
	const description = options.description || '';
	const keywords = options.keywords || '';

	const templatePath = path.join(
		themeRoot,
		'scripts',
		'templates',
		'pattern.php.tmpl'
	);

	if ( ! ( await fse.pathExists( templatePath ) ) ) {
		logger.error( `Template not found: ${ templatePath }` );
		return;
	}

	let content = await fse.readFile( templatePath, 'utf8' );

	content = content
		.replace( /{{title}}/g, title )
		.replace( /{{slug}}/g, fullSlug )
		.replace( /{{categories}}/g, categories )
		.replace( /{{description}}/g, description )
		.replace( /{{keywords}}/g, keywords );

	const fileName = `${ rawSlug }.php`;
	const filePath = path.join( patternsDir, fileName );

	if ( await fse.pathExists( filePath ) ) {
		logger.error( `Pattern file already exists: ${ filePath }` );
		return;
	}

	await fse.writeFile( filePath, content );
	logger.success( `✓ Block Pattern created: ${ filePath }` );
	logger.info( `Pattern details:` );
	logger.log( `  - Title: ${ title }` );
	logger.log( `  - Slug:  ${ fullSlug }` );
	logger.log( `  - Categories: ${ categories }` );
}
