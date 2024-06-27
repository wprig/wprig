/* global wpRigScreenReaderText */
/**
 * File navigation.js.
 *
 * Handles toggling the navigation menu for small screens and enables TAB key
 * navigation support for dropdown menus.
 */

if ( 'loading' === document.readyState ) {
	// The DOM has not yet been loaded.
	document.addEventListener( 'DOMContentLoaded', initNavigation );
} else {
	// The DOM has already been loaded.
	initNavigation();
}

// Initiate the menus when the DOM loads.
function initNavigation() {
	initNavToggleSubmenus();
	initNavToggleSmall();
	setMenuHeight();
	watchForWindowSizeChanges();
}

/**
 * Initiate the script to process all
 * navigation menus with submenu toggle enabled.
 */
function initNavToggleSubmenus() {
	const navTOGGLE = document.querySelectorAll( '.nav--toggle-sub' );

	// No point if no navs.
	if ( ! navTOGGLE.length ) {
		return;
	}

	for ( let i = 0; i < navTOGGLE.length; i++ ) {
		initEachNavToggleSubmenu( navTOGGLE[ i ] );
	}
}

/**
 * Initializes each navigation toggle submenu.
 *
 * @param {HTMLElement} nav - The navigation element.
 * @return {void} - Does not return a value.
 */
function initEachNavToggleSubmenu( nav ) {
	const SUBMENUS = nav.querySelectorAll( 'ul.sub-menu, ul.wp-block-navigation__submenu-container' );
	const submenusLength = SUBMENUS.length;

	if ( ! submenusLength ) {
		return;
	}

	const dropdownButton = getDropdownButton();

	for ( let i = 0; i < SUBMENUS.length; i++ ) {
		processEachSubMenu( SUBMENUS, dropdownButton, i );
	}
}

/**
 * Handles the toggle events for the sub menu.
 *
 * @param {ParentNode} parentMenuItem - The parent menu item element.
 * @return {void}
 */
function handleToggleSubMenuEvents( parentMenuItem ) {
	const FOCUS_ELEMENTS_SELECTOR = 'ul.toggle-show > li > a, ul.toggle-show > li > button';
	parentMenuItem.querySelector( 'a' ).addEventListener( 'focus', ( e ) => {
		const parentMenuItemsToggled = e.target.parentNode.parentNode.querySelectorAll( 'li.menu-item--toggled-on' );
		for ( let j = 0; j < parentMenuItemsToggled.length; j++ ) {
			toggleSubMenu( parentMenuItemsToggled[ j ], false );
		}
	} );

	parentMenuItem.addEventListener( 'keydown', ( e ) => {
		if ( 'Tab' === e.key && shouldToggleSubMenu( e, FOCUS_ELEMENTS_SELECTOR ) ) {
			const { parentNode } = e.target;
			toggleSubMenu( parentNode, false );
		}
	} );
}

/**
 * Checks whether to toggle submenu based on the key event and focus selector.
 *
 * @param {Object} e - The key event.
 * @param {string} focusSelector - The focus selector.
 * @return {boolean} - Returns true if the submenu should be toggled, otherwise false.
 */
function shouldToggleSubMenu( e, focusSelector ) {
	if ( e.shiftKey ) {
		return isFirstFocusableElement( e.target, document.activeElement, focusSelector );
	}
	return isLastFocusableElement( e.target, document.activeElement, focusSelector );
}

/**
 * Initiate the script to process all
 * navigation menus with small toggle enabled.
 */
function initNavToggleSmall() {
	const navTOGGLE = document.querySelectorAll( '.nav--toggle-small' );

	// No point if no navs.
	if ( ! navTOGGLE.length ) {
		return;
	}

	for ( let i = 0; i < navTOGGLE.length; i++ ) {
		initEachNavToggleSmall( navTOGGLE[ i ] );
	}
}

/**
 * Sets the height of the primary menu container.
 * The height is set to the full document height if the window's outer width is less than or equal to 800 pixels.
 *
 * @return {void}
 */
function setMenuHeight() {
	if ( window.outerWidth <= 800 ) {
		const docHeight = document.body.scrollHeight;
		const menuElement = document.querySelector( '.primary-menu-container' );
		if ( menuElement ) {
			menuElement.style.height = docHeight + 'px';
		}
	}
}

/**
 * Listens for changes in window size and executes a specific action if the window size exceeds a mobile breakpoint.
 *
 * @return {void}
 */
