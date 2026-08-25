import { test, expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';

/**
 * Delay helper to slow down playback for visual developer debugging.
 * Enabled via SLOWMO environment variable (e.g. SLOWMO=800).
 */
const VISUAL_DELAY = process.env.SLOWMO ? parseInt( process.env.SLOWMO, 10 ) : 0;

/**
 * Mobile / Viewport Mode flags.
 * MOBILE=1 or NAV_MODE=mobile or VIEWPORT=mobile launches test run in mobile viewport.
 */
const IS_MOBILE_MODE =
	process.env.MOBILE === '1' ||
	process.env.MOBILE === 'true' ||
	process.env.VIEWPORT === 'mobile' ||
	process.env.NAV_MODE === 'mobile';

const DEFAULT_MOBILE_VIEWPORT = { width: 375, height: 750 };
const DEFAULT_DESKTOP_VIEWPORT = { width: 1280, height: 800 };

async function visualPause( page: Page, ms: number = VISUAL_DELAY ) {
	await page.waitForTimeout( ms );
}

/**
 * Temporarily highlights an element in the browser window with a visual halo
 * so developers watching the automated test run can see what element is being acted upon.
 */
async function highlightElement( page: Page, locator: Locator ) {
	try {
		await locator.evaluate( ( el ) => {
			const prevOutline = el.style.outline;
			const prevBoxShadow = el.style.boxShadow;
			const prevTransition = el.style.transition;

			el.style.transition = 'all 0.2s ease-in-out';
			el.style.outline = '3px solid #e36d60';
			el.style.boxShadow = '0 0 12px rgba(227, 109, 96, 0.8)';

			setTimeout( () => {
				el.style.outline = prevOutline;
				el.style.boxShadow = prevBoxShadow;
				el.style.transition = prevTransition;
			}, 1200 );
		} );
	} catch {
		// Ignore highlight errors if element detached during navigation
	}
}

/**
 * Visual hover helper: highlights element, moves mouse, and pauses.
 */
async function visualHover( page: Page, locator: Locator ) {
	await locator.scrollIntoViewIfNeeded();
	await highlightElement( page, locator );
	await locator.hover();
	await visualPause( page );
}

/**
 * Visual click helper: highlights element, clicks, and pauses.
 */
async function visualClick( page: Page, locator: Locator ) {
	await locator.scrollIntoViewIfNeeded();
	await highlightElement( page, locator );
	await locator.click();
	await visualPause( page );
}

/**
 * Injects a complete Navigation DOM fixture containing multi-item desktop navigation
 * and 5-level deep submenus into the page.
 */
async function injectAllNavigationFixture(
	page: Page,
	type: 'classic' | 'block' = 'classic'
) {
	await page.evaluate( ( { navType } ) => {
		const existingNav = document.querySelector(
			'#site-navigation, .main-navigation, nav.wp-block-navigation, #test-header-fixture'
		);
		if ( existingNav ) {
			existingNav.remove();
		}

		const container = document.createElement( 'header' );
		container.id = 'test-header-fixture';
		container.style.position = 'relative';
		container.style.width = '100%';
		container.style.background = '#ffffff';
		container.style.borderBottom = '2px solid #e2e8f0';
		container.style.padding = '10px 20px';
		container.style.zIndex = '9999';

		if ( navType === 'classic' ) {
			container.innerHTML = `
				<nav id="site-navigation" class="main-navigation nav--toggle-small nav--toggle-sub" role="navigation">
					<button class="menu-toggle" aria-controls="primary-menu" aria-expanded="false">
						<span class="dropdown-icon">Menu</span>
					</button>
					<div class="primary-menu-container">
						<ul id="primary-menu" class="menu nav-menu">
							<li id="nav-item-home" class="menu-item current-menu-item"><a href="#">Home</a></li>
							<li id="nav-item-about" class="menu-item"><a href="#">About WP Rig</a></li>
							<li id="menu-item-l1" class="menu-item menu-item-has-children current-menu-ancestor">
								<a href="#">Deep Services Menu</a>
								<button class="dropdown-toggle" aria-expanded="false" aria-label="Expand Deep Services Menu"><span class="dropdown-symbol">▼</span></button>
								<ul class="sub-menu">
									<li id="menu-item-l2" class="menu-item menu-item-has-children">
										<a href="#">Level 2 Engineering</a>
										<button class="dropdown-toggle" aria-expanded="false" aria-label="Expand Level 2 Engineering"><span class="dropdown-symbol">▼</span></button>
										<ul class="sub-menu">
											<li id="menu-item-l3" class="menu-item menu-item-has-children">
												<a href="#">Level 3 Architecture</a>
												<button class="dropdown-toggle" aria-expanded="false" aria-label="Expand Level 3 Architecture"><span class="dropdown-symbol">▼</span></button>
												<ul class="sub-menu">
													<li id="menu-item-l4" class="menu-item menu-item-has-children">
														<a href="#">Level 4 Performance</a>
														<button class="dropdown-toggle" aria-expanded="false" aria-label="Expand Level 4 Performance"><span class="dropdown-symbol">▼</span></button>
														<ul class="sub-menu">
															<li id="menu-item-l5" class="menu-item current-menu-item">
																<a href="#">Level 5 Optimization Leaf</a>
															</li>
														</ul>
													</li>
												</ul>
											</li>
										</ul>
									</li>
								</ul>
							</li>
							<li id="nav-item-blog" class="menu-item"><a href="#">Blog</a></li>
							<li id="nav-item-contact" class="menu-item"><a href="#">Contact Us</a></li>
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
							<li id="block-nav-home" class="wp-block-navigation-item"><a class="wp-block-navigation-item__content" href="#">Home</a></li>
							<li id="block-item-l1" class="wp-block-navigation-item wp-block-navigation-submenu has-child">
								<a class="wp-block-navigation-item__content" href="#">Block Deep Menu</a>
								<ul class="wp-block-navigation__submenu-container">
									<li id="block-item-l2" class="wp-block-navigation-item wp-block-navigation-submenu has-child">
										<a class="wp-block-navigation-item__content" href="#">Block Sub Level 2</a>
										<ul class="wp-block-navigation__submenu-container">
											<li id="block-item-l3" class="wp-block-navigation-item wp-block-navigation-submenu has-child">
												<a class="wp-block-navigation-item__content" href="#">Block Sub Level 3</a>
												<ul class="wp-block-navigation__submenu-container">
													<li id="block-item-l4" class="wp-block-navigation-item wp-block-navigation-submenu has-child">
														<a class="wp-block-navigation-item__content" href="#">Block Sub Level 4</a>
														<ul class="wp-block-navigation__submenu-container">
															<li id="block-item-l5" class="wp-block-navigation-item">
																<a class="wp-block-navigation-item__content" href="#">Block Sub Level 5 Leaf</a>
															</li>
														</ul>
													</li>
												</ul>
											</li>
										</ul>
									</li>
								</ul>
							</li>
							<li id="block-nav-contact" class="wp-block-navigation-item"><a class="wp-block-navigation-item__content" href="#">Contact</a></li>
						</ul>
					</div>
				</nav>
			`;
		}

		document.body.prepend( container );

		if ( typeof ( window as unknown as { initNavigation?: () => void } ).initNavigation === 'function' ) {
			( window as unknown as { initNavigation: () => void } ).initNavigation();
		}
	}, { navType: type } );
}

test.describe( 'Visual Automated Navigation Test Suite', () => {
	test.beforeEach( async ( { page } ) => {
		if ( IS_MOBILE_MODE ) {
			await page.setViewportSize( DEFAULT_MOBILE_VIEWPORT );
		} else {
			await page.setViewportSize( DEFAULT_DESKTOP_VIEWPORT );
		}
		await page.goto( '/' );
		await page.waitForLoadState( 'networkidle' );
	} );

	test( 'Desktop Navigation: Visual Hovering, Dropdowns, and Keyboard Traversal @desktop', async ( {
		page,
	}, testInfo ) => {
		if ( IS_MOBILE_MODE ) {
			test.skip( IS_MOBILE_MODE, 'Skipping desktop hover scenario when MOBILE mode is enabled.' );
		}
		if ( testInfo.project.name === 'webkit' ) {
			// WebKit refuses to hover the deepest flyout link (L5) of the
			// 5-level submenu chain — the injected fixture's submenu closes when
			// the synthetic pointer crosses the hover gap, and WebKit will not
			// hover an off-viewport/closing element. The mobile-navigation suite
			// covers 5-level submenus on webkit; this desktop watch-mode visual
			// chain is skipped there (see FRAMEWORK_ROADMAP handoff).
			test.skip( true, 'WebKit synthetic hover does not traverse the 5-level desktop flyout chain.' );
		}
		await page.setViewportSize( DEFAULT_DESKTOP_VIEWPORT );
		await injectAllNavigationFixture( page, 'classic' );
		await visualPause( page, 1000 );

		// 1. Hover over all top-level desktop menu items
		const topItems = [
			page.locator( '#nav-item-home > a' ),
			page.locator( '#nav-item-about > a' ),
			page.locator( '#menu-item-l1 > a' ),
			page.locator( '#nav-item-blog > a' ),
			page.locator( '#nav-item-contact > a' ),
		];

		for ( const item of topItems ) {
			await visualHover( page, item );
		}

		// 2. Deep Submenu Hover Chain on Desktop (Level 1 through Level 5)
		const l1Link = page.locator( '#menu-item-l1 > a' );
		await visualHover( page, l1Link );

		const l2Link = page.locator( '#menu-item-l2 > a' );
		await visualHover( page, l2Link );

		const l3Link = page.locator( '#menu-item-l3 > a' );
		await visualHover( page, l3Link );

		const l4Link = page.locator( '#menu-item-l4 > a' );
		await visualHover( page, l4Link );

		const l5Link = page.locator( '#menu-item-l5 > a' );
		await visualHover( page, l5Link );

		// 3. Desktop Keyboard Focus Traversal (Tab key)
		await topItems[ 0 ].focus();
		await highlightElement( page, topItems[ 0 ] );
		await visualPause( page, 500 );

		for ( let i = 0; i < 4; i++ ) {
			await page.keyboard.press( 'Tab' );
			const focused = page.locator( ':focus' );
			if ( await focused.count() > 0 ) {
				await highlightElement( page, focused );
			}
			await visualPause( page, 500 );
		}
	} );

	test( 'Multi-Viewport Responsiveness & Smooth Viewport Transitions @responsive', async ( {
		page,
	} ) => {
		await injectAllNavigationFixture( page, 'classic' );

		const viewports = IS_MOBILE_MODE
			? [
					{ name: 'Small Mobile (375x667)', width: 375, height: 667 },
					{ name: 'Phablet (412x915)', width: 412, height: 915 },
			  ]
			: [
					{ name: 'Desktop (1280x800)', width: 1280, height: 800 },
					{ name: 'Tablet (768x1024)', width: 768, height: 1024 },
					{ name: 'Phablet (412x915)', width: 412, height: 915 },
					{ name: 'Small Mobile (375x667)', width: 375, height: 667 },
			  ];

		for ( const vp of viewports ) {
			await page.setViewportSize( { width: vp.width, height: vp.height } );
			await visualPause( page, 1000 );

			if ( vp.width < 768 ) {
				const menuToggle = page.locator( '.menu-toggle' ).first();
				await expect( menuToggle ).toBeVisible();
				await highlightElement( page, menuToggle );
				await visualPause( page, 500 );
			}
		}
	} );

	test( 'Mobile Menu Interactions: Toggle, 5-Level Submenus, and Developer Lock Mode @mobile', async ( {
		page,
	} ) => {
		await page.setViewportSize( { width: 375, height: 750 } );
		await injectAllNavigationFixture( page, 'classic' );
		await visualPause( page, 800 );

		// 1. Click Hamburger Toggle to open mobile menu
		const menuToggle = page.locator( '.menu-toggle' ).first();
		await visualClick( page, menuToggle );
		await expect( menuToggle ).toHaveAttribute( 'aria-expanded', 'true' );
		await expect( page.locator( 'body' ) ).toHaveClass( /mobile-menu-open/ );

		// 2. Sequentially expand 5-level deep submenus on mobile
		const l1Expand = page.locator( '#menu-item-l1 > a' );
		await highlightElement( page, l1Expand );
		await page.evaluate( () => {
			const el = document.querySelector( '#menu-item-l1 > a' ) as HTMLElement;
			el?.dispatchEvent( new MouseEvent( 'click', { bubbles: true, cancelable: true } ) );
		} );
		await visualPause( page, 800 );
		await expect( page.locator( '#menu-item-l1' ) ).toHaveClass( /menu-item--toggled-on/ );

		const l2Expand = page.locator( '#menu-item-l2 > a' );
		await highlightElement( page, l2Expand );
		await page.evaluate( () => {
			const el = document.querySelector( '#menu-item-l2 > a' ) as HTMLElement;
			el?.dispatchEvent( new MouseEvent( 'click', { bubbles: true, cancelable: true } ) );
		} );
		await visualPause( page, 800 );
		await expect( page.locator( '#menu-item-l2' ) ).toHaveClass( /menu-item--toggled-on/ );

		const l3Expand = page.locator( '#menu-item-l3 > a' );
		await highlightElement( page, l3Expand );
		await page.evaluate( () => {
			const el = document.querySelector( '#menu-item-l3 > a' ) as HTMLElement;
			el?.dispatchEvent( new MouseEvent( 'click', { bubbles: true, cancelable: true } ) );
		} );
		await visualPause( page, 800 );

		const l4Expand = page.locator( '#menu-item-l4 > a' );
		await highlightElement( page, l4Expand );
		await page.evaluate( () => {
			const el = document.querySelector( '#menu-item-l4 > a' ) as HTMLElement;
			el?.dispatchEvent( new MouseEvent( 'click', { bubbles: true, cancelable: true } ) );
		} );
		await visualPause( page, 800 );

		const l5Leaf = page.locator( '#menu-item-l5 > a' );
		await highlightElement( page, l5Leaf );
		await visualPause( page, 800 );

		// 3. Test Developer Lock Mode (Alt + Click)
		// Close mobile menu first
		await visualClick( page, menuToggle );
		await expect( menuToggle ).toHaveAttribute( 'aria-expanded', 'false' );

		// Alt + Click to open and lock mobile menu
		await highlightElement( page, menuToggle );
		await menuToggle.click( { modifiers: [ 'Alt' ] } );
		await visualPause( page, 800 );
		await expect( page.locator( 'body' ) ).toHaveClass( /mobile-menu-locked/ );
		await expect( menuToggle ).toHaveAttribute( 'aria-expanded', 'true' );

		// Normal click to unlock and close mobile menu
		await highlightElement( page, menuToggle );
		await menuToggle.click( { force: true } );
		await visualPause( page, 800 );
		await expect( page.locator( 'body' ) ).not.toHaveClass( /mobile-menu-locked/ );
		await expect( menuToggle ).toHaveAttribute( 'aria-expanded', 'false' );
	} );

	test( 'Gutenberg Block Navigation: Desktop Hover and Responsive Toggles @block', async ( {
		page,
	} ) => {
		if ( IS_MOBILE_MODE ) {
			await page.setViewportSize( { width: 375, height: 667 } );
		} else {
			await page.setViewportSize( { width: 1280, height: 800 } );
		}
		await injectAllNavigationFixture( page, 'block' );
		await visualPause( page, 800 );

		// Hover block menu items if in desktop mode
		if ( ! IS_MOBILE_MODE ) {
			const blockHome = page.locator( '#block-nav-home > a' );
			await visualHover( page, blockHome );

			const blockL1 = page.locator( '#block-item-l1 > a' );
			await visualHover( page, blockL1 );

			const blockL2 = page.locator( '#block-item-l2 > a' );
			await visualHover( page, blockL2 );

			// Resize to mobile
			await page.setViewportSize( { width: 375, height: 667 } );
			await visualPause( page, 1000 );
		}

		const blockOpenBtn = page.locator( '.wp-block-navigation__responsive-container-open' );
		await expect( blockOpenBtn ).toBeVisible();
		await visualClick( page, blockOpenBtn );

		const blockCloseBtn = page.locator( '.wp-block-navigation__responsive-container-close' );
		await expect( blockCloseBtn ).toBeVisible();
		await visualClick( page, blockCloseBtn );
	} );
} );
