/* global wprigScreenReaderText */

/**
 * File navigation.js.
 *
 * Handles toggling the navigation menu for small screens and enables TAB key
 * navigation support for dropdown menus.
 */

const MENUTOGGLE = document.querySelector( '.main-navigation .menu-toggle' );
const SITENAV = document.querySelector( '.main-navigation' );

/**
 * Toggle sub-menus open and closed, and tell screen readers what's going on.
 */
function subNavToggle( toggleButton ) {

	// Toggle aria-expanded on button.
	toggleButton.setAttribute( 'aria-expanded', 'false' === toggleButton.getAttribute( 'aria-expanded' ) ? 'true' : 'false' );

	// Toggle the .toggled-on class on the button.
	toggleButton.classList.toggle( 'toggled-on' );
	toggleButton.nextElementSibling.classList.toggle( 'toggled-on' );

	let screenReaderSpan = toggleButton.querySelector( '.screen-reader-text' );
	screenReaderSpan.textContent = wprigScreenReaderText.expand === screenReaderSpan.textContent ? wprigScreenReaderText.collapse : wprigScreenReaderText.expand;
}

/**
 * Initiate the main navigation script.
 */
function initMainNavigation() {
	SITENAV.addEventListener( 'click', function( event ) {
		if ( event.target.classList.contains( 'dropdown-toggle' ) ) {
			subNavToggle( event.target );
		}
	}, false );
}

initMainNavigation();

/**
 * Initiate the mobile menu toggle button.
 */
function initMenuToggle() {

	// Return early if MENUTOGGLE is missing.
	if ( undefined === MENUTOGGLE ) {
		return;
	}

	// Add an initial values for the attribute.
	MENUTOGGLE.setAttribute( 'aria-expanded', 'false' );

	MENUTOGGLE.addEventListener( 'click', function() {
		SITENAV.classList.toggle( 'toggled-on' );
		MENUTOGGLE.setAttribute( 'aria-expanded', 'false' === MENUTOGGLE.getAttribute( 'aria-expanded' ) ? 'true' : 'false' );
	}, false );

}

initMenuToggle();
