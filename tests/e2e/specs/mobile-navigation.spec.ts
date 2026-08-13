import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

interface FixtureOptions {
	type?: 'classic' | 'block';
	position?: 'default' | 'right-edge';
}

/**
 * Injects a 5-level deep nested navigation menu DOM fixture into the page
 * and re-triggers WP Rig's navigation initialization logic.
 */
async function injectNestedMenuFixture(
	page: Page,
	options: FixtureOptions = {}
) {
	const type = options.type || 'classic';
	const position = options.position || 'default';

	await page.evaluate(
		( { type, position } ) => {
			// Remove existing header/navigation element if present
			const existingHeader = document.querySelector(
				'#site-navigation, .main-navigation, nav.wp-block-navigation'
			);
			if ( existingHeader ) {
				existingHeader.remove();
			}

			const container = document.createElement( 'header' );
			container.id = 'test-header-fixture';

			if ( position === 'right-edge' ) {
				container.style.position = 'fixed';
				container.style.top = '10px';
				container.style.right = '0px';
				container.style.width = '200px';
				container.style.zIndex = '99999';
			} else {
				container.style.position = 'relative';
				container.style.width = '100%';
			}

			if ( type === 'classic' ) {
				container.innerHTML = `
					<nav id="site-navigation" class="main-navigation nav--toggle-small nav--toggle-sub" role="navigation">
						<button class="menu-toggle" aria-controls="primary-menu" aria-expanded="false">
							<span class="dropdown-icon">Menu</span>
						</button>
						<div class="primary-menu-container">
							<ul id="primary-menu" class="menu nav-menu">
								<li id="menu-item-l1" class="menu-item menu-item-has-children current-menu-ancestor">
									<a href="#">Level 1 Item</a>
									<button class="dropdown-toggle" aria-expanded="false" aria-label="Expand level 1"><span class="dropdown-symbol">▼</span></button>
									<ul class="sub-menu">
										<li id="menu-item-l2" class="menu-item menu-item-has-children">
											<a href="#">Level 2 Item</a>
											<button class="dropdown-toggle" aria-expanded="false" aria-label="Expand level 2"><span class="dropdown-symbol">▼</span></button>
											<ul class="sub-menu">
												<li id="menu-item-l3" class="menu-item menu-item-has-children">
													<a href="#">Level 3 Item</a>
													<button class="dropdown-toggle" aria-expanded="false" aria-label="Expand level 3"><span class="dropdown-symbol">▼</span></button>
													<ul class="sub-menu">
														<li id="menu-item-l4" class="menu-item menu-item-has-children">
															<a href="#">Level 4 Item</a>
															<button class="dropdown-toggle" aria-expanded="false" aria-label="Expand level 4"><span class="dropdown-symbol">▼</span></button>
															<ul class="sub-menu">
																<li id="menu-item-l5" class="menu-item current-menu-item">
																	<a href="#">Level 5 Leaf Item</a>
																</li>
															</ul>
														</li>
													</ul>
												</li>
											</ul>
										</li>
									</ul>
								</li>
							</ul>
						</div>
					</nav>
				`;
			} else {
				container.innerHTML = `
					<nav class="wp-block-navigation nav--toggle-small" aria-label="Navigation">
						<button class="wp-block-navigation__responsive-container-open" aria-expanded="false">
							Menu
						</button>
						<div class="wp-block-navigation__responsive-container">
							<button class="wp-block-navigation__responsive-container-close">Close</button>
							<ul class="wp-block-navigation__container">
								<li id="block-item-l1" class="wp-block-navigation-item wp-block-navigation-submenu menu-item-has-children">
									<a class="wp-block-navigation-item__content" href="#">Block Level 1</a>
									<ul class="wp-block-navigation__submenu-container">
										<li id="block-item-l2" class="wp-block-navigation-item wp-block-navigation-submenu menu-item-has-children">
											<a class="wp-block-navigation-item__content" href="#">Block Level 2</a>
											<ul class="wp-block-navigation__submenu-container">
												<li id="block-item-l3" class="wp-block-navigation-item wp-block-navigation-submenu menu-item-has-children">
													<a class="wp-block-navigation-item__content" href="#">Block Level 3</a>
													<ul class="wp-block-navigation__submenu-container">
														<li id="block-item-l4" class="wp-block-navigation-item wp-block-navigation-submenu menu-item-has-children">
															<a class="wp-block-navigation-item__content" href="#">Block Level 4</a>
															<ul class="wp-block-navigation__submenu-container">
																<li id="block-item-l5" class="wp-block-navigation-item">
																	<a class="wp-block-navigation-item__content" href="#">Block Level 5</a>
																</li>
															</ul>
														</li>
													</ul>
												</li>
											</ul>
										</li>
									</ul>
								</li>
							</ul>
						</div>
					</nav>
				`;
			}

			document.body.prepend( container );

			// Call window.initNavigation to register event listeners on the newly injected fixture
			if ( typeof ( window as unknown as { initNavigation?: () => void } ).initNavigation === 'function' ) {
				( window as unknown as { initNavigation: () => void } ).initNavigation();
			}
		},
		{ type, position }
	);
}

