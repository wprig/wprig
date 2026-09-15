/**
 * Tests for scripts/lib/navigation-seed.js + starter-template nav guards.
 *
 * Guarantees the "nav always looks great right after rig-init" contract for
 * block-capable paradigms: no bare navigation block ever ships (bare markup
 * triggers core's lazy fallback-post path — wp-includes/blocks/navigation.php),
 * no database ref ever ships in a template, and the seed helpers make safe
 * decisions about the user's wp_navigation content.
 *
 * @package
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
	NAV_SLUG,
	LEGACY_NAV_SLUG,
	SEED_CONTENT,
	FALLBACK_FINGERPRINT,
	hasBareNavigation,
	hasHardcodedNavigationRef,
	chooseSeedTarget,
	isTrashableFallback,
	templateFilesForNavScan,
} from '../lib/navigation-seed.js';

const STARTER_TEMPLATE = path.resolve(
	process.cwd(),
	'scripts/templates/index.html'
);

function stubGlob( files ) {
	return ( pattern ) => ( pattern === 'templates/**/*.html' ? files : [] );
}

describe( 'starter template guards (never ship a fallback-triggering nav)', () => {
	test( 'starter template exists', () => {
		expect( fs.existsSync( STARTER_TEMPLATE ) ).toBe( true );
	} );

	test( 'starter template has no bare navigation block', () => {
		const markup = fs.readFileSync( STARTER_TEMPLATE, 'utf8' );
		expect( hasBareNavigation( markup ) ).toBe( false );
	} );

	test( 'starter template has no hardcoded database ref', () => {
		const markup = fs.readFileSync( STARTER_TEMPLATE, 'utf8' );
		expect( hasHardcodedNavigationRef( markup ) ).toBe( false );
	} );

	test( 'starter template navigation ships inline inner blocks', () => {
		const markup = fs.readFileSync( STARTER_TEMPLATE, 'utf8' );
		expect( markup ).toContain( 'wp:home-link' );
		expect( markup ).toContain( 'wp:page-list' );
	} );

	test( 'seed content itself contains no bare navigation or ref', () => {
		expect( hasBareNavigation( SEED_CONTENT ) ).toBe( false );
		expect( hasHardcodedNavigationRef( SEED_CONTENT ) ).toBe( false );
	} );

	test( 'scan helper walks templates/ and parts/ via glob', () => {
		const root = makeTempRoot();
		fs.mkdirSync( path.join( root, 'templates' ), { recursive: true } );
		fs.writeFileSync(
			path.join( root, 'templates', 'index.html' ),
			'<!-- wp:navigation /-->'
		);

		expect(
			templateFilesForNavScan(
				root,
				stubGlob( [ 'templates/index.html' ] )
			)
		).toEqual( [ 'templates/index.html' ] );

		fs.rmSync( root, { recursive: true, force: true } );
	} );
} );

describe( 'hasBareNavigation', () => {
	test( 'detects the bare self-closing form with and without attrs', () => {
		expect( hasBareNavigation( '<!-- wp:navigation /-->' ) ).toBe( true );
		expect(
			hasBareNavigation( '<!-- wp:navigation {"icon":"menu"} /-->' )
		).toBe( true );
	} );

	test( 'does not flag navigations with inner blocks', () => {
		expect(
			hasBareNavigation(
				'<!-- wp:navigation --><!-- wp:home-link /--><!-- /wp:navigation -->'
			)
		).toBe( false );
		expect( hasBareNavigation( '<p>hello</p>' ) ).toBe( false );
		expect( hasBareNavigation( undefined ) ).toBe( false );
	} );
} );

describe( 'hasHardcodedNavigationRef', () => {
	test( 'detects a numeric ref inside a navigation comment', () => {
		expect(
			hasHardcodedNavigationRef(
				'<!-- wp:navigation {"ref":4,"className":"main-navigation"} /-->'
			)
		).toBe( true );
	} );

	test( 'ignores refs in other blocks and non-numeric refs', () => {
		expect( hasHardcodedNavigationRef( '<!-- wp:page-list /-->' ) ).toBe(
			false
		);
		expect(
			hasHardcodedNavigationRef( '<!-- wp:navigation {"ref":null} -->' )
		).toBe( false );
	} );
} );

describe( 'chooseSeedTarget', () => {
	const base = {
		post_type: 'wp_navigation',
		post_status: 'publish',
	};

	test( 'uses an existing wprig-primary-nav post', () => {
		const posts = [
			{ ...base, ID: 4, post_name: LEGACY_NAV_SLUG },
			{ ...base, ID: 9, post_name: NAV_SLUG },
		];
		expect( chooseSeedTarget( posts ) ).toEqual( {
			action: 'use',
			post: posts[ 1 ],
		} );
	} );

	test( 'migrates the legacy e2e-primary-nav slug', () => {
		const posts = [ { ...base, ID: 4, post_name: LEGACY_NAV_SLUG } ];
		expect( chooseSeedTarget( posts ) ).toEqual( {
			action: 'migrate',
			post: posts[ 0 ],
		} );
	} );

	test( 'creates when only drafts exist', () => {
		const posts = [
			{ ...base, ID: 7, post_name: NAV_SLUG, post_status: 'draft' },
		];
		expect( chooseSeedTarget( posts ).action ).toBe( 'create' );
	} );

	test( 'creates on empty or invalid input', () => {
		expect( chooseSeedTarget( [] ).action ).toBe( 'create' );
		expect( chooseSeedTarget( null ).action ).toBe( 'create' );
	} );
} );

describe( 'isTrashableFallback', () => {
	const fallback = ( overrides = {} ) => ( {
		ID: 12,
		post_type: 'wp_navigation',
		post_status: 'publish',
		post_title: 'Navigation',
		post_name: 'navigation',
		post_content: FALLBACK_FINGERPRINT,
		post_date: '2026-09-14 10:00:00',
		post_modified: '2026-09-14 10:00:00',
		...overrides,
	} );

	test( 'accepts the exact untouched core fallback', () => {
		expect( isTrashableFallback( fallback() ) ).toBe( true );
	} );

	test( 'accepts whitespace-normalized fingerprint variants', () => {
		expect(
			isTrashableFallback(
				fallback( { post_content: '<!-- wp:page-list /-->\n' } )
			)
		).toBe( true );
	} );

	test( 'rejects posts with edited content', () => {
		expect(
			isTrashableFallback(
				fallback( { post_content: '<!-- wp:home-link /-->' } )
			)
		).toBe( false );
	} );

	test( 'rejects edited posts even with fallback content', () => {
		expect(
			isTrashableFallback(
				fallback( { post_modified: '2026-09-14 12:00:00' } )
			)
		).toBe( false );
	} );

	test( 'rejects user-authored titles and trashed posts', () => {
		expect(
			isTrashableFallback( fallback( { post_title: 'Main Menu' } ) )
		).toBe( false );
		expect(
			isTrashableFallback( fallback( { post_status: 'trash' } ) )
		).toBe( false );
		expect( isTrashableFallback( null ) ).toBe( false );
	} );
} );

function makeTempRoot() {
	return fs.mkdtempSync( path.join( os.tmpdir(), 'rig-navseed-' ) );
}
