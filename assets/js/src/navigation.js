/* global wpRigScreenReaderText */
/**
 * File navigation.js.
 *
 * Handles toggling the navigation menu for small screens and enables TAB key
 * navigation support for dropdown menus.
 */

const KEYMAP = {
	TAB: 9,
};

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
 * Initiate the script to process submenu
 * navigation toggle for a specific navigation menu.
 * @param {Object} nav Navigation element.
 */
function initEachNavToggleSubmenu( nav ) {
	// Get the submenus.
	const SUBMENUS = nav.querySelectorAll( '.menu ul' );

	// No point if no submenus.
	if ( ! SUBMENUS.length ) {
		return;
	}

	// Create the dropdown button.
	const dropdownButton = getDropdownButton();

	for ( let i = 0; i < SUBMENUS.length; i++ ) {
		const parentMenuItem = SUBMENUS[ i ].parentNode;
		let dropdown = parentMenuItem.querySelector( '.dropdown' );

		// If no dropdown, create one.
		if ( ! dropdown ) {
			// Create dropdown.
			dropdown = document.createElement( 'span' );
			dropdown.classList.add( 'dropdown' );

			const dropdownSymbol = document.createElement( 'i' );
			dropdownSymbol.classList.add( 'dropdown-symbol' );
			dropdown.appendChild( dropdownSymbol );

			// Add before submenu.
			SUBMENUS[ i ].parentNode.insertBefore( dropdown, SUBMENUS[ i ] );
		}

		// Convert dropdown to button.
		const thisDropdownButton = dropdownButton.cloneNode( true );

		// Copy contents of dropdown into button.
		thisDropdownButton.innerHTML = dropdown.innerHTML;

		// Replace dropdown with toggle button.
		dropdown.parentNode.replaceChild( thisDropdownButton, dropdown );

		// Toggle the submenu when we click the dropdown button.
		thisDropdownButton.addEventListener( 'click', ( e ) => {
			toggleSubMenu( e.target.parentNode );
		} );

		// Clean up the toggle if a mouse takes over from keyboard.
		parentMenuItem.addEventListener( 'mouseleave', ( e ) => {
			toggleSubMenu( e.target, false );
		} );

		// When we focus on a menu link, make sure all siblings are closed.
		parentMenuItem.querySelector( 'a' ).addEventListener( 'focus', ( e ) => {
			const parentMenuItemsToggled = e.target.parentNode.parentNode.querySelectorAll( 'li.menu-item--toggled-on' );
			for ( let j = 0; j < parentMenuItemsToggled.length; j++ ) {
				toggleSubMenu( parentMenuItemsToggled[ j ], false );
			}
		} );

		// Handle keyboard accessibility for traversing menu.
		SUBMENUS[ i ].addEventListener( 'keydown', ( e ) => {
			// These specific selectors help us only select items that are visible.
			const focusSelector = 'ul.toggle-show > li > a, ul.toggle-show > li > button';

			if ( KEYMAP.TAB === e.keyCode ) {
				if ( e.shiftKey ) {
					// Means we're tabbing out of the beginning of the submenu.
					if ( isfirstFocusableElement( e.target, document.activeElement, focusSelector ) ) {
						toggleSubMenu( e.target.parentNode, false );
					}
					// Means we're tabbing out of the end of the submenu.
				} else if ( islastFocusableElement( e.target, document.activeElement, focusSelector ) ) {
					toggleSubMenu( e.target.parentNode, false );
				}
			}
		} );

		SUBMENUS[ i ].parentNode.classList.add( 'menu-item--has-toggle' );
	}
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
 * @param {boolean} forceToggle Force the menu toggle.
 * @return {void}
 */
function toggleSubMenu( parentMenuItem, forceToggle ) {
	const toggleButton = parentMenuItem.querySelector( '.dropdown-toggle' ),
		subMenu = parentMenuItem.querySelector( 'ul' );
	let parentMenuItemToggled = parentMenuItem.classList.contains( 'menu-item--toggled-on' );

	// Will be true if we want to force the toggle on, false if force toggle close.
	if ( undefined !== forceToggle && 'boolean' === ( typeof forceToggle ) ) {
		parentMenuItemToggled = ! forceToggle;
	}

	// Toggle aria-expanded status.
	toggleButton.setAttribute( 'aria-expanded', ( ! parentMenuItemToggled ).toString() );

	/*
	 * Steps to handle during toggle:
	 * - Let the parent menu item know we're toggled on/off.
	 * - Toggle the ARIA label to let screen readers know will expand or collapse.
	 */
	if ( parentMenuItemToggled ) {
		// Toggle "off" the submenu.
		parentMenuItem.classList.remove( 'menu-item--toggled-on' );
		subMenu.classList.remove( 'toggle-show' );
		toggleButton.setAttribute( 'aria-label', wpRigScreenReaderText.expand );

		// Make sure all children are closed.
		const subMenuItemsToggled = parentMenuItem.querySelectorAll( '.menu-item--toggled-on' );
		for ( let i = 0; i < subMenuItemsToggled.length; i++ ) {
			toggleSubMenu( subMenuItemsToggled[ i ], false );
		}
	} else {
		// Make sure siblings are closed.
		const parentMenuItemsToggled = parentMenuItem.parentNode.querySelectorAll( 'li.menu-item--toggled-on' );
		for ( let i = 0; i < parentMenuItemsToggled.length; i++ ) {
			toggleSubMenu( parentMenuItemsToggled[ i ], false );
		}

		// Toggle "on" the submenu.
		parentMenuItem.classList.add( 'menu-item--toggled-on' );
		subMenu.classList.add( 'toggle-show' );
		toggleButton.setAttribute( 'aria-label', wpRigScreenReaderText.collapse );
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
function isfirstFocusableElement( container, element, focusSelector ) {
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
function islastFocusableElement( container, element, focusSelector ) {
	const focusableElements = container.querySelectorAll( focusSelector );
	if ( 0 < focusableElements.length ) {
		return element === focusableElements[ focusableElements.length - 1 ];
	}
	return false;
}