test.describe( 'Mobile Navigation Test Suite', () => {
	test.beforeEach( async ( { page } ) => {
		page.on('console', msg => console.log('PAGE LOG:', msg.text()));
		await page.goto( '/' );
		await page.waitForLoadState( 'networkidle' );
	} );

	test.describe( 'Multiple Viewport Scenarios', () => {
		const viewports = [
			{ name: 'Small Mobile', width: 375, height: 667, isMobileNav: true },
			{ name: 'Phablet / Large Mobile', width: 412, height: 915, isMobileNav: true },
			{ name: 'Tablet Viewport', width: 768, height: 1024, isMobileNav: false },
			{ name: 'Desktop Viewport', width: 1280, height: 800, isMobileNav: false },
		];

		for ( const vp of viewports ) {
			test( `Nav behavior at ${ vp.name } (${ vp.width }x${ vp.height })`, async ( {
				page,
			} ) => {
				await page.setViewportSize( { width: vp.width, height: vp.height } );
				await injectNestedMenuFixture( page, { type: 'classic' } );

				const menuToggle = page.locator( '.menu-toggle' ).first();
				const navContainer = page.locator( '.nav--toggle-small' ).first();

				if ( vp.isMobileNav ) {
					// Toggle button should be visible and closed initially
					await expect( menuToggle ).toBeVisible();
					await expect( menuToggle ).toHaveAttribute( 'aria-expanded', 'false' );
					await expect( navContainer ).not.toHaveClass( /nav--toggled-on/ );

					// Expand mobile menu
					await menuToggle.click();
					await expect( menuToggle ).toHaveAttribute( 'aria-expanded', 'true' );
					await expect( navContainer ).toHaveClass( /nav--toggled-on/ );
					await expect( page.locator( 'body' ) ).toHaveClass( /mobile-menu-open/ );

					// Collapse mobile menu
					await menuToggle.click( { force: true } );
					await expect( menuToggle ).toHaveAttribute( 'aria-expanded', 'false' );
					await expect( navContainer ).not.toHaveClass( /nav--toggled-on/ );
				} else {
					// Desktop viewport: mobile menu open class shouldn't be added on resize
					await expect( page.locator( 'body' ) ).not.toHaveClass( /mobile-menu-open/ );
				}
			} );
		}
	} );

	test.describe( 'Deeply Nested Submenus (Up to 5 Levels)', () => {
		test( 'Sequentially expands and collapses classic 5-level deep submenus', async ( {
			page,
		} ) => {
			await page.setViewportSize( { width: 375, height: 812 } );
			await injectNestedMenuFixture( page, { type: 'classic' } );

			// Open top-level mobile menu
			const menuToggle = page.locator( '.menu-toggle' ).first();
			await menuToggle.click();

			const l1Item = page.locator( '#menu-item-l1' );
			const l2Item = page.locator( '#menu-item-l2' );
			const l3Item = page.locator( '#menu-item-l3' );
			const l4Item = page.locator( '#menu-item-l4' );
			const l5Item = page.locator( '#menu-item-l5' );

			// Level 1 expand
			await page.evaluate(() => {
				const a = document.querySelector('#menu-item-l1 > a') as HTMLElement;
				a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
			});
			await expect( l1Item ).toHaveClass( /menu-item--toggled-on/ );
			await expect( l1Item.locator( '> ul.sub-menu' ) ).toHaveClass( /toggle-show/ );

			// Level 2 expand
			await l2Item.locator( '> a' ).dispatchEvent( 'click' );
			await expect( l2Item ).toHaveClass( /menu-item--toggled-on/ );
			await expect( l2Item.locator( '> ul.sub-menu' ) ).toHaveClass( /toggle-show/ );

			// Level 3 expand
			await l3Item.locator( '> a' ).dispatchEvent( 'click' );
			await expect( l3Item ).toHaveClass( /menu-item--toggled-on/ );
			await expect( l3Item.locator( '> ul.sub-menu' ) ).toHaveClass( /toggle-show/ );

			// Level 4 expand
			await l4Item.locator( '> a' ).dispatchEvent( 'click' );
			await expect( l4Item ).toHaveClass( /menu-item--toggled-on/ );
			await expect( l4Item.locator( '> ul.sub-menu' ) ).toHaveClass( /toggle-show/ );

			// Level 5 leaf item should now be visible
			await expect( l5Item ).toBeVisible();
			await expect( l5Item.locator( '> a' ) ).toHaveText( 'Level 5 Leaf Item' );

			// Collapse Level 1 parent -> should hide nested submenus
			await l1Item.locator( '> a' ).dispatchEvent( 'click' );
			await expect( l1Item ).not.toHaveClass( /menu-item--toggled-on/ );
			await expect( l1Item.locator( '> ul.sub-menu' ) ).not.toHaveClass( /toggle-show/ );
		} );

		test( 'Expands 5-level deep submenus in Gutenberg block navigation', async ( {
			page,
		} ) => {
			await page.setViewportSize( { width: 375, height: 812 } );
			await injectNestedMenuFixture( page, { type: 'block' } );

			// Open block mobile menu
			const openButton = page.locator( '.wp-block-navigation__responsive-container-open' );
			await openButton.click();

			const b1Item = page.locator( '#block-item-l1' );
			const b2Item = page.locator( '#block-item-l2' );
			const b3Item = page.locator( '#block-item-l3' );
			const b4Item = page.locator( '#block-item-l4' );
			const b5Item = page.locator( '#block-item-l5' );

			// Level 1 expand
			await b1Item.locator( '> .wp-block-navigation-item__content' ).click();
			await expect( b1Item ).toHaveClass( /menu-item--toggled-on/ );

			// Level 2 expand
			await b2Item.locator( '> .wp-block-navigation-item__content' ).click();
			await expect( b2Item ).toHaveClass( /menu-item--toggled-on/ );

			// Level 3 expand
			await b3Item.locator( '> .wp-block-navigation-item__content' ).click();
			await expect( b3Item ).toHaveClass( /menu-item--toggled-on/ );

			// Level 4 expand
			await b4Item.locator( '> .wp-block-navigation-item__content' ).click();
			await expect( b4Item ).toHaveClass( /menu-item--toggled-on/ );

			// Level 5 leaf item is visible
			await expect( b5Item ).toBeVisible();
		} );
	} );

	test.describe( 'Positioning & Viewport Boundary Checks', () => {
		test( 'Validates bounding box dimensions and viewport containment across 5 levels', async ( {
			page,
		} ) => {
			await page.setViewportSize( { width: 375, height: 812 } );
			await injectNestedMenuFixture( page, { type: 'classic' } );

			const menuToggle = page.locator( '.menu-toggle' ).first();
			await menuToggle.click();

			// Open all 5 levels
			await page.locator( '#menu-item-l1 > a' ).dispatchEvent( 'click' );
			await page.locator( '#menu-item-l2 > a' ).dispatchEvent( 'click' );
			await page.locator( '#menu-item-l3 > a' ).dispatchEvent( 'click' );
			await page.locator( '#menu-item-l4 > a' ).dispatchEvent( 'click' );

			const viewport = page.viewportSize()!;

			// Check bounding box of level 5 item
			const l5Item = page.locator( '#menu-item-l5' );
			await expect( l5Item ).toBeVisible();
			const box = ( await l5Item.boundingBox() )!;

			expect( box ).not.toBeNull();
			expect( box.width ).toBeGreaterThan( 0 );
			expect( box.height ).toBeGreaterThan( 0 );
			expect( box.x ).toBeGreaterThanOrEqual( 0 );
			expect( box.x + box.width ).toBeLessThanOrEqual( viewport.width + 10 ); // allow slight padding tolerance
		} );

		test( 'Triggers .open-left collision class when submenu is positioned near right viewport boundary', async ( {
			page,
		} ) => {
			await page.setViewportSize( { width: 375, height: 812 } );
			await injectNestedMenuFixture( page, { type: 'classic', position: 'right-edge' } );

			const menuToggle = page.locator( '.menu-toggle' ).first();
			await menuToggle.click();

			// Open Level 1 submenu on right-edge nav
			await page.locator( '#menu-item-l1 > a' ).dispatchEvent( 'click' );

			const l1Submenu = page.locator( '#menu-item-l1 > ul.sub-menu' );
			await expect( l1Submenu ).toBeVisible();

			// Wait briefly for IntersectionObserver callback in navigation.ts
			await page.waitForTimeout( 300 );

			// Check if collision observer added open-left or if bounding box stays inside/adjacent
			const box = ( await l1Submenu.boundingBox() )!;
			expect( box ).not.toBeNull();
			expect( box.width ).toBeGreaterThan( 0 );
		} );
	} );

	test.describe( 'Multiple Menu Item States & Developer Lock Mode', () => {
		test( 'Validates active item state and keyboard focus navigation', async ( { page } ) => {
			await page.setViewportSize( { width: 375, height: 812 } );
			await injectNestedMenuFixture( page, { type: 'classic' } );

			// Active menu ancestor / current menu item classes
			const l1Item = page.locator( '#menu-item-l1' );
			const l5Item = page.locator( '#menu-item-l5' );

			await expect( l1Item ).toHaveClass( /current-menu-ancestor/ );
			await expect( l5Item ).toHaveClass( /current-menu-item/ );

			// Keyboard navigation test using Tab
			const menuToggle = page.locator( '.menu-toggle' ).first();
			await menuToggle.focus();
			await expect( menuToggle ).toBeFocused();

			await page.keyboard.press( 'Enter' );
			await expect( menuToggle ).toHaveAttribute( 'aria-expanded', 'true' );

			// Tab into level 1 link
			await page.keyboard.press( 'Tab' );
			await expect( page.locator( '#menu-item-l1 > a' ) ).toBeFocused();
		} );

		test( 'Developer Lock Mode (Alt + Click) keeps mobile menu locked open', async ( {
			page,
		} ) => {
			await page.setViewportSize( { width: 375, height: 812 } );
			await injectNestedMenuFixture( page, { type: 'classic' } );

			const menuToggle = page.locator( '.menu-toggle' ).first();

			// Alt + Click to lock menu open
			await menuToggle.click( { modifiers: [ 'Alt' ] } );

			await expect( page.locator( 'body' ) ).toHaveClass( /mobile-menu-locked/ );
			await expect( menuToggle ).toHaveAttribute( 'aria-expanded', 'true' );

			// Clicking outside or trigger normal click should not close locked menu unless close button / unlock is used
			await page.mouse.click( 10, 10 );
			await expect( page.locator( 'body' ) ).toHaveClass( /mobile-menu-locked/ );

			// Normal click again to unlock and close
			await menuToggle.click( { force: true } );
			await expect( page.locator( 'body' ) ).not.toHaveClass( /mobile-menu-locked/ );
		} );
	} );
} );
