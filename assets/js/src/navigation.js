/**
 * File navigation.js.
 *
 * Handles toggling the navigation menu for small screens and enables TAB key
 * navigation support for dropdown menus.
 */

const KEYMAP = {
		TAB: 9
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

	navTOGGLE.forEach( function( nav ) {
		initEachNavToggleSubmenu( nav );
	});
}

/**
 * Initiate the script to process submenu
 * navigation toggle for a specific navigation menu.
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

	SUBMENUS.forEach( function( submenu ) {
		const parentMenuItem = submenu.parentNode;
		var dropdown = parentMenuItem.querySelector( '.dropdown' );

		// If no dropdown, create one.
		if ( ! dropdown ) {

			// Create dropdown.
			dropdown = document.createElement( 'span' );
			dropdown.classList.add( 'dropdown' );

			const dropdownSymbol = document.createElement( 'i' );
			dropdownSymbol.classList.add( 'dropdown-symbol' );
			dropdown.appendChild( dropdownSymbol );

			// Add before submenu.
			submenu.parentNode.insertBefore( dropdown, submenu );

		}

		// Convert dropdown to button.
		const thisDropdownButton = dropdownButton.cloneNode( true );

		// Copy contents of dropdown into button.
		thisDropdownButton.innerHTML = dropdown.innerHTML;

		// Replace dropdown with toggle button.
		dropdown.parentNode.replaceChild( thisDropdownButton, dropdown );

		// Toggle the submenu when we click the dropdown button.
		thisDropdownButton.addEventListener( 'click', function( event ) {
			toggleSubMenu( this.parentNode );
		});

		// Clean up the toggle if a mouse takes over from keyboard.
		parentMenuItem.addEventListener( 'mouseleave', function( event ) {
			toggleSubMenu( this, false );
		});

		// When we focus on a menu link, make sure all siblings are closed.
		parentMenuItem.querySelector( 'a' ).addEventListener( 'focus', function( event ) {
			this.parentNode.parentNode.querySelectorAll( 'li.menu-item--toggled-on' ).forEach( function( item ) {
				toggleSubMenu( item, false );
			});
		});

		// Handle keyboard accessibility for traversing menu.
		submenu.addEventListener( 'keydown', function( event ) {

			// These specific selectors help us only select items that are visible.
			const focusSelector = 'ul.toggle-show > li > a, ul.toggle-show > li > button';

			if ( KEYMAP.TAB === event.keyCode ) {
				if ( event.shiftKey ) {

					// Means we're tabbing out of the beginning of the submenu.
					if ( isfirstFocusableElement( this, document.activeElement, focusSelector ) ) {
						toggleSubMenu( this.parentNode, false );
					}
				} else {

					// Means we're tabbing out of the end of the submenu.
					if ( islastFocusableElement( this, document.activeElement, focusSelector ) ) {
						toggleSubMenu( this.parentNode, false );
					}
				}
			}
		});

		submenu.parentNode.classList.add( 'menu-item--has-toggle' );

	});
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

	navTOGGLE.forEach( function( nav ) {
		initEachNavToggleSmall( nav );
	});
}

/**
 * Initiate the script to process small
 * navigation toggle for a specific navigation menu.
 */
function initEachNavToggleSmall( nav ) {

	const menuTOGGLE = nav.querySelector( '.menu-toggle' );

	// Return early if MENUTOGGLE is missing.
	if ( ! menuTOGGLE ) {
		return;
	}

	// Add an initial values for the attribute.
	menuTOGGLE.setAttribute( 'aria-expanded', 'false' );

	menuTOGGLE.addEventListener( 'click', function() {
		nav.classList.toggle( 'nav--toggled-on' );
		this.setAttribute( 'aria-expanded', 'false' === this.getAttribute( 'aria-expanded' ) ? 'true' : 'false' );
	}, false );
}

/**
 * Toggle submenus open and closed, and tell screen readers what's going on.
 */
function toggleSubMenu( parentMenuItem, forceToggle ) {
	const toggleButton = parentMenuItem.querySelector( '.dropdown-toggle' ),
		subMenu = parentMenuItem.querySelector( 'ul' );
	var parentMenuItemToggled = parentMenuItem.classList.contains( 'menu-item--toggled-on' );

	// Will be true if we want to force the toggle on, false if force toggle close.
	if ( undefined !== forceToggle && 'boolean' == ( typeof forceToggle ) ) {
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
		parentMenuItem.querySelectorAll( '.menu-item--toggled-on' ).forEach( function( item ) {
			toggleSubMenu( item, false );
        });

	} else {

		// Make sure siblings are closed.
		parentMenuItem.parentNode.querySelectorAll( 'li.menu-item--toggled-on' ).forEach( function( item ) {
			toggleSubMenu( item, false );
		});

		// Toggle "on" the submenu.
		parentMenuItem.classList.add( 'menu-item--toggled-on' );
		subMenu.classList.add( 'toggle-show' );
		toggleButton.setAttribute( 'aria-label', wpRigScreenReaderText.collapse );

	}
}

/**
 * Returns the dropdown button
 * element needed for the menu.
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
 */
function isfirstFocusableElement( container, element, focusSelector ) {
	const focusableElements = container.querySelectorAll( focusSelector );
	if ( 0 < focusableElements.length ) {
		return element === focusableElements[0];
	}
	return false;
}

/**
 * Returns true if element is the
 * last focusable element in the container.
 */
function islastFocusableElement( container, element, focusSelector ) {
	const focusableElements = container.querySelectorAll( focusSelector );
	if ( 0 < focusableElements.length ) {
		return element === focusableElements[focusableElements.length - 1];
	}
	return false;
}
