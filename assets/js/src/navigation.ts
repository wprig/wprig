declare const wpRigScreenReaderText: { [key: string]: string };

interface Window {
	mobileBreakpoint?: number;
}

// Module-level variable to store navigation elements
let navElements: NodeListOf<HTMLElement>;
let isMenuLocked = false;

// Initiate the menus when the DOM loads.
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initNavigation);
} else {
	initNavigation();
}

function initNavigation(): void {
	initNavToggleSubmenus();
	initNavToggleSmall();
	watchForWindowSizeChanges();
	initSubmenuCollisionObserver();
	initMenuLockObserver();
	initFseMobileSubmenuDelegation();
	initFseMobileCloseListener();
}

/**
 * Initializes delegated mobile submenu toggling for FSE / Gutenberg blocks in the capture phase.
 */
function initFseMobileSubmenuDelegation(): void {
	document.addEventListener(
		'click',
		(e) => {
			if (!isMobileWidth()) {
				return;
			}

			const target = e.target as HTMLElement;
			const clickTarget = target.closest(
				'li > a, li > span, li > button, li > .wp-block-navigation-item__content'
			) as HTMLElement | null;

			if (clickTarget) {
				const parentLi = clickTarget.closest(
					'li'
				) as HTMLElement | null;
				if (parentLi && parentLi.querySelector(':scope > ul')) {
					e.preventDefault();
					e.stopPropagation();
					toggleSubMenu(parentLi);
				}
			}
		},
		true
	); // Crucial: Run in the capture phase to run before other scripts!
}

/**
 * Initializes a delegated click listener for the mobile close button.
 * If the mobile menu is locked for debugging (via Alt + click on the toggle),
 * clicking the close button must release the lock and allow the menu to close.
 */
function initFseMobileCloseListener(): void {
	document.addEventListener(
		'click',
		(e) => {
			const target = e.target as HTMLElement;
			const closeBtn = target.closest(
				'.wp-block-navigation__responsive-container-close'
			);

			if (closeBtn) {
				isMenuLocked = false;
				document.body.classList.remove('mobile-menu-locked');

				// Sync menu states to closed
				const menuToggles = document.querySelectorAll<HTMLElement>(
					'.menu-toggle, .wp-block-navigation__responsive-container-open'
				);
				menuToggles.forEach((menuToggle) => {
					menuToggle.setAttribute('aria-expanded', 'false');
				});

				if (navElements && navElements.length) {
					navElements.forEach((navElement) => {
						navElement.classList.remove('nav--toggled-on');
						// Support Core Navigation Block responsive container
						if (
							navElement.classList.contains('wp-block-navigation')
						) {
							navElement
								.querySelector(
									'.wp-block-navigation__responsive-container'
								)
								?.classList.remove('is-menu-open');
						}
					});
				}
				document.body.classList.remove('mobile-menu-open');
			}
		},
		true
	); // Run in capture phase to unlock BEFORE the MutationObserver or other scripts block the change.
}

/**
 * Initializes navigation menu toggle functionality for submenus.
 * This method selects all elements with the class 'nav--toggle-sub' and applies
 * the `initEachNavToggleSubmenu` function to each of those elements.
 *
 * @return {void} This function does not return a value.
 */
function initNavToggleSubmenus(): void {
	const navTOGGLE: NodeListOf<HTMLElement> = document.querySelectorAll(
		'.nav--toggle-sub, .wp-block-navigation'
	);

	if (!navTOGGLE.length) {
		return;
	}

	navTOGGLE.forEach((nav) => initEachNavToggleSubmenu(nav));
}

/**
 * Initializes each navigation toggle submenu within a given navigation element.
 *
 * @param {HTMLElement} nav - The navigation element containing submenus.
 * @return {void} This function does not return a value.
 */
function initEachNavToggleSubmenu(nav: HTMLElement): void {
	if (nav.dataset.navSubmenuInitialized === 'true') {
		return;
	}
	nav.dataset.navSubmenuInitialized = 'true';

	const SUBMENUS: NodeListOf<HTMLElement> = nav.querySelectorAll(
		'ul.sub-menu, ul.wp-block-navigation__submenu-container'
	);

	if (!SUBMENUS.length) {
		return;
	}

	const dropdownButton = getDropdownButton();

	SUBMENUS.forEach((submenu, index) =>
		processEachSubMenu(SUBMENUS, dropdownButton, index)
	);
}