function watchForWindowSizeChanges() {
	window.addEventListener( 'resize', function() {
		const width = window.innerWidth;
		const mobileBreakPoint = 55;
		const emValue = width / Number( getComputedStyle( document.documentElement ).fontSize.slice( 0, -2 ) );
		if ( emValue > mobileBreakPoint ) {
			closeAllSubMenus();
		}
	} );
}

/**
 * Processes each sub menu item.
 *
 * @param {NodeList} SUBMENUS - The list of sub menus.
 * @param {HTMLElement} dropdownButton - The dropdown button element.
 * @param {number} i - The index of the current sub menu item.
 * @return {void}
 */
function processEachSubMenu( SUBMENUS, dropdownButton, i ) {
	const parentMenuItem = SUBMENUS[ i ].parentNode;
	const isNavigationBlock = parentMenuItem.classList.contains( 'wp-block-navigation-item' );
	let dropdown = parentMenuItem.querySelector( '.dropdown' );

	if ( ! dropdown && ! isNavigationBlock ) {
		dropdown = createDropdown( parentMenuItem, SUBMENUS, i );
		parentMenuItem.insertBefore( dropdown, SUBMENUS[ i ] );
	}

	if ( ! isNavigationBlock ) {
		convertDropdownToToggleButton( dropdown, dropdownButton );
	} else {
		parentMenuItem.querySelector( '.wp-block-navigation-submenu__toggle' ).addEventListener( 'click', ( e ) => {
			const { parentNode } = e.currentTarget;
			toggleSubMenu( parentNode );
		} );
	}

	// if the SUBMENU sibling <a> element href is equal to #, then make the <a> element toggle the submenu like the toggle button does
	const subMenuParentLink = parentMenuItem.querySelector( ':scope > a' );
	if ( subMenuParentLink && subMenuParentLink.getAttribute( 'href' ) === '#' ) {
		subMenuParentLink.addEventListener( 'click', ( e ) => {
			e.preventDefault();
			const { parentNode } = e.currentTarget;
			toggleSubMenu( parentNode );
		} );
	}

	handleToggleSubMenuEvents( parentMenuItem );
	parentMenuItem.classList.add( 'menu-item--has-toggle' );
}

/**
 * Creates a dropdown for a parent menu item.
 *
 * @param {ParentNode} parentMenuItem - The parent menu item to create dropdown for.
 * @param {NodeList} SUBMENUS - The array of submenus.
 * @param {number} i - The index of the submenu to insert the dropdown before.
 * @return {HTMLElement} - The created dropdown element.
 */
function createDropdown( parentMenuItem, SUBMENUS, i ) {
	const dropdown = document.createElement( 'span' );
	dropdown.classList.add( 'dropdown' );
	const dropdownSymbol = document.createElement( 'i' );
	dropdownSymbol.classList.add( 'dropdown-symbol' );
	dropdown.appendChild( dropdownSymbol );
	parentMenuItem.insertBefore( dropdown, SUBMENUS[ i ] );
	return dropdown;
}

/**
 * Converts a dropdown to a toggle button.
 *
 * @param {HTMLElement} dropdown - The dropdown element to convert.
 * @param {HTMLElement} dropdownButton - The button element to replace the dropdown with.
 *
 * @return {void}
 */
function convertDropdownToToggleButton( dropdown, dropdownButton ) {
	const thisDropdownButton = dropdownButton.cloneNode( true );
	thisDropdownButton.innerHTML = dropdown.innerHTML;
	dropdown.parentNode.replaceChild( thisDropdownButton, dropdown );
	thisDropdownButton.addEventListener( 'click', ( e ) => {
		const { parentNode } = e.currentTarget;
		toggleSubMenu( parentNode );
	} );
}

/**
 * Initiate the script to process small
 * navigation toggle for a specific navigation menu.
 * @param {Object} nav Navigation element.
 */
function initEachNavToggleSmall( nav ) {
	const menuTOGGLE = nav.querySelector( '.menu-toggle' );

	// Return early if MENUTOGGLE is missing.
	if ( ! menuTOGGLE ) {
		return;
	}

	// Add an initial values for the attribute.
	menuTOGGLE.setAttribute( 'aria-expanded', 'false' );

	menuTOGGLE.addEventListener( 'click', ( e ) => {
		nav.classList.toggle( 'nav--toggled-on' );
		e.target.setAttribute( 'aria-expanded', 'false' === e.target.getAttribute( 'aria-expanded' ) ? 'true' : 'false' );
	}, false );
}

