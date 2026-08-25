import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
	assertNoHorizontalOverflow,
	assertRegionsDoNotOverlap,
	assertSiblingsDoNotOverlap,
	collectBoxes,
	isHorizontallyWithinViewport,
	isWithinViewport,
	readOverflowMetrics,
	type BoxedElement,
	type LayoutRegion,
} from '../utils/spatial';

/**
 * Spatial & Visual Regression Agents — Part A.
 *
 * Deterministic geometric layout checks built on `boundingBox()`. The suite is
 * environment-independent (immune to font/OS/antialiasing pixel variance) and
 * paradigm-agnostic: the same structural selectors serve classic, universal,
 * and block-based themes, resolved in order.
 *
 * Viewports track the WP 7.1 `settings.viewport` scale (mobile 480 / tablet
 * 782) plus a small phone and a desktop size.
 */
const VIEWPORTS = [
	{ name: 'small-mobile', width: 375, height: 812 },
	{ name: 'mobile', width: 480, height: 900 },
	{ name: 'tablet', width: 782, height: 1024 },
	{ name: 'desktop', width: 1280, height: 900 },
];

/**
 * Structural layout regions, each resolved by the first matching selector.
 * Selector lists cover both the classic markup (`.site-header`, `.site-main`,
 * `.widget-area`, `.site-footer`) and block-based markup (`.wp-site-blocks`
 * template-part groups) so the suite runs unchanged across paradigms.
 */
const LAYOUT_REGIONS: LayoutRegion[] = [
	{
		name: 'header',
		selectors: [
			'.site-header',
			'#masthead',
			'.wp-site-blocks > .wp-block-group:first-child',
		],
	},
	{
		name: 'main',
		selectors: [
			'.site-main',
			'.site-content',
			'#primary',
			'.entry-content',
			'.wp-block-post-content',
			'main',
		],
	},
	{ name: 'sidebar', selectors: [ '.widget-area', '#secondary' ] },
	{
		name: 'footer',
		selectors: [
			'.site-footer',
			'#colophon',
			'.wp-site-blocks > .wp-block-group:last-child',
		],
	},
];

interface AuditOptions {
	/** Also assert that the direct block children of `.entry-content` don't collide. */
	checkContentSiblings?: boolean;
}

/**
 * Run the full geometric audit for a URL across every viewport. Failures are
 * annotated with the viewport they occurred in.
 */
async function spatialAudit(
	page: Page,
	url: string,
	options: AuditOptions = {}
): Promise<void> {
	for ( const vp of VIEWPORTS ) {
		const context = `${ vp.name } (${ vp.width }×${ vp.height })`;
		await page.setViewportSize( { width: vp.width, height: vp.height } );
		await page.goto( url );
		await page.waitForLoadState( 'load' );
		// Wait for webfonts to settle so geometry reflects the final layout.
		await page.evaluate( () => document.fonts.ready );

		try {
			assertNoHorizontalOverflow( await readOverflowMetrics( page ) );
			await assertRegionsDoNotOverlap( page, LAYOUT_REGIONS );

			if ( options.checkContentSiblings ) {
				const content = page.locator( '.entry-content' ).first();
				if ( await content.isVisible() ) {
					await assertSiblingsDoNotOverlap( content );
				}
			}
		} catch ( error ) {
			throw new Error( `${ url } @ ${ context }: ${ ( error as Error ).message }` );
		}
	}
}

/** Collect visible, zero-size-free boxes for a locator list (for custom asserts). */
async function boxesFor(
	page: Page,
	selectors: Array<{ label: string; selector: string }>
): Promise<BoxedElement[]> {
	return collectBoxes(
		selectors.map( ( { label, selector } ) => ( {
			label,
			locator: page.locator( selector ),
		} ) )
	);
}

test.describe( 'Spatial & Visual Regression — Part A', () => {
	test.beforeEach( async ( { page } ) => {
		await page.goto( '/' );
		await page.waitForLoadState( 'load' );
	} );

	test( 'Home page: no overflow, regions distinct, content siblings don\'t collide', async ( {
		page,
	} ) => {
		await spatialAudit( page, '/', { checkContentSiblings: true } );
	} );

	test( 'Single post: no overflow, regions distinct, content siblings don\'t collide', async ( {
		page,
	} ) => {
		await spatialAudit( page, '/hello-world/', { checkContentSiblings: true } );
	} );

	test( 'Theme unit test stress page: no horizontal overflow from tables/code/images', async ( {
		page,
	} ) => {
		await spatialAudit( page, '/markup-html-tags-and-formatting/', {
			checkContentSiblings: true,
		} );
	} );

	test( 'Archive: no overflow, regions distinct', async ( { page } ) => {
		await spatialAudit( page, '/?post_type=post' );
	} );

	test( 'Search results: no overflow, regions distinct', async ( { page } ) => {
		await spatialAudit( page, '/?s=hello' );
	} );

	test( '404 page: no overflow, regions distinct, content stays in viewport', async ( {
		page,
	} ) => {
		await page.goto( '/this-page-does-not-exist-12345' );
		await expect( page.locator( 'body' ) ).toHaveClass( /error404/ );

		for ( const vp of VIEWPORTS ) {
			const context = `${ vp.name } (${ vp.width }×${ vp.height })`;
			await page.setViewportSize( { width: vp.width, height: vp.height } );
			await page.reload();
			await page.waitForLoadState( 'load' );
			await page.evaluate( () => document.fonts.ready );

			try {
				assertNoHorizontalOverflow( await readOverflowMetrics( page ) );
				await assertRegionsDoNotOverlap( page, LAYOUT_REGIONS );
				const mainBoxes = await boxesFor( page, [
					{ label: 'page-content', selector: '.page-content' },
				] );
				const viewport = page.viewportSize()!;
				for ( const box of mainBoxes ) {
					if ( ! isHorizontallyWithinViewport( box.rect, viewport ) ) {
						throw new Error(
							`${ box.label } escapes the viewport horizontally: ${ box.rect.x },${ box.rect.y } ${ box.rect.width }×${ box.rect.height } vs ${ viewport.width }×${ viewport.height }`
						);
					}
				}
			} catch ( error ) {
				throw new Error(
					`/this-page-does-not-exist-12345 @ ${ context }: ${ ( error as Error ).message }`
				);
			}
		}
	} );

	test( 'Mobile menu open: no horizontal overflow, menu container stays within viewport', async ( {
		page,
	} ) => {
		await page.setViewportSize( { width: 375, height: 812 } );
		await page.goto( '/this-page-does-not-exist-12345' );
		await page.waitForLoadState( 'load' );

		const menuToggle = page.locator( '.menu-toggle' ).first();
		await expect( menuToggle ).toBeVisible();
		await menuToggle.click();
		await expect( page.locator( 'body' ) ).toHaveClass( /mobile-menu-open/ );

		await page.waitForTimeout( 300 );
		await page.evaluate( () => document.fonts.ready );

		assertNoHorizontalOverflow( await readOverflowMetrics( page ) );

		const menuBoxes = await boxesFor( page, [
			{ label: 'primary-menu-container', selector: '.primary-menu-container' },
			{ label: 'main-navigation', selector: '.main-navigation' },
		] );
		const viewport = page.viewportSize()!;
		for ( const box of menuBoxes ) {
			if ( ! isWithinViewport( box.rect, viewport ) ) {
				throw new Error(
					`${ box.label } escapes the viewport when the menu is open: ${ box.rect.x },${ box.rect.y } ${ box.rect.width }×${ box.rect.height } vs ${ viewport.width }×${ viewport.height }`
				);
			}
		}
	} );
} );
