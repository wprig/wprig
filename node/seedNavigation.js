/**
 * External dependencies
 */
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Internal dependencies
 */
import { exec } from '../scripts/lib/cli-utils.js';
import {
	NAV_SLUG,
	NAV_TITLE,
	SEED_CONTENT,
	chooseSeedTarget,
	isTrashableFallback,
} from '../scripts/lib/navigation-seed.js';

// Initialize __dirname manually
const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

const WP_TIMEOUT_MS = 10_000;

const log = ( message ) => console.log( message );

/**
 * Runs a wp CLI command with a bounded timeout.
 *
 * @param {string} command Command to run.
 * @return {Promise<string|null>} stdout, or null when WP CLI is unavailable.
 */
async function wpCommand( command ) {
	try {
		const { stdout } = await exec( command, {
			cwd: __dirname,
			timeout: WP_TIMEOUT_MS,
		} );
		return stdout;
	} catch {
		return null;
	}
}

/**
 * Checks that the WP CLI is usable (binary present AND a WordPress install
 * answers) before doing any work. Never throws — the caller decides what a
 * null probe means.
 *
 * @return {Promise<boolean>} True when WP CLI responded.
 */
async function probeWpCli() {
	const output = await wpCommand( 'wp --info --quiet' );
	return null !== output;
}

/**
 * Seeds the primary wp_navigation post and prunes untouched core fallback
 * posts. Convenience layer only: the shipped templates render a working,
 * styled navigation from their own inner blocks without any database post.
 *
 * Never throws and never changes the init exit code — any failure logs a
 * skip line and returns. Opt out with WPRIG_SKIP_NAV_SEED=1; skipped
 * automatically on CI.
 *
 * @return {Promise<void>}
 */
export async function seedNavigation() {
	if ( process.env.WPRIG_SKIP_NAV_SEED === '1' ) {
		log( 'ℹ️  Navigation seed skipped (WPRIG_SKIP_NAV_SEED=1).' );
		return;
	}
	if ( process.env.CI ) {
		log( 'ℹ️  Navigation seed skipped (CI environment).' );
		return;
	}

	if ( ! ( await probeWpCli() ) ) {
		log(
			'ℹ️  wp CLI unavailable — skipping navigation seed. The template ships an inline navigation (home link + page list), so the menu already renders styled without a seeded post.'
		);
		return;
	}

	try {
		const listJson = await wpCommand(
			'wp post list --post_type=wp_navigation --format=json --fields=ID,post_name,post_title,post_content,post_status,post_type,post_date,post_modified'
		);
		const posts = JSON.parse( listJson ?? '[]' );
		const target = chooseSeedTarget( posts );

		let postId = null;
		if ( 'use' === target.action ) {
			postId = target.post.ID;
			log(
				`✅ Primary navigation post already present (ID ${ postId }).`
			);
		} else if ( 'migrate' === target.action ) {
			postId = target.post.ID;
			await wpCommand(
				`wp post update ${ postId } --post_name=${ NAV_SLUG } --post_title='${ NAV_TITLE }' --quiet`
			);
			log(
				`✅ Migrated legacy navigation post ${ target.post.post_name } → ${ NAV_SLUG } (ID ${ postId }).`
			);
		} else {
			const created = await wpCommand(
				`wp post create --post_type=wp_navigation --post_name=${ NAV_SLUG } --post_title='${ NAV_TITLE }' --post_status=publish --porcelain`
			);
			postId = String( created ?? '' ).trim();
			if ( ! postId ) {
				log(
					'ℹ️  Could not create the navigation post — skipping. The inline template navigation still renders correctly.'
				);
				return;
			}
			await wpCommand(
				`wp post update ${ postId } --post_content='${ SEED_CONTENT }' --quiet`
			);
			log( `✅ Seeded primary navigation post (ID ${ postId }).` );
		}

		// Prune only the untouched, lazily-created core fallback
		// (exact page-list fingerprint, never edited, default title).
		const trashable = posts.filter( isTrashableFallback );
		for ( const post of trashable ) {
			await wpCommand( `wp post trash ${ post.ID } --quiet` );
			log(
				`✅ Pruned untouched core fallback navigation post (ID ${ post.ID }).`
			);
		}
	} catch ( err ) {
		log(
			`ℹ️  Navigation seed skipped (${
				err?.message || err
			}). The inline template navigation still renders correctly.`
		);
	}
}

// Allow direct execution: node node/seedNavigation.js
if ( process.argv[ 1 ] && process.argv[ 1 ].endsWith( 'seedNavigation.js' ) ) {
	seedNavigation();
}
