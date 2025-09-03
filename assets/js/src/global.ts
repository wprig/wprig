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

window.mobileBreakpoint = 55;

window.isWidthMobile = (): boolean => {
	const fontSizeStr = getComputedStyle(
		document.documentElement
	).fontSize.slice( 0, -2 );
	const fontSize = parseFloat( fontSizeStr );
	const emValue = window.innerWidth / fontSize;
	window.wpRig = document.querySelector( '.wp-rig' );
	return emValue <= window.mobileBreakpoint;
};
