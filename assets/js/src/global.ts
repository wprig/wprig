/**
 * File global.js.
 *
 * Handles global javascript for your theme.
 */

interface Window {
	mobileBreakpoint: number;
	isWidthMobile: () => boolean;
}

window.mobileBreakpoint = 55;

window.isWidthMobile = function(): boolean {
	const fontSizeStr = getComputedStyle(document.documentElement).fontSize.slice(0, -2);
	const fontSize = parseFloat(fontSizeStr);
	const emValue = window.innerWidth / fontSize;
	const test = document.querySelector('.wp-rig');
	window.wpRig = test;
	return emValue <= window.mobileBreakpoint;
};