/**
 * Handles the toggle events for submenus within a given parent menu item.
 *
 * @param {ParentNode} parentMenuItem - The parent menu item that contains the submenu to be toggled.
 * @return {void}
 */
function handleToggleSubMenuEvents(parentMenuItem: ParentNode): void {
	const FOCUS_ELEMENTS_SELECTOR =
		'ul.toggle-show > li > a, ul.toggle-show > li > button';
	const anchor = parentMenuItem.querySelector<HTMLAnchorElement>('a');
	anchor?.addEventListener('focus', (e) => {
		// Fix: Type guard for currentTarget and cast to HTMLElement
		if (e.currentTarget && e.currentTarget instanceof HTMLElement) {
			// Ensure we operate relative to the parent <li> element
			const parentLi = (e.currentTarget as HTMLElement).closest(
				'li'
			) as HTMLElement | null;
			if (parentLi && parentLi.parentElement) {
				const parentMenuItemsToggled: NodeListOf<HTMLElement> =
					parentLi.parentElement.querySelectorAll(
						'li.menu-item--toggled-on'
					);
				parentMenuItemsToggled.forEach((menuItem) =>
					toggleSubMenu(menuItem, false)
				);
			}
		}
	});

	parentMenuItem.addEventListener('keydown', (e) => {
		if (
			e instanceof KeyboardEvent &&
			e.key === 'Tab' &&
			shouldToggleSubMenu(e, FOCUS_ELEMENTS_SELECTOR)
		) {
			// Always resolve to the parent <li>, even if the target is inside a button
			const parentLi = (e.target as HTMLElement).closest(
				'li'
			) as HTMLElement | null;
			if (parentLi) {
				toggleSubMenu(parentLi, false);
			}
		}
	});
}

/**
 * Determines if the sub-menu should toggle based on the provided keyboard event and focus selector.
 *
 * @param {KeyboardEvent} e             - The keyboard event that triggers the check.
 * @param {string}        focusSelector - The CSS selector used to identify focusable elements within the sub-menu.
 * @return {boolean} Returns true if the sub-menu should toggle, otherwise false.
 */
function shouldToggleSubMenu(e: KeyboardEvent, focusSelector: string): boolean {
	const container = e.shiftKey
		? isFirstFocusableElement
		: isLastFocusableElement;
	// Fix: Use document.documentElement instead of document
	return container(
		document.documentElement,
		e.target as HTMLElement,
		focusSelector
	);
}

/**
 * Initializes the navigation toggle functionality for small navigation elements.
 * This method selects all elements with the class 'nav--toggle-small' and, if any are found,
 * stores them in a global variable and initializes the toggle functionality.
 *
 * @return {void}
 */
function initNavToggleSmall(): void {
	navElements = document.querySelectorAll<HTMLElement>(
		'.nav--toggle-small, .wp-block-navigation'
	);

	if (!navElements.length) {
		return;
	}

	initEachNavToggleSmall();
}

/**
 * Helper to retrieve the mobile breakpoint dynamically from global settings,
 * CSS custom properties, or fall back to 55.
 */
function getMobileBreakpoint(): number {
	if (typeof window !== 'undefined' && (window as Window).mobileBreakpoint) {
		return (window as Window).mobileBreakpoint as number;
	}
	const rootStyles = getComputedStyle(document.documentElement);
	const breakpointStr = rootStyles
		.getPropertyValue('--mobile-breakpoint')
		.trim();
	if (breakpointStr) {
		const value = parseFloat(breakpointStr);
		if (!isNaN(value)) {
			return value;
		}
	}
	return 55; // Fallback
}

/**
 * Monitors the window for resize events and performs actions based on the window size.
 * Specifically, if the window width exceeds a specified breakpoint in em units, it triggers
 * the closure of all sub-menus.
 *
 * @return {void} No return value.
 */
function watchForWindowSizeChanges(): void {
	window.addEventListener('resize', () => {
		const width = window.innerWidth;
		const mobileBreakPoint = getMobileBreakpoint();
		const emValue =
			width /
			parseFloat(getComputedStyle(document.documentElement).fontSize);
		if (emValue > mobileBreakPoint) {
			closeAllSubMenus();
		}
	});
}

