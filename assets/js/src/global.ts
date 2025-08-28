/**
 * File global.ts.
 *
 * Handles global TypeScript for your theme.
 */

interface Window {
	mobileBreakpoint: number;
	isWidthMobile: () => boolean;
	wpRig?: Element | null;
}

declare let window: Window;

window.mobileBreakpoint = 55;

window.isWidthMobile = (): boolean => {
	const fontSizeStr = getComputedStyle(
		document.documentElement
	).fontSize.slice( 0, -2 );
	const fontSize = parseFloat( fontSizeStr );
	const emValue = window.innerWidth / fontSize;
	const test = document.querySelector( '.wp-rig' );
	window.wpRig = test;
	return emValue <= window.mobileBreakpoint;
};