/**
 * Toggle submenus open and closed, and tell screen readers what's going on.
 * @param {Object} parentMenuItem Parent menu element.
 * @param {boolean} limitOpenSubmenus Toggle for enabling the auto closing of non-target submenus.
 * @return {void}
 */
function toggleSubMenu( parentMenuItem, limitOpenSubmenus = false ) {
	const toggleButton = parentMenuItem.querySelector( '.dropdown-toggle, .wp-block-navigation-submenu__toggle' ),
		subMenu = parentMenuItem.querySelector( 'ul' );
	const parentMenuItemToggled = parentMenuItem.classList.contains( 'menu-item--toggled-on' );

	// Toggle aria-expanded status.
	if ( ! toggleButton.classList.contains( 'wp-block-navigation-submenu__toggle' ) ) {
		toggleButton.setAttribute( 'aria-expanded', ( ! parentMenuItemToggled ).toString() );
	}

	/*
	 * Steps to handle during toggle:
	 * - Let the parent menu item know we're toggled on/off.
	 * - Toggle the ARIA label to let screen readers know will expand or collapse.
	 */
	if ( parentMenuItemToggled ) {
		// Toggle "off" the submenu.
		parentMenuItem.classList.remove( 'menu-item--toggled-on' );
		subMenu.classList.remove( 'toggle-show' );
		toggleButton.setAttribute( 'aria-label', wpRigScreenReaderText.collapse );

		// Make sure all children are closed.
		if ( limitOpenSubmenus ) {
			const subMenuItemsToggled = parentMenuItem.querySelectorAll( '.menu-item--toggled-on' );
			for ( let i = 0; i < subMenuItemsToggled.length; i++ ) {
				toggleSubMenu( subMenuItemsToggled[ i ] );
			}
		}
	} else {
		// Make sure siblings are closed.
		if ( limitOpenSubmenus ) {
			const parentMenuItemsToggled = parentMenuItem.parentNode.querySelectorAll( 'li.menu-item--toggled-on' );
			for ( let i = 0; i < parentMenuItemsToggled.length; i++ ) {
				toggleSubMenu( parentMenuItemsToggled[ i ] );
			}
		}

		// Toggle "on" the submenu.
		parentMenuItem.classList.add( 'menu-item--toggled-on' );
		subMenu.classList.add( 'toggle-show' );
		toggleButton.setAttribute( 'aria-label', wpRigScreenReaderText.expand );
	}
}

/**
 * Closes all submenus that are currently toggled on.
 *
 * @return {void}
 */
function closeAllSubMenus() {
	const toggledMenuItems = document.querySelectorAll( '.menu-item--toggled-on' );

	for ( let i = 0; i < toggledMenuItems.length; i++ ) {
		toggleSubMenu( toggledMenuItems[ i ] );
	}
}

/**
 * Returns the dropdown button
 * element needed for the menu.
 * @return {Object} drop-down button element
 */
function getDropdownButton() {
	const dropdownButton = document.createElement( 'button' );
	dropdownButton.classList.add( 'dropdown-toggle' );
	dropdownButton.setAttribute( 'aria-expanded', 'false' );
	dropdownButton.setAttribute( 'aria-label', wpRigScreenReaderText.expand );
	return dropdownButton;
}

/**
 * Returns true if element is the
 * first focusable element in the container.
 * @param {Object} container
 * @param {Object} element
 * @param {string} focusSelector
 * @return {boolean} whether or not the element is the first focusable element in the container
 */
function isFirstFocusableElement( container, element, focusSelector ) {
	const focusableElements = container.querySelectorAll( focusSelector );
	if ( 0 < focusableElements.length ) {
		return element === focusableElements[ 0 ];
	}
	return false;
}

/**
 * Returns true if element is the
 * last focusable element in the container.
 * @param {Object} container
 * @param {Object} element
 * @param {string} focusSelector
 * @return {boolean} whether or not the element is the last focusable element in the container
 */
function isLastFocusableElement( container, element, focusSelector ) {
	const focusableElements = container.querySelectorAll( focusSelector );
	if ( 0 < focusableElements.length ) {
		return element === focusableElements[ focusableElements.length - 1 ];
	}
	return false;
}