/**
 * Helper to determine if we are at or below the mobile breakpoint (55em).
 */
function isMobileWidth(): boolean {
	const width = window.innerWidth;
	const mobileBreakPoint = getMobileBreakpoint();
	const emValue =
		width / parseFloat(getComputedStyle(document.documentElement).fontSize);
	return emValue <= mobileBreakPoint;
}

/**
 * Processes each submenu by checking its parent element, possibly creating a dropdown,
 * attaches toggle button functionality and event listeners for handling submenu actions.
 *
 * @param {NodeListOf<HTMLElement>} SUBMENUS       - The list of submenu elements.
 * @param {HTMLElement}             dropdownButton - The button used to toggle the dropdown.
 * @param {number}                  index          - The index of the current submenu in the SUBMENUS list.
 * @return {void}
 */
function processEachSubMenu(
	SUBMENUS: NodeListOf<HTMLElement>,
	dropdownButton: HTMLElement,
	index: number
): void {
	const parentMenuItem = SUBMENUS[index].parentNode as HTMLElement;
	const isNavigationBlock = parentMenuItem.classList.contains(
		'wp-block-navigation-item'
	);
	//let dropdown = parentMenuItem.querySelector< HTMLElement >( '.dropdown' );

	// if ( ! dropdown && ! isNavigationBlock ) {
	// 	dropdown = createDropdown( parentMenuItem, SUBMENUS, index );
	// 	parentMenuItem.insertBefore( dropdown, SUBMENUS[ index ] );
	// }

	if (!isNavigationBlock) {
		// Nothing to do for standard menus.
	} else {
		let toggleBtn = parentMenuItem.querySelector<HTMLElement>(
			'.wp-block-navigation-submenu__toggle'
		);

		if (!toggleBtn) {
			// If there is no toggle button, dynamically create one with a caret SVG!
			toggleBtn = document.createElement('button');
			toggleBtn.classList.add(
				'wp-block-navigation-submenu__toggle',
				'dropdown-toggle'
			);
			toggleBtn.setAttribute('aria-expanded', 'false');
			toggleBtn.setAttribute('aria-label', wpRigScreenReaderText.expand);
			toggleBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="wp-block-navigation-submenu__toggle-and-navigation-item__arrow-icon"><path d="M7 10l5 5 5-5z"/></svg>`;

			// Insert the toggle button right before the submenu ul inside parentMenuItem
			parentMenuItem.insertBefore(toggleBtn, SUBMENUS[index]);
		}

		toggleBtn.addEventListener('click', (e) => {
			// Ensure we pass the parent <li>
			const parentLi = (e.currentTarget as HTMLElement).closest(
				'li'
			) as HTMLElement | null;
			if (parentLi) {
				toggleSubMenu(parentLi);
			}
		});
	}

	const subMenuParentLink =
		parentMenuItem.querySelector<HTMLAnchorElement>(':scope > a');

	// Handle menu items with no link or "#" as href
	if (
		!subMenuParentLink ||
		(subMenuParentLink &&
			(subMenuParentLink.getAttribute('href') === '#' ||
				subMenuParentLink.getAttribute('href') === '' ||
				subMenuParentLink.getAttribute('href') === null))
	) {
		// If there is a link, add the click event to it
		if (subMenuParentLink) {
			subMenuParentLink.addEventListener('click', (e) => {
				e.preventDefault();
				// Ensure we pass the parent <li>
				const parentLi = (e.currentTarget as HTMLElement).closest(
					'li'
				) as HTMLElement | null;
				if (parentLi) {
					toggleSubMenu(parentLi);
				}
			});
		}

		// For items with no link, make the entire menu item clickable
		if (!subMenuParentLink) {
			parentMenuItem.style.cursor = 'pointer';
			parentMenuItem.addEventListener('click', (e) => {
				// Only handle clicks directly on the parent item, not its children
				if (
					e.target === parentMenuItem ||
					parentMenuItem.contains(e.target as Node)
				) {
					// Don't toggle if the click was on a child link or button
					const isChildLink = (e.target as HTMLElement).closest(
						'a, button'
					);
					if (
						!isChildLink ||
						isChildLink.parentElement === parentMenuItem
					) {
						toggleSubMenu(parentMenuItem);
					}
				}
			});
		}
	} else if (subMenuParentLink) {
		// Parent has a valid link and also has children: on mobile, clicking the parent link should toggle
		subMenuParentLink.addEventListener('click', (e) => {
			if (isMobileWidth()) {
				e.preventDefault();
				const parentLi = (e.currentTarget as HTMLElement).closest(
					'li'
				) as HTMLElement | null;
				if (parentLi) {
					toggleSubMenu(parentLi);
				}
			}
		});
	}

	handleToggleSubMenuEvents(parentMenuItem);
	parentMenuItem.classList.add('menu-item--has-toggle');
}

/**
 * Initializes the navigation toggle for a given navigation element, setting up
 * aria attributes and click event listeners to handle the toggling of the navigation menu.
 *
 * @return {void} This function does not return a value.
 */
function initEachNavToggleSmall(): void {
	const menuToggles = document.querySelectorAll<HTMLElement>(
		'.menu-toggle, .wp-block-navigation__responsive-container-open'
	);

	if (!menuToggles) {
		return;
	}

	menuToggles.forEach((menuToggle) => {
		menuToggle.setAttribute('aria-expanded', 'false');

		menuToggle.addEventListener('click', toggleMenuToggleState);
	});

	// Note: MutationObserver for menu locking is initialized in initNavigation().
	// See initMenuLockObserver() at the bottom of this file.
}

function toggleMenuToggleState(e: Event) {
	const menuToggles = document.querySelectorAll<HTMLElement>(
		'.menu-toggle, .wp-block-navigation__responsive-container-open'
	);

	if (!menuToggles.length) {
		return;
	}

	// Get the current toggle that was clicked
	const currentToggle = e.currentTarget as HTMLElement;

	// Determine the new state based on the clicked toggle
	const newExpandedState =
		currentToggle.getAttribute('aria-expanded') === 'false'
			? 'true'
			: 'false';

	// Handle menu lock (Alt + Click to lock/unlock)
	if (newExpandedState === 'true' && (e as MouseEvent).altKey) {
		isMenuLocked = true;
		document.body.classList.add('mobile-menu-locked');
		// eslint-disable-next-line no-console
		console.log('WP Rig: Mobile menu locked for debugging.');
	} else if (newExpandedState === 'false') {
		isMenuLocked = false;
		document.body.classList.remove('mobile-menu-locked');
	}

	// Update all menu toggles to maintain sync
	menuToggles.forEach((menuToggle) => {
		menuToggle.setAttribute('aria-expanded', newExpandedState);
	});

	// Toggle all navigation elements that have the 'nav--toggle-small' class
	if (navElements && navElements.length) {
		navElements.forEach((navElement) => {
			if (newExpandedState === 'true') {
				navElement.classList.add('nav--toggled-on');
				document.body.classList.add('mobile-menu-open');

				// Support Core Navigation Block responsive container
				if (navElement.classList.contains('wp-block-navigation')) {
					navElement
						.querySelector(
							'.wp-block-navigation__responsive-container'
						)
						?.classList.add('is-menu-open');
				}
			} else {
				navElement.classList.remove('nav--toggled-on');
				document.body.classList.remove('mobile-menu-open');

				// Support Core Navigation Block responsive container
				if (navElement.classList.contains('wp-block-navigation')) {
					navElement
						.querySelector(
							'.wp-block-navigation__responsive-container'
						)
						?.classList.remove('is-menu-open');
				}
			}
		});
	}
}

/**
 * Toggles the sub-menu visibility and accessibility attributes for a given parent menu item.
 *
 * @param {HTMLElement} parentMenuItem            - The parent menu item whose sub-menu is to be toggled.
 * @param {boolean}     [limitOpenSubmenus=false] - If set to true, limits the number of open submenus to one.
 * @return {void}
 */
function toggleSubMenu(
	parentMenuItem: HTMLElement,
	limitOpenSubmenus = false
): void {
	const subMenu = parentMenuItem.querySelector<HTMLElement>('ul');
	if (!subMenu) {
		return;
	}

	const toggleButton = parentMenuItem.querySelector<HTMLElement>(
		'.dropdown-toggle, .wp-block-navigation-submenu__toggle'
	);

	const parentMenuItemToggled = parentMenuItem.classList.contains(
		'menu-item--toggled-on'
	);

	if (toggleButton) {
		if (
			!toggleButton.classList.contains(
				'wp-block-navigation-submenu__toggle'
			)
		) {
			toggleButton.setAttribute(
				'aria-expanded',
				(!parentMenuItemToggled).toString()
			);
		}
	}

	if (parentMenuItemToggled) {
		parentMenuItem.classList.remove('menu-item--toggled-on');
		subMenu.classList.remove('toggle-show');
		if (toggleButton) {
			toggleButton.setAttribute(
				'aria-label',
				wpRigScreenReaderText.collapse
			);
		}

		if (limitOpenSubmenus) {
			const subMenuItemsToggled =
				parentMenuItem.querySelectorAll<HTMLElement>(
					'.menu-item--toggled-on'
				);
			subMenuItemsToggled.forEach((menuItem) => toggleSubMenu(menuItem));
		}
	} else {
		if (limitOpenSubmenus) {
			const parentMenuItemsToggled =
				parentMenuItem.parentNode!.querySelectorAll<HTMLElement>(
					'li.menu-item--toggled-on'
				);
			parentMenuItemsToggled.forEach((menuItem) =>
				toggleSubMenu(menuItem)
			);
		}

		parentMenuItem.classList.add('menu-item--toggled-on');
		subMenu.classList.add('toggle-show');
		if (toggleButton) {
			toggleButton.setAttribute(
				'aria-label',
				wpRigScreenReaderText.expand
			);
		}
	}
}

/**
 * Closes all submenu items by toggling them off.
 *
 * @return {void} No return value.
 */
function closeAllSubMenus(): void {
	const toggledMenuItems = document.querySelectorAll<HTMLElement>(
		'.menu-item--toggled-on'
	);
	toggledMenuItems.forEach((menuItem) => toggleSubMenu(menuItem));
}

/**
 * Creates and returns a dropdown toggle button element.
 *
 * The button element will have the 'dropdown-toggle' class,
 * an 'aria-expanded' attribute set to 'false', and
 * an 'aria-label' attribute with the text for expanding
 * the dropdown from the global wpRigScreenReaderText object.
 *
 * @return {HTMLElement} The configured dropdown button element.
 */
function getDropdownButton(): HTMLElement {
	const dropdownButton = document.createElement('button');
	dropdownButton.classList.add('dropdown-toggle');
	dropdownButton.setAttribute('aria-expanded', 'false');
	dropdownButton.setAttribute('aria-label', wpRigScreenReaderText.expand);
	return dropdownButton;
}

/**
 * Determines if the given element is the first focusable element within a specified container according to the provided focus selector.
 *
 * @param {HTMLElement} container     - The container element within which to search for focusable elements.
 * @param {HTMLElement} element       - The element to check if it is the first focusable element.
 * @param {string}      focusSelector - The selector used to identify focusable elements within the container.
 * @return {boolean} - Returns true if the element is the first focusable element in the container, otherwise returns false.
 */
function isFirstFocusableElement(
	container: HTMLElement,
	element: HTMLElement,
	focusSelector: string
): boolean {
	const focusableElements =
		container.querySelectorAll<HTMLElement>(focusSelector);
	return focusableElements.length > 0 && element === focusableElements[0];
}

/**
 * Checks if the given element is the last focusable element within a specified container.
 *
 * @param {HTMLElement} container     - The container within which to search for focusable elements.
 * @param {HTMLElement} element       - The element to check if it is the last focusable within the container.
 * @param {string}      focusSelector - The CSS selector string that identifies focusable elements.
 * @return {boolean} True if the element is the last focusable element within the container, otherwise false.
 */
function isLastFocusableElement(
	container: HTMLElement,
	element: HTMLElement,
	focusSelector: string
): boolean {
	const focusableElements =
		container.querySelectorAll<HTMLElement>(focusSelector);
	return (
		focusableElements.length > 0 &&
		element === focusableElements[focusableElements.length - 1]
	);
}

/**
 * Detects if the browser supports CSS Anchor Positioning.
 *
 * @return {boolean} True if the browser supports CSS Anchor Positioning, otherwise false.
 */
function supportsAnchorPositioning(): boolean {
	return (
		typeof CSS !== 'undefined' &&
		'supports' in CSS &&
		CSS.supports('position-anchor', '--foo')
	);
}

/**
 * Initializes an IntersectionObserver to detect when submenus overflow the viewport.
 * This acts as the JS fallback for browsers that do not support native CSS Anchor Positioning.
 *
 * @return {void}
 */
function initSubmenuCollisionObserver(): void {
	// Skip JS initialization if native browser support is present
	if (supportsAnchorPositioning()) {
		return;
	}

	const submenus = document.querySelectorAll<HTMLElement>(
		'ul.sub-menu, ul.wp-block-navigation__submenu-container'
	);

	if (!submenus.length || !('IntersectionObserver' in window)) {
		return;
	}

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				const submenu = entry.target as HTMLElement;
				// Submenu is visible if its bounding width is non-zero
				const isVisible = entry.boundingClientRect.width > 0;

				if (isVisible) {
					const viewportWidth = document.documentElement.clientWidth;
					const overflowsRight =
						entry.boundingClientRect.right > viewportWidth;
					const overflowsLeft = entry.boundingClientRect.left < 0;

					if (overflowsRight) {
						submenu.classList.add('open-left');
					} else if (overflowsLeft) {
						// Keep it aligned left if it overflows left
						submenu.classList.remove('open-left');
					}
				} else {
					// Clean up the class when the menu is closed
					submenu.classList.remove('open-left');
				}
			});
		},
		{
			root: null, // Relative to viewport
			threshold: [0.99, 1.0], // Trigger when fully displayed / slightly clipped
		}
	);

	submenus.forEach((submenu) => observer.observe(submenu));
}

/**
 * Initializes a MutationObserver to keep the mobile menu open when locked.
 * This prevents other scripts (like WP Core Interactivity API) from auto-closing the menu or submenus.
 */
function initMenuLockObserver(): void {
	if (typeof MutationObserver === 'undefined') {
		return;
	}

	const observer = new MutationObserver(() => {
		if (!isMenuLocked) {
			return;
		}

		// 1. Ensure global mobile menu classes are present
		if (!document.body.classList.contains('mobile-menu-open')) {
			document.body.classList.add('mobile-menu-open');
		}
		if (!document.documentElement.classList.contains('has-modal-open')) {
			document.documentElement.classList.add('has-modal-open');
		}

		// 2. Ensure main navigation elements have the toggled-on class
		const currentNavElements = document.querySelectorAll<HTMLElement>(
			'.nav--toggle-small, .wp-block-navigation'
		);
		currentNavElements.forEach((nav) => {
			if (!nav.classList.contains('nav--toggled-on')) {
				nav.classList.add('nav--toggled-on');
			}

			// Support Core Navigation Block responsive container
			if (nav.classList.contains('wp-block-navigation')) {
				const responsiveContainer = nav.querySelector(
					'.wp-block-navigation__responsive-container'
				);
				if (
					responsiveContainer &&
					!responsiveContainer.classList.contains('is-menu-open')
				) {
					responsiveContainer.classList.add('is-menu-open');
				}
			}
		});

		// 3. Ensure all mobile menu toggles show expanded state
		const menuToggles = document.querySelectorAll<HTMLElement>(
			'.menu-toggle, .wp-block-navigation__responsive-container-open'
		);
		menuToggles.forEach((toggle) => {
			if (toggle.getAttribute('aria-expanded') !== 'true') {
				toggle.setAttribute('aria-expanded', 'true');
			}
		});

		// 4. Ensure submenus that were open remain open
		const openSubmenus = document.querySelectorAll<HTMLElement>(
			'.menu-item--toggled-on'
		);
		openSubmenus.forEach((li) => {
			const ul = li.querySelector<HTMLElement>('ul');
			if (ul && !ul.classList.contains('toggle-show')) {
				ul.classList.add('toggle-show');
			}
			const toggle = li.querySelector<HTMLElement>(
				'.dropdown-toggle, .wp-block-navigation-submenu__toggle'
			);
			if (toggle && toggle.getAttribute('aria-expanded') !== 'true') {
				toggle.setAttribute('aria-expanded', 'true');
			}
		});
	});

	// Observe body and document element for class changes
	observer.observe(document.body, {
		attributes: true,
		attributeFilter: ['class'],
	});
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ['class'],
	});

	// Use subtree observation on the body to catch internal state changes in nav blocks
	observer.observe(document.body, {
		attributes: true,
		subtree: true,
		attributeFilter: ['class', 'aria-expanded'],
	});
}
