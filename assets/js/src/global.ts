/**
 * File global.ts.
 *
 * Handles global TypeScript for your theme.
 */

// Extend the Window interface properly
declare global {
	interface Window {
		mobileBreakpoint: number;
		isWidthMobile: () => boolean;
		wpRig?: Element | null;
	}
}

// This export makes the file a module and allows declare global to work
export {};

const getMobileBreakpoint = (): number => {
	const rootStyles = getComputedStyle( document.documentElement );
	const breakpointStr = rootStyles
		.getPropertyValue( '--mobile-breakpoint' )
		.trim();
	if ( breakpointStr ) {
		const value = parseFloat( breakpointStr );
		if ( ! isNaN( value ) ) {
			return value;
		}
	}
	return 782; // Fallback (viewport tablet)
};

window.mobileBreakpoint = getMobileBreakpoint();

window.isWidthMobile = (): boolean => {
	window.wpRig = document.querySelector( '.wp-rig' );
	return window.innerWidth <= window.mobileBreakpoint;
};
