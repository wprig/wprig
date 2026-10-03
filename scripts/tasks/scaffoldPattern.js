import fse from 'fs-extra';
import path from 'path';
import { logger } from '../lib/rig-utils.js';
import themeConfig from '../../config/themeConfig.js';

/**
 * The slug charset WordPress accepts for block pattern slugs.
 *
 * @see https://developer.wordpress.org/reference/functions/register_block_pattern/
 */
const SLUG_PATTERN = /^[A-z0-9/_-]+$/;

/**
 * Loads the config-seeded pattern categories (slug => label).
 *
 * @return {Object<string,string>} Registered category slugs mapped to labels.
 */
function getKnownCategories() {
	return themeConfig?.patterns?.categories || {};
}

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

	if ( ! SLUG_PATTERN.test( rawSlug ) ) {
		logger.error( `Invalid pattern slug: ${ rawSlug }` );
		logger.error(
			'Use only letters, numbers, hyphens, underscores, and forward slashes.'
		);
		return;
	}

	const categories = options.categories || 'featured';
	const description = options.description || '';
	const keywords = options.keywords || '';

	// i18n-aware validation: a placeholder title produces untranslatable
	// metadata, so fail loudly instead of scaffolding a junk pattern.
	if ( ! options.title || 'New Pattern' === title ) {
		logger.error(
			'Pattern title is required and must not be the placeholder "New Pattern".'
		);
		return;
	}

	const knownCategories = getKnownCategories();
	const categorySlugs = categories
		.split( ',' )
		.map( ( slug ) => slug.trim() )
		.filter( Boolean );

	const unknownCategories = categorySlugs.filter(
		( slug ) =>
			! Object.prototype.hasOwnProperty.call( knownCategories, slug )
	);

	if ( unknownCategories.length > 0 ) {
		logger.warn(
			`Unknown pattern categor${
				1 === unknownCategories.length ? 'y' : 'ies'
			} (not in config patterns.categories): ` +
				unknownCategories.join( ', ' )
		);
		logger.warn(
			'Register them in config/config.default.json under "patterns.categories", or filter them via `wprig_block_pattern_categories`.'
		);
	}

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
		.replace( /{{keywords}}/g, keywords )
		.replace( /{{textdomain}}/g, themeSlug );

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
	logger.log( `  - Text Domain: ${ themeSlug }` );
}
