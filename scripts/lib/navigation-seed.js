/**
 * Pure helpers for the navigation seed workflow (block-capable paradigms).
 *
 * WordPress core renders a navigation block from its markup inner blocks when
 * present (wp-includes/blocks/navigation.php — get_inner_blocks()). Only an
 * EMPTY navigation block falls back to the most recent wp_navigation post,
 * lazily auto-creating an unstyled "Navigation" (page-list) fallback post.
 * WP Rig therefore ships inner-block markup (L1) and treats a seeded
 * wp_navigation post as an opt-in convenience (L2), never as a template
 * dependency: shipped templates must never carry database IDs.
 *
 * @package
 */

/** Slug of the seeded primary navigation post. */
export const NAV_SLUG = 'wprig-primary-nav';

/** Legacy dev-DB slug migrated to NAV_SLUG on first seed run. */
export const LEGACY_NAV_SLUG = 'e2e-primary-nav';

/** Title of the seeded primary navigation post. */
export const NAV_TITLE = 'Primary Navigation';

/**
 * Inner-block markup the seeded post contains. Dynamic blocks only — no
 * hardcoded URLs or database IDs, so the content is portable across installs.
 */
export const SEED_CONTENT =
	'<!-- wp:home-link /-->\n\n<!-- wp:page-list {"showSubmenuIcon":false} /-->';

/**
 * Exact content fingerprint of the fallback post WordPress core lazily
 * creates (block_core_navigation_get_fallback_blocks()). Trashing is only
 * allowed on an exact match — never by title alone.
 */
export const FALLBACK_FINGERPRINT = '<!-- wp:page-list /-->';

/**
 * Detects a bare, self-closing navigation block: `<!-- wp:navigation /-->`.
 * This is the markup that triggers core's fallback-post path and must never
 * ship in a template or starter file.
 *
 * @param {string} markup Block markup to inspect.
 * @return {boolean} True when a bare navigation block is present.
 */
export function hasBareNavigation( markup ) {
	if ( typeof markup !== 'string' ) {
		return false;
	}
	return /<!--\s*wp:navigation(?:\s+\{[^}]*\})?\s*\/-->/.test( markup );
}

/**
 * Detects a hardcoded database ref inside a navigation block comment.
 * Shipped templates must never reference a post ID from any specific install.
 *
 * @param {string} markup Block markup to inspect.
 * @return {boolean} True when a navigation block carries a numeric ref.
 */
export function hasHardcodedNavigationRef( markup ) {
	if ( typeof markup !== 'string' ) {
		return false;
	}
	return /<!--\s*wp:navigation\s+\{[^}]*"ref"\s*:\s*\d+[^}]*\}/.test(
		markup
	);
}

/**
 * Chooses the find-or-migrate-or-create target for the seeded navigation post.
 *
 * @param {Array<Object>} posts wp_navigation posts as returned by
 *                              `wp post list --post_type=wp_navigation --format=json`.
 * @return {Object} { action: 'use'|'migrate'|'create', post?: Object }.
 */
export function chooseSeedTarget( posts ) {
	if ( ! Array.isArray( posts ) ) {
		return { action: 'create' };
	}

	const published = posts.filter(
		( post ) => 'publish' === post?.post_status
	);

	const primary = published.find( ( post ) => NAV_SLUG === post.post_name );
	if ( primary ) {
		return { action: 'use', post: primary };
	}

	const legacy = published.find(
		( post ) => LEGACY_NAV_SLUG === post.post_name
	);
	if ( legacy ) {
		return { action: 'migrate', post: legacy };
	}

	return { action: 'create' };
}

/**
 * Fingerprint test for the auto-created core fallback post. Only an exact,
 * never-edited page-list fallback is trashable — a user-authored navigation
 * with the same title is never touched.
 *
 * @param {Object} post Candidate wp_navigation post.
 * @return {boolean} True when the post is safe to trash.
 */
export function isTrashableFallback( post ) {
	if ( ! post || 'wp_navigation' !== post.post_type ) {
		return false;
	}
	if ( 'trash' === post.post_status ) {
		return false;
	}
	const content = String( post.post_content ?? '' )
		.replace( /\s+/g, ' ' )
		.trim();
	if ( FALLBACK_FINGERPRINT !== content ) {
		return false;
	}
	if ( post.post_date !== post.post_modified ) {
		return false;
	}
	return [ 'navigation', 'Navigation' ].includes( post.post_title );
}

/**
 * Lists template/part HTML files to guard against bare navigation markup.
 *
 * @param {string}   root     Theme root directory.
 * @param {Function} globSync Glob implementation (path -> string[] matcher).
 * @return {string[]} Matching file paths (empty when dirs are absent).
 */
export function templateFilesForNavScan( root, globSync ) {
	const patterns = [ 'templates/**/*.html', 'parts/**/*.html' ];
	const files = [];
	for ( const pattern of patterns ) {
		try {
			files.push( ...globSync( pattern, { cwd: root, dot: true } ) );
		} catch {
			// Directory absent (e.g. classic teardown) — nothing to scan.
		}
	}
	return files.sort();
}
