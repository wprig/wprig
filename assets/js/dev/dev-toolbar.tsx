import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';

// 1-Color Vector SVG Icons
const SelectorIcon = () => (
	<svg
		className="wprig-tab-icon"
		viewBox="0 0 24 24"
		width="15"
		height="15"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<circle cx="12" cy="12" r="10" />
		<line x1="12" y1="2" x2="12" y2="6" />
		<line x1="12" y1="18" x2="12" y2="22" />
		<line x1="2" y1="12" x2="6" y2="12" />
		<line x1="18" y1="12" x2="22" y2="12" />
		<circle cx="12" cy="12" r="3" />
	</svg>
);

const FileLocatorIcon = () => (
	<svg
		className="wprig-tab-icon"
		viewBox="0 0 24 24"
		width="15"
		height="15"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
	</svg>
);

const TokenInspectorIcon = () => (
	<svg
		className="wprig-tab-icon"
		viewBox="0 0 24 24"
		width="15"
		height="15"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
		<circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
		<circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
		<circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
		<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.92 0 1.7-.72 1.7-1.61 0-.43-.17-.83-.44-1.13-.27-.3-.43-.7-.43-1.13 0-.89.78-1.61 1.7-1.61h2.47c2.76 0 5-2.24 5-5 0-5.52-4.48-9.5-10-9.5z" />
	</svg>
);

const A11yIcon = () => (
	<svg
		className="wprig-tab-icon"
		viewBox="0 0 24 24"
		width="15"
		height="15"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<circle cx="12" cy="4" r="2" />
		<path d="M12 6v7" />
		<path d="M6 9l6 1 6-1" />
		<path d="M9 20l3-7 3 7" />
	</svg>
);

const PurgeIcon = () => (
	<svg
		className="wprig-tab-icon"
		viewBox="0 0 24 24"
		width="15"
		height="15"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M21.5 2v6h-6" />
		<path d="M21.34 15.57a10 10 0 1 1-.57-8.38l1.67-1.67" />
	</svg>
);

const SearchIcon = () => (
	<svg
		className="wprig-search-icon"
		viewBox="0 0 24 24"
		width="14"
		height="14"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<circle cx="11" cy="11" r="8" />
		<line x1="21" y1="21" x2="16.65" y2="16.65" />
	</svg>
);

const CloseIcon = () => (
	<svg
		className="wprig-tab-icon"
		viewBox="0 0 24 24"
		width="14"
		height="14"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<line x1="18" y1="6" x2="6" y2="18" />
		<line x1="6" y1="6" x2="18" y2="18" />
	</svg>
);

const RigToolIcon = () => (
	<svg
		viewBox="0 0 24 24"
		width="18"
		height="18"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<polyline points="16 18 22 12 16 6" />
		<polyline points="8 6 2 12 8 18" />
	</svg>
);

const DragGripIcon = () => (
	<svg
		className="wprig-panel-drag-grip"
		viewBox="0 0 24 24"
		width="14"
		height="14"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<circle cx="9" cy="6" r="1.5" fill="currentColor" />
		<circle cx="9" cy="12" r="1.5" fill="currentColor" />
		<circle cx="9" cy="18" r="1.5" fill="currentColor" />
		<circle cx="15" cy="6" r="1.5" fill="currentColor" />
		<circle cx="15" cy="12" r="1.5" fill="currentColor" />
		<circle cx="15" cy="18" r="1.5" fill="currentColor" />
	</svg>
);

const EyeOffIcon = () => (
	<svg
		className="wprig-btn-icon"
		viewBox="0 0 24 24"
		width="13"
		height="13"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.45 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
		<line x1="1" y1="1" x2="23" y2="23" />
	</svg>
);

const RestoreIcon = () => (
	<svg
		className="wprig-btn-icon"
		viewBox="0 0 24 24"
		width="13"
		height="13"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<polyline points="1 4 1 10 7 10" />
		<path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
	</svg>
);

// Interfaces
export interface A11yIssue {
	id: string;
	type: 'error' | 'warning';
	category:
		| 'contrast'
		| 'alt-text'
		| 'form-label'
		| 'heading-hierarchy'
		| 'target-size'
		| 'keyboard-focus';
	selector: string;
	element: HTMLElement;
	message: string;
	detail: string;
	currentRatio?: number;
	requiredRatio?: number;
	fgColor?: string;
	bgColor?: string;
}

export interface IgnoredIssueRecord {
	key: string;
	category: string;
	selector: string;
	message: string;
	detail: string;
	type: 'error' | 'warning';
	ignoredAt: string;
}

export function getIssueKey( issue: Partial< A11yIssue > ): string {
	return `${ issue.category || '' }::${ issue.selector || '' }::${
		issue.message || ''
	}`;
}

export interface ColorRemediationOption {
	id: string;
	name: string;
	fg: string;
	bg: string;
	ratio: number;
	wcagRating: 'AA' | 'AAA';
}

export interface ElementMetrics {
	selector: string;
	tagName: string;
	dimensions: string;
	rect: DOMRect;
	display: string;
	position: string;
	zIndex: string;
	margin: string;
	padding: string;
	color: string;
	backgroundColor: string;
	fontSize: string;
	fontWeight: string;
	flexDirection: string;
	justifyContent: string;
	alignItems: string;
	templatePath: string;
}

export interface TemplateBoundary {
	name: string;
	type: 'template' | 'block';
	count: number;
}

export interface OffSpecStyle {
	property: string;
	value: string;
	suggestedToken: string;
}

// Color and WCAG Math Helpers
function parseColorToRgb(
	colorStr: string
): { r: number; g: number; b: number; a: number } | null {
	if ( ! colorStr ) {
		return null;
	}

	const ctx = document.createElement( 'canvas' ).getContext( '2d' );
	if ( ! ctx ) {
		return null;
	}
	ctx.fillStyle = colorStr;
	const computed = ctx.fillStyle;

	if ( computed.startsWith( '#' ) ) {
		const hex = computed.slice( 1 );
		if ( hex.length === 6 ) {
			return {
				r: parseInt( hex.slice( 0, 2 ), 16 ),
				g: parseInt( hex.slice( 2, 4 ), 16 ),
				b: parseInt( hex.slice( 4, 6 ), 16 ),
				a: 1,
			};
		}
	}
	const match = computed.match(
		/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/
	);
	if ( match ) {
		return {
			r: parseInt( match[ 1 ], 10 ),
			g: parseInt( match[ 2 ], 10 ),
			b: parseInt( match[ 3 ], 10 ),
			a: match[ 4 ] !== undefined ? parseFloat( match[ 4 ] ) : 1,
		};
	}
	return null;
}

function rgbToHex( r: number, g: number, b: number ): string {
	const toHex = ( n: number ) =>
		Math.max( 0, Math.min( 255, Math.round( n ) ) )
			.toString( 16 )
			.padStart( 2, '0' );
	return `#${ toHex( r ) }${ toHex( g ) }${ toHex( b ) }`;
}

function colorToHex( colorStr: string ): string {
	const rgb = parseColorToRgb( colorStr );
	if ( ! rgb ) {
		return '#000000';
	}
	return rgbToHex( rgb.r, rgb.g, rgb.b );
}

function rgbToHsl( r: number, g: number, b: number ): string {
	const rNorm = r / 255;
	const gNorm = g / 255;
	const bNorm = b / 255;
	const max = Math.max( rNorm, gNorm, bNorm );
	const min = Math.min( rNorm, gNorm, bNorm );
	let h = 0;
	let s = 0;
	const l = ( max + min ) / 2;

	if ( max !== min ) {
		const d = max - min;
		s = l > 0.5 ? d / ( 2 - max - min ) : d / ( max + min );
		switch ( max ) {
			case rNorm:
				h = ( gNorm - bNorm ) / d + ( gNorm < bNorm ? 6 : 0 );
				break;
			case gNorm:
				h = ( bNorm - rNorm ) / d + 2;
				break;
			case bNorm:
				h = ( rNorm - gNorm ) / d + 4;
				break;
		}
		h /= 6;
	}

	return `hsl(${ Math.round( h * 360 ) }, ${ Math.round(
		s * 100
	) }%, ${ Math.round( l * 100 ) }%)`;
}

function rgbToOklch( r: number, g: number, b: number ): string {
	const lum = getRelativeLuminance( { r, g, b } );
	const l = Math.round( Math.pow( lum, 1 / 3 ) * 100 ) / 100;
	const c =
		Math.round(
			( ( Math.abs( r - g ) + Math.abs( g - b ) ) / 510 ) * 0.25 * 1000
		) / 1000;
	const h = Math.round(
		( Math.atan2( b - g, r - g ) * ( 180 / Math.PI ) + 360 ) % 360
	);
	return `oklch(${ l } ${ c } ${ h })`;
}

function getRelativeLuminance( {
	r,
	g,
	b,
}: {
	r: number;
	g: number;
	b: number;
} ): number {
	const a = [ r, g, b ].map( ( v ) => {
		const val = v / 255;
		return val <= 0.04045
			? val / 12.92
			: Math.pow( ( val + 0.055 ) / 1.055, 2.4 );
	} );
	return 0.2126 * a[ 0 ] + 0.7152 * a[ 1 ] + 0.0722 * a[ 2 ];
}

function calculateContrastRatio(
	color1: string,
	color2: string
): number | null {
	const rgb1 = parseColorToRgb( color1 );
	const rgb2 = parseColorToRgb( color2 );
	if ( ! rgb1 || ! rgb2 ) {
		return null;
	}

	const lum1 = getRelativeLuminance( rgb1 );
	const lum2 = getRelativeLuminance( rgb2 );
	const brightest = Math.max( lum1, lum2 );
	const darkest = Math.min( lum1, lum2 );

	return ( brightest + 0.05 ) / ( darkest + 0.05 );
}

function getEffectiveBackgroundColor( element: HTMLElement ): string {
	let current: HTMLElement | null = element;
	while ( current ) {
		const style = window.getComputedStyle( current );
		const bg = style.backgroundColor;
		const parsed = parseColorToRgb( bg );
		if (
			parsed &&
			parsed.a > 0.05 &&
			bg !== 'transparent' &&
			bg !== 'rgba(0, 0, 0, 0)'
		) {
			return bg;
		}
		current = current.parentElement;
	}
	return 'rgb(255, 255, 255)';
}

function generateColorRemediations(
	fg: string,
	bg: string,
	isLargeText: boolean
): ColorRemediationOption[] {
	const targetRatio = isLargeText ? 3.0 : 4.5;
	const options: ColorRemediationOption[] = [];

	const bgRgb = parseColorToRgb( bg ) || { r: 255, g: 255, b: 255, a: 1 };
	const bgLum = getRelativeLuminance( bgRgb );

	const darkText = '#09090b';
	const lightText = '#f4f4f5';
	const darkRatio = calculateContrastRatio( darkText, bg ) || 1;
	const lightRatio = calculateContrastRatio( lightText, bg ) || 1;

	const bestTokenColor = bgLum > 0.4 ? darkText : lightText;
	const bestTokenRatio = Math.max( darkRatio, lightRatio );

	options.push( {
		id: 'token-contrast',
		name: 'High-Contrast Token',
		fg: bestTokenColor,
		bg,
		ratio: parseFloat( bestTokenRatio.toFixed( 2 ) ),
		wcagRating: bestTokenRatio >= 7.0 ? 'AAA' : 'AA',
	} );

	const fgRgb = parseColorToRgb( fg ) || { r: 0, g: 0, b: 0, a: 1 };
	const factor = bgLum > 0.4 ? 0.75 : 1.3;

	let r = fgRgb.r;
	let g = fgRgb.g;
	let b = fgRgb.b;
	for ( let i = 0; i < 8; i++ ) {
		r = Math.min( 255, Math.max( 0, Math.round( r * factor ) ) );
		g = Math.min( 255, Math.max( 0, Math.round( g * factor ) ) );
		b = Math.min( 255, Math.max( 0, Math.round( b * factor ) ) );
		const testColor = `rgb(${ r }, ${ g }, ${ b })`;
		const ratio = calculateContrastRatio( testColor, bg ) || 1;
		if ( ratio >= targetRatio ) {
			options.push( {
				id: 'minimal-shift',
				name: 'Minimal Lightness Shift',
				fg: testColor,
				bg,
				ratio: parseFloat( ratio.toFixed( 2 ) ),
				wcagRating: ratio >= 7.0 ? 'AAA' : 'AA',
			} );
			break;
		}
	}

	const brandAccent = bgLum > 0.4 ? '#0070f3' : '#38bdf8';
	const brandRatio = calculateContrastRatio( brandAccent, bg ) || 1;
	if ( brandRatio >= targetRatio ) {
		options.push( {
			id: 'brand-accent',
			name: 'Brand Accent Compliant',
			fg: brandAccent,
			bg,
			ratio: parseFloat( brandRatio.toFixed( 2 ) ),
			wcagRating: brandRatio >= 7.0 ? 'AAA' : 'AA',
		} );
	}

	return options;
}

// BEM & Selector Helper
function getBemSelector( el: HTMLElement ): string {
	if ( el.id ) {
		return `#${ el.id }`;
	}
	const classes = Array.from( el.classList ).filter(
		( c ) => ! c.startsWith( 'wprig-toolbar' )
	);
	if ( classes.length > 0 ) {
		return `.${ classes.join( '.' ) }`;
	}
	const tag = el.tagName.toLowerCase();
	return el.parentElement && el.parentElement !== document.body
		? `${ getBemSelector( el.parentElement ) } > ${ tag }`
		: tag;
}

// Template Boundary Comment Resolver
function resolveTemplateForElement( el: HTMLElement ): string {
	let current: Node | null = el;

	while ( current ) {
		let sibling: Node | null = current.previousSibling;
		while ( sibling ) {
			if ( sibling.nodeType === Node.COMMENT_NODE ) {
				const content = sibling.nodeValue
					? sibling.nodeValue.trim()
					: '';
				if ( content.startsWith( 'WPRIG_TEMPLATE_START:' ) ) {
					return content
						.replace( 'WPRIG_TEMPLATE_START:', '' )
						.trim();
				}
				if ( content.startsWith( 'WPRIG_BLOCK_START:' ) ) {
					return `Block: ${ content
						.replace( 'WPRIG_BLOCK_START:', '' )
						.trim() }`;
				}
			}
			sibling = sibling.previousSibling;
		}
		current = current.parentNode;
	}

	return 'Root Theme Template';
}

function getDetectedTemplates(): {
	rootTemplate: string;
	templates: TemplateBoundary[];
} {
	let rootTemplate = 'index.php';
	const counts: Record<
		string,
		{ type: 'template' | 'block'; count: number }
	> = {};

	const walker = document.createTreeWalker(
		document.documentElement,
		NodeFilter.SHOW_COMMENT,
		null
	);

	let node = walker.nextNode();
	while ( node ) {
		const val = node.nodeValue ? node.nodeValue.trim() : '';
		if ( val.startsWith( 'WPRIG_ROOT_TEMPLATE:' ) ) {
			rootTemplate = val.replace( 'WPRIG_ROOT_TEMPLATE:', '' ).trim();
		} else if ( val.startsWith( 'WPRIG_TEMPLATE_START:' ) ) {
			const tName = val.replace( 'WPRIG_TEMPLATE_START:', '' ).trim();
			if ( ! counts[ tName ] ) {
				counts[ tName ] = { type: 'template', count: 0 };
			}
			counts[ tName ].count += 1;
		} else if ( val.startsWith( 'WPRIG_BLOCK_START:' ) ) {
			const bName = val.replace( 'WPRIG_BLOCK_START:', '' ).trim();
			if ( ! counts[ bName ] ) {
				counts[ bName ] = { type: 'block', count: 0 };
			}
			counts[ bName ].count += 1;
		}
		node = walker.nextNode();
	}

	const templates: TemplateBoundary[] = Object.keys( counts ).map(
		( key ) => ( {
			name: key,
			type: counts[ key ].type,
			count: counts[ key ].count,
		} )
	);

	return { rootTemplate, templates };
}

// Element Metrics Collector
function getElementMetrics( el: HTMLElement ): ElementMetrics {
	const style = window.getComputedStyle( el );
	const rect = el.getBoundingClientRect();

	return {
		selector: getBemSelector( el ),
		tagName: el.tagName.toLowerCase(),
		dimensions: `${ Math.round( rect.width ) }px x ${ Math.round(
			rect.height
		) }px`,
		rect,
		display: style.display,
		position: style.position,
		zIndex: style.zIndex,
		margin: style.margin,
		padding: style.padding,
		color: style.color,
		backgroundColor: style.backgroundColor,
		fontSize: style.fontSize,
		fontWeight: style.fontWeight,
		flexDirection: style.flexDirection,
		justifyContent: style.justifyContent,
		alignItems: style.alignItems,
		templatePath: resolveTemplateForElement( el ),
	};
}

// Token Inspector Helper
function getOffSpecStyles( el: HTMLElement ): OffSpecStyle[] {
	const offSpec: OffSpecStyle[] = [];
	const style = window.getComputedStyle( el );

	if ( style.color && style.color.startsWith( 'rgb' ) ) {
		offSpec.push( {
			property: 'color',
			value: style.color,
			suggestedToken: 'var(--color-text)',
		} );
	}
	if (
		style.backgroundColor &&
		style.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
		style.backgroundColor !== 'transparent'
	) {
		offSpec.push( {
			property: 'background-color',
			value: style.backgroundColor,
			suggestedToken: 'var(--color-background)',
		} );
	}
	if ( style.margin && style.margin !== '0px' ) {
		offSpec.push( {
			property: 'margin',
			value: style.margin,
			suggestedToken: 'var(--spacing-medium)',
		} );
	}

	return offSpec;
}

// Strict A11y Auditor
function runStrictA11yAudit(): A11yIssue[] {
	const issues: A11yIssue[] = [];
	let idCounter = 1;

	// 1. Contrast Check
	const textElements = Array.from(
		document.querySelectorAll< HTMLElement >(
			'p, h1, h2, h3, h4, h5, h6, a, button, label, span, li, td, th'
		)
	);
	textElements.forEach( ( el ) => {
		if ( ! el.offsetParent || el.closest( '#wprig-dev-toolbar-root' ) ) {
			return;
		}
		const text = el.innerText ? el.innerText.trim() : '';
		if ( ! text ) {
			return;
		}

		const style = window.getComputedStyle( el );
		const fg = style.color;
		const bg = getEffectiveBackgroundColor( el );

		const fontSize = parseFloat( style.fontSize );
		const fontWeight = parseInt( style.fontWeight, 10 ) || 400;
		const isLargeText =
			fontSize >= 24 || ( fontSize >= 18.66 && fontWeight >= 700 );

		const requiredRatio = isLargeText ? 3.0 : 4.5;
		const ratio = calculateContrastRatio( fg, bg );

		if ( ratio !== null && ratio < requiredRatio ) {
			issues.push( {
				id: `issue-${ idCounter++ }`,
				type: 'error',
				category: 'contrast',
				selector: getBemSelector( el ),
				element: el,
				message: `Low Contrast Ratio: ${ ratio.toFixed(
					2
				) }:1 (Fails WCAG AA ${ requiredRatio }:1)`,
				detail: `Computed color ${ fg } on background ${ bg }. Text size ${ fontSize }px (${ fontWeight }).`,
				currentRatio: parseFloat( ratio.toFixed( 2 ) ),
				requiredRatio,
				fgColor: fg,
				bgColor: bg,
			} );
		}
	} );

	// 2. Touch Target Sizing
	const interactiveEls = Array.from(
		document.querySelectorAll< HTMLElement >(
			'button, a, input[type="button"], input[type="submit"]'
		)
	);
	interactiveEls.forEach( ( el ) => {
		if ( ! el.offsetParent || el.closest( '#wprig-dev-toolbar-root' ) ) {
			return;
		}
		const rect = el.getBoundingClientRect();
		if (
			rect.width > 0 &&
			rect.height > 0 &&
			( rect.width < 24 || rect.height < 24 )
		) {
			issues.push( {
				id: `issue-${ idCounter++ }`,
				type: 'warning',
				category: 'target-size',
				selector: getBemSelector( el ),
				element: el,
				message: `Small Touch Target: ${ Math.round(
					rect.width
				) }x${ Math.round( rect.height ) }px`,
				detail: 'WCAG 2.2 SC 2.5.8 recommends minimum target size of 24x24px.',
			} );
		}
	} );

	// 3. Image Alt Attributes
	const images = Array.from(
		document.querySelectorAll< HTMLImageElement >( 'img' )
	);
	images.forEach( ( img ) => {
		if ( ! img.offsetParent || img.closest( '#wprig-dev-toolbar-root' ) ) {
			return;
		}
		if ( ! img.hasAttribute( 'alt' ) ) {
			issues.push( {
				id: `issue-${ idCounter++ }`,
				type: 'error',
				category: 'alt-text',
				selector: getBemSelector( img ),
				element: img,
				message: 'Missing "alt" attribute on image',
				detail: 'Screen readers require descriptive alt text or alt="" for decorative images.',
			} );
		}
	} );

	// 4. Form Labels
	const inputs = Array.from(
		document.querySelectorAll<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>( 'input:not([type="hidden"]), select, textarea' )
	);
	inputs.forEach( ( input ) => {
		if (
			! input.offsetParent ||
			input.closest( '#wprig-dev-toolbar-root' )
		) {
			return;
		}
		const hasLabel = input.labels && input.labels.length > 0;
		const hasAria =
			input.getAttribute( 'aria-label' ) ||
			input.getAttribute( 'aria-labelledby' );
		if ( ! hasLabel && ! hasAria ) {
			issues.push( {
				id: `issue-${ idCounter++ }`,
				type: 'error',
				category: 'form-label',
				selector: getBemSelector( input ),
				element: input,
				message: 'Form control lacks an accessible label',
				detail: 'Form elements must have an associated <label>, aria-label, or aria-labelledby.',
			} );
		}
	} );

	// 5. Heading Level Jumps
	const headings = Array.from(
		document.querySelectorAll< HTMLElement >( 'h1, h2, h3, h4, h5, h6' )
	);
	let lastLevel = 0;
	headings.forEach( ( h ) => {
		if ( ! h.offsetParent || h.closest( '#wprig-dev-toolbar-root' ) ) {
			return;
		}
		const level = parseInt( h.tagName.substring( 1 ), 10 );
		if ( lastLevel > 0 && level > lastLevel + 1 ) {
			issues.push( {
				id: `issue-${ idCounter++ }`,
				type: 'warning',
				category: 'heading-hierarchy',
				selector: getBemSelector( h ),
				element: h,
				message: `Skipped Heading Level: H${ lastLevel } to H${ level }`,
				detail: 'Headings should follow a sequential structure without skipping levels.',
			} );
		}
		lastLevel = level;
	} );

	return issues;
}

// Dev Toolbar React Application
const DevToolbarApp: React.FC = () => {
	const [ activeTab, setActiveTab ] = useState< string | null >( null );
	const [ isSelecting, setIsSelecting ] = useState< boolean >( false );
	const [ isClosed, setIsClosed ] = useState< boolean >( false );

	// Canvas Selection & Overlay State
	const [ hoverElement, setHoverElement ] = useState< HTMLElement | null >(
		null
	);
	const [ selectedElement, setSelectedElement ] =
		useState< HTMLElement | null >( null );
	const [ dragStart, setDragStart ] = useState< {
		x: number;
		y: number;
	} | null >( null );
	const [ dragCurrent, setDragCurrent ] = useState< {
		x: number;
		y: number;
	} | null >( null );

	// Directive / Prompt State
	const [ directiveCategory, setDirectiveCategory ] =
		useState< string >( 'layout' );
	const [ customDirective, setCustomDirective ] = useState< string >( '' );
	const [ selectedChip, setSelectedChip ] = useState< string >(
		'Align element with container'
	);
	const [ promptCopyStatus, setCopyStatus ] = useState< string >( '' );

	// A11y & Remediation State
	const [ issues, setIssues ] = useState< A11yIssue[] >( [] );
	const [ selectedIssue, setSelectedIssue ] = useState< A11yIssue | null >(
		null
	);
	const [ customFgColor, setCustomFgColor ] = useState< string >( '#09090b' );
	const [ customBgColor, setCustomBgColor ] = useState< string >( '#f4f4f5' );
	const [ customTargetSize, setCustomTargetSize ] = useState< number >( 24 );
	const [ customAltText, setCustomAltText ] = useState< string >( '' );
	const [ customLabelText, setCustomLabelText ] = useState< string >( '' );
	const [ originalStyles, setOriginalStyles ] = useState< {
		color?: string;
		backgroundColor?: string;
		minWidth?: string;
		minHeight?: string;
	} >( {} );

	// Filtering & Sorting State for A11y
	const [ searchQuery, setSearchQuery ] = useState< string >( '' );
	const [ severityFilter, setSeverityFilter ] = useState< string >( 'all' );
	const [ categoryFilter, setCategoryFilter ] = useState< string >( 'all' );
	const [ sortBy, setSortBy ] = useState< string >( 'severity' );
	const [ overlayTick, setOverlayTick ] = useState< number >( 0 );

	// A11y Ignore List State
	const [ ignoredRecords, setIgnoredRecords ] = useState<
		IgnoredIssueRecord[]
	>( () => {
		try {
			const saved = localStorage.getItem( 'wprig_a11y_ignored_issues' );
			return saved ? JSON.parse( saved ) : [];
		} catch ( e ) {
			return [];
		}
	} );
	const [ a11yViewMode, setA11yViewMode ] = useState< 'active' | 'ignored' >(
		'active'
	);

	// Detected Templates State
	const [ detectedTemplates, setDetectedTemplates ] = useState< {
		rootTemplate: string;
		templates: TemplateBoundary[];
	} >( { rootTemplate: 'index.php', templates: [] } );

	// Panel Dragging State
	const [ panelPosition, setPanelPosition ] = useState< {
		x: number;
		y: number;
	} | null >( null );
	const [ isDraggingPanel, setIsDraggingPanel ] =
		useState< boolean >( false );

	// Refs
	const isDraggingRef = useRef( false );
	const panelRef = useRef< HTMLDivElement | null >( null );
	const panelDragStartRef = useRef< {
		mouseX: number;
		mouseY: number;
		panelX: number;
		panelY: number;
	} | null >( null );

	// Ignore List Handlers
	const handleIgnoreIssue = ( issue: A11yIssue ) => {
		const key = getIssueKey( issue );
		if ( ! ignoredRecords.some( ( r ) => r.key === key ) ) {
			const newRecord: IgnoredIssueRecord = {
				key,
				category: issue.category,
				selector: issue.selector,
				message: issue.message,
				detail: issue.detail,
				type: issue.type,
				ignoredAt: new Date().toLocaleTimeString( [], {
					hour: '2-digit',
					minute: '2-digit',
				} ),
			};
			setIgnoredRecords( ( prev ) => [ ...prev, newRecord ] );
		}
		if ( selectedIssue?.id === issue.id ) {
			setSelectedIssue( null );
		}
	};

	const handleUnignoreIssue = ( key: string ) => {
		setIgnoredRecords( ( prev ) => prev.filter( ( r ) => r.key !== key ) );
	};

	const handleUnignoreAll = () => {
		setIgnoredRecords( [] );
	};

	// A11y Remediation & Selection Handlers
	const handleSelectIssue = useCallback(
		( issue: A11yIssue ) => {
			if ( selectedIssue?.id === issue.id ) {
				if ( selectedIssue.element && originalStyles ) {
					if ( originalStyles.color !== undefined ) {
						selectedIssue.element.style.color =
							originalStyles.color;
					}
					if ( originalStyles.backgroundColor !== undefined ) {
						selectedIssue.element.style.backgroundColor =
							originalStyles.backgroundColor;
					}
					if ( originalStyles.minWidth !== undefined ) {
						selectedIssue.element.style.minWidth =
							originalStyles.minWidth;
					}
					if ( originalStyles.minHeight !== undefined ) {
						selectedIssue.element.style.minHeight =
							originalStyles.minHeight;
					}
				}
				setSelectedIssue( null );
				return;
			}

			if ( selectedIssue && selectedIssue.element && originalStyles ) {
				if ( originalStyles.color !== undefined ) {
					selectedIssue.element.style.color = originalStyles.color;
				}
				if ( originalStyles.backgroundColor !== undefined ) {
					selectedIssue.element.style.backgroundColor =
						originalStyles.backgroundColor;
				}
				if ( originalStyles.minWidth !== undefined ) {
					selectedIssue.element.style.minWidth =
						originalStyles.minWidth;
				}
				if ( originalStyles.minHeight !== undefined ) {
					selectedIssue.element.style.minHeight =
						originalStyles.minHeight;
				}
			}

			setSelectedIssue( issue );

			if ( issue.element ) {
				setOriginalStyles( {
					color: issue.element.style.color,
					backgroundColor: issue.element.style.backgroundColor,
					minWidth: issue.element.style.minWidth,
					minHeight: issue.element.style.minHeight,
				} );

				try {
					issue.element.scrollIntoView( {
						behavior: 'smooth',
						block: 'center',
					} );
				} catch ( e ) {
					// Fallback
				}

				if (
					issue.category === 'contrast' &&
					issue.fgColor &&
					issue.bgColor
				) {
					const fgHex = colorToHex( issue.fgColor );
					const bgHex = colorToHex( issue.bgColor );
					setCustomFgColor( fgHex );
					setCustomBgColor( bgHex );
				} else if ( issue.category === 'target-size' ) {
					const rect = issue.element.getBoundingClientRect();
					setCustomTargetSize(
						Math.max(
							24,
							Math.round( Math.max( rect.width, rect.height ) )
						)
					);
				} else if ( issue.category === 'alt-text' ) {
					setCustomAltText(
						issue.element.getAttribute( 'alt' ) || ''
					);
				} else if ( issue.category === 'form-label' ) {
					setCustomLabelText(
						issue.element.getAttribute( 'aria-label' ) || ''
					);
				}
			}
		},
		[ selectedIssue, originalStyles ]
	);

	// Panel Header Event Handlers
	const handlePanelHeaderMouseDown = (
		e: React.MouseEvent< HTMLDivElement >
	) => {
		if (
			( e.target as HTMLElement ).closest(
				'.wprig-panel-close, button, input, select'
			)
		) {
			return;
		}
		if ( ! panelRef.current ) {
			return;
		}
		const rect = panelRef.current.getBoundingClientRect();
		panelDragStartRef.current = {
			mouseX: e.clientX,
			mouseY: e.clientY,
			panelX: rect.left,
			panelY: rect.top,
		};
		setIsDraggingPanel( true );
		e.preventDefault();
	};

	const handlePanelHeaderTouchStart = (
		e: React.TouchEvent< HTMLDivElement >
	) => {
		if (
			( e.target as HTMLElement ).closest(
				'.wprig-panel-close, button, input, select'
			)
		) {
			return;
		}
		if ( ! panelRef.current || e.touches.length !== 1 ) {
			return;
		}
		const touch = e.touches[ 0 ];
		const rect = panelRef.current.getBoundingClientRect();
		panelDragStartRef.current = {
			mouseX: touch.clientX,
			mouseY: touch.clientY,
			panelX: rect.left,
			panelY: rect.top,
		};
		setIsDraggingPanel( true );
	};

	const panelStyle: React.CSSProperties = panelPosition
		? {
				position: 'fixed',
				left: `${ panelPosition.x }px`,
				top: `${ panelPosition.y }px`,
				right: 'auto',
				bottom: 'auto',
				transform: 'none',
				zIndex: 2147483647,
		  }
		: {};

	// Close & Reopen Toolbar Handlers
	const handleCloseToolbar = () => {
		setIsClosed( true );
		setActiveTab( null );
		setIsSelecting( false );
		setHoverElement( null );
		setSelectedIssue( null );
		setPanelPosition( null );
	};

	const handleOpenToolbar = () => {
		setIsClosed( false );
	};

	// Toggle Selector Mode
	const toggleSelectorMode = () => {
		if ( isSelecting ) {
			setIsSelecting( false );
			setHoverElement( null );
		} else {
			setIsSelecting( true );
			setActiveTab( 'selector' );
		}
	};

	// Mouse Event Handlers for Selector Drag Overlay
	const handleMouseDown = useCallback(
		( e: MouseEvent ) => {
			if ( ! isSelecting ) {
				return;
			}
			const target = e.target as HTMLElement;
			if ( target.closest( '#wprig-dev-toolbar-root' ) ) {
				return;
			}

			isDraggingRef.current = true;
			setDragStart( { x: e.clientX, y: e.clientY } );
			setDragCurrent( { x: e.clientX, y: e.clientY } );
		},
		[ isSelecting ]
	);

	const handleMouseMove = useCallback(
		( e: MouseEvent ) => {
			if ( ! isSelecting ) {
				return;
			}
			const target = e.target as HTMLElement;
			if ( target.closest( '#wprig-dev-toolbar-root' ) ) {
				return;
			}

			if ( isDraggingRef.current ) {
				setDragCurrent( { x: e.clientX, y: e.clientY } );
			} else {
				setHoverElement( target );
			}
		},
		[ isSelecting ]
	);

	const handleMouseUp = useCallback(
		( e: MouseEvent ) => {
			if ( ! isSelecting ) {
				return;
			}
			const target = e.target as HTMLElement;
			if ( target.closest( '#wprig-dev-toolbar-root' ) ) {
				return;
			}

			if ( isDraggingRef.current && dragStart ) {
				const deltaX = Math.abs( e.clientX - dragStart.x );
				const deltaY = Math.abs( e.clientY - dragStart.y );

				if ( deltaX > 10 || deltaY > 10 ) {
					const centerX = ( dragStart.x + e.clientX ) / 2;
					const centerY = ( dragStart.y + e.clientY ) / 2;
					const pickedEl = document.elementFromPoint(
						centerX,
						centerY
					) as HTMLElement;
					if (
						pickedEl &&
						! pickedEl.closest( '#wprig-dev-toolbar-root' )
					) {
						setSelectedElement( pickedEl );
					}
				} else {
					setSelectedElement( target );
				}
			} else {
				setSelectedElement( target );
			}

			isDraggingRef.current = false;
			setDragStart( null );
			setDragCurrent( null );
			setIsSelecting( false );
			setActiveTab( 'selector' );
		},
		[ isSelecting, dragStart ]
	);

	const handleKeyDown = useCallback( ( e: KeyboardEvent ) => {
		if ( e.key === 'Escape' ) {
			setIsSelecting( false );
			setHoverElement( null );
			setActiveTab( null );
		}
	}, [] );

	// Side Effects
	useEffect( () => {
		try {
			localStorage.setItem(
				'wprig_a11y_ignored_issues',
				JSON.stringify( ignoredRecords )
			);
		} catch ( e ) {
			// localStorage fallback
		}
	}, [ ignoredRecords ] );

	useEffect( () => {
		setIssues( runStrictA11yAudit() );
		setDetectedTemplates( getDetectedTemplates() );
	}, [] );

	useEffect( () => {
		if ( activeTab !== 'a11y' ) {
			return;
		}
		const handleScrollResize = () => setOverlayTick( ( t ) => t + 1 );
		window.addEventListener( 'scroll', handleScrollResize, {
			passive: true,
		} );
		window.addEventListener( 'resize', handleScrollResize, {
			passive: true,
		} );
		return () => {
			window.removeEventListener( 'scroll', handleScrollResize );
			window.removeEventListener( 'resize', handleScrollResize );
		};
	}, [ activeTab ] );

	// Auto-scroll inspect panel to selected issue card when selected on canvas/page
	useEffect( () => {
		if ( ! selectedIssue || activeTab !== 'a11y' || ! panelRef.current ) {
			return;
		}

		// Ensure filters don't hide the selected issue
		const query = searchQuery.trim().toLowerCase();
		const matchesSearch =
			! query ||
			selectedIssue.selector.toLowerCase().includes( query ) ||
			selectedIssue.message.toLowerCase().includes( query ) ||
			selectedIssue.detail.toLowerCase().includes( query );
		const matchesSeverity =
			severityFilter === 'all' || selectedIssue.type === severityFilter;
		const matchesCategory =
			categoryFilter === 'all' ||
			selectedIssue.category === categoryFilter;

		if ( ! matchesSearch || ! matchesSeverity || ! matchesCategory ) {
			if ( ! matchesSearch ) {
				setSearchQuery( '' );
			}
			if ( ! matchesSeverity ) {
				setSeverityFilter( 'all' );
			}
			if ( ! matchesCategory ) {
				setCategoryFilter( 'all' );
			}
		}

		// Ensure view mode matches ignored state
		const key = getIssueKey( selectedIssue );
		const isIgnored = ignoredRecords.some( ( r ) => r.key === key );
		if ( isIgnored && a11yViewMode !== 'ignored' ) {
			setA11yViewMode( 'ignored' );
		} else if ( ! isIgnored && a11yViewMode !== 'active' ) {
			setA11yViewMode( 'active' );
		}

		const timer = setTimeout( () => {
			if ( ! panelRef.current ) {
				return;
			}
			const cardEl =
				panelRef.current.querySelector< HTMLElement >(
					`[data-issue-id="${ selectedIssue.id }"]`
				) ||
				panelRef.current.querySelector< HTMLElement >(
					`[data-issue-key="${ key }"]`
				);

			if ( cardEl ) {
				cardEl.scrollIntoView( {
					behavior: 'smooth',
					block: 'center',
					inline: 'nearest',
				} );
			}
		}, 60 );

		return () => clearTimeout( timer );
	}, [
		selectedIssue,
		activeTab,
		a11yViewMode,
		searchQuery,
		severityFilter,
		categoryFilter,
		ignoredRecords,
	] );

	// Match page selectedElement to A11yIssue if activeTab === 'a11y'
	useEffect( () => {
		if ( ! selectedElement || activeTab !== 'a11y' ) {
			return;
		}
		const matchingIssue = issues.find(
			( i ) =>
				i.element === selectedElement ||
				( i.element && selectedElement.contains( i.element ) ) ||
				( i.element && i.element.contains( selectedElement ) )
		);
		if ( matchingIssue && selectedIssue?.id !== matchingIssue.id ) {
			handleSelectIssue( matchingIssue );
		}
	}, [
		selectedElement,
		activeTab,
		issues,
		selectedIssue?.id,
		handleSelectIssue,
	] );

	// Auto-scroll inspect panel body to top when selecting element in selector or token inspector tabs
	useEffect( () => {
		if (
			! selectedElement ||
			( activeTab !== 'selector' && activeTab !== 'token-inspector' ) ||
			! panelRef.current
		) {
			return;
		}
		const panelBody = panelRef.current.querySelector( '.wprig-panel-body' );
		if ( panelBody ) {
			panelBody.scrollTo( { top: 0, behavior: 'smooth' } );
		}
	}, [ selectedElement, activeTab ] );

	useEffect( () => {
		if ( ! isDraggingPanel ) {
			return;
		}

		const handlePanelDragMouseMove = ( e: MouseEvent ) => {
			if ( ! panelDragStartRef.current || ! panelRef.current ) {
				return;
			}
			const deltaX = e.clientX - panelDragStartRef.current.mouseX;
			const deltaY = e.clientY - panelDragStartRef.current.mouseY;

			let newX = panelDragStartRef.current.panelX + deltaX;
			let newY = panelDragStartRef.current.panelY + deltaY;

			const panelWidth = panelRef.current.offsetWidth || 460;
			const panelHeight = panelRef.current.offsetHeight || 600;
			const margin = 8;

			newX = Math.max(
				margin,
				Math.min( window.innerWidth - panelWidth - margin, newX )
			);
			newY = Math.max(
				margin,
				Math.min( window.innerHeight - panelHeight - margin, newY )
			);

			setPanelPosition( { x: newX, y: newY } );
		};

		const handlePanelDragTouchMove = ( e: TouchEvent ) => {
			if (
				! panelDragStartRef.current ||
				! panelRef.current ||
				e.touches.length !== 1
			) {
				return;
			}
			const touch = e.touches[ 0 ];
			const deltaX = touch.clientX - panelDragStartRef.current.mouseX;
			const deltaY = touch.clientY - panelDragStartRef.current.mouseY;

			let newX = panelDragStartRef.current.panelX + deltaX;
			let newY = panelDragStartRef.current.panelY + deltaY;

			const panelWidth = panelRef.current.offsetWidth || 460;
			const panelHeight = panelRef.current.offsetHeight || 600;
			const margin = 8;

			newX = Math.max(
				margin,
				Math.min( window.innerWidth - panelWidth - margin, newX )
			);
			newY = Math.max(
				margin,
				Math.min( window.innerHeight - panelHeight - margin, newY )
			);

			setPanelPosition( { x: newX, y: newY } );
		};

		const handleEnd = () => {
			setIsDraggingPanel( false );
			panelDragStartRef.current = null;
		};

		window.addEventListener( 'mousemove', handlePanelDragMouseMove );
		window.addEventListener( 'mouseup', handleEnd );
		window.addEventListener( 'touchmove', handlePanelDragTouchMove );
		window.addEventListener( 'touchend', handleEnd );
		window.addEventListener( 'touchcancel', handleEnd );

		return () => {
			window.removeEventListener( 'mousemove', handlePanelDragMouseMove );
			window.removeEventListener( 'mouseup', handleEnd );
			window.removeEventListener( 'touchmove', handlePanelDragTouchMove );
			window.removeEventListener( 'touchend', handleEnd );
			window.removeEventListener( 'touchcancel', handleEnd );
		};
	}, [ isDraggingPanel ] );

	useEffect( () => {
		if ( isSelecting ) {
			document.addEventListener( 'mousedown', handleMouseDown );
			document.addEventListener( 'mousemove', handleMouseMove );
			document.addEventListener( 'mouseup', handleMouseUp );
			document.addEventListener( 'keydown', handleKeyDown );
		}
		return () => {
			document.removeEventListener( 'mousedown', handleMouseDown );
			document.removeEventListener( 'mousemove', handleMouseMove );
			document.removeEventListener( 'mouseup', handleMouseUp );
			document.removeEventListener( 'keydown', handleKeyDown );
		};
	}, [
		isSelecting,
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
		handleKeyDown,
	] );

	const handleFgChange = ( newFg: string ) => {
		setCustomFgColor( newFg );
		if ( selectedIssue && selectedIssue.element ) {
			selectedIssue.element.style.color = newFg;
		}
	};

	const handleBgChange = ( newBg: string ) => {
		setCustomBgColor( newBg );
		if ( selectedIssue && selectedIssue.element ) {
			selectedIssue.element.style.backgroundColor = newBg;
		}
	};

	const handleResetColors = () => {
		if ( selectedIssue && selectedIssue.element ) {
			selectedIssue.element.style.color = originalStyles.color || '';
			selectedIssue.element.style.backgroundColor =
				originalStyles.backgroundColor || '';
			if ( selectedIssue.fgColor && selectedIssue.bgColor ) {
				setCustomFgColor( colorToHex( selectedIssue.fgColor ) );
				setCustomBgColor( colorToHex( selectedIssue.bgColor ) );
			}
		}
	};

	const handleTargetSizeChange = ( newSize: number ) => {
		setCustomTargetSize( newSize );
		if ( selectedIssue && selectedIssue.element ) {
			selectedIssue.element.style.minWidth = `${ newSize }px`;
			selectedIssue.element.style.minHeight = `${ newSize }px`;
		}
	};

	const handleAltTextChange = ( newAlt: string ) => {
		setCustomAltText( newAlt );
		if ( selectedIssue && selectedIssue.element ) {
			selectedIssue.element.setAttribute( 'alt', newAlt );
		}
	};

	const handleLabelTextChange = ( newLabel: string ) => {
		setCustomLabelText( newLabel );
		if ( selectedIssue && selectedIssue.element ) {
			selectedIssue.element.setAttribute( 'aria-label', newLabel );
		}
	};

	const handleCopyFixCSS = () => {
		if ( ! selectedIssue ) {
			return;
		}
		let cssFix = '';
		if ( selectedIssue.category === 'contrast' ) {
			cssFix = `/* WCAG 2.2 AA Contrast Fix for ${ selectedIssue.selector } */\n${ selectedIssue.selector } {\n    color: ${ customFgColor };\n    background-color: ${ customBgColor };\n}`;
		} else if ( selectedIssue.category === 'target-size' ) {
			cssFix = `/* WCAG 2.2 Touch Target Fix for ${ selectedIssue.selector } */\n${ selectedIssue.selector } {\n    min-width: ${ customTargetSize }px;\n    min-height: ${ customTargetSize }px;\n}`;
		}
		if ( cssFix ) {
			navigator.clipboard.writeText( cssFix );
			setCopyStatus( 'Copied CSS Fix!' );
			setTimeout( () => setCopyStatus( '' ), 2000 );
		}
	};

	const handleCopyAgentPromptA11y = () => {
		if ( ! selectedIssue ) {
			return;
		}
		let fixDetail = '';
		if ( selectedIssue.category === 'contrast' ) {
			const ratio =
				calculateContrastRatio( customFgColor, customBgColor ) || 1;
			fixDetail = `- **Remediated Colors:** Foreground \`${ customFgColor }\`, Background \`${ customBgColor }\`\n- **New Contrast Ratio:** \`${ ratio.toFixed(
				2
			) }:1\`\n\n\`\`\`css\n${
				selectedIssue.selector
			} {\n    color: ${ customFgColor };\n    background-color: ${ customBgColor };\n}\n\`\`\``;
		} else if ( selectedIssue.category === 'target-size' ) {
			fixDetail = `- **Remediated Touch Target Size:** \`${ customTargetSize }px x ${ customTargetSize }px\`\n\n\`\`\`css\n${ selectedIssue.selector } {\n    min-width: ${ customTargetSize }px;\n    min-height: ${ customTargetSize }px;\n}\n\`\`\``;
		} else if ( selectedIssue.category === 'alt-text' ) {
			fixDetail = `- **Added Alt Text:** \`alt="${ customAltText }"\``;
		} else if ( selectedIssue.category === 'form-label' ) {
			fixDetail = `- **Added Accessible Label:** \`aria-label="${ customLabelText }"\``;
		}

		const prompt = `Please remediate accessibility issue in WP Rig theme:
- **Selector:** \`${ selectedIssue.selector }\`
- **Category:** \`${ selectedIssue.category }\`
- **Issue:** ${ selectedIssue.message }
${ fixDetail }

Please update the relevant CSS or template file in the WP Rig theme source files to apply this fix.`;

		navigator.clipboard.writeText( prompt );
		setCopyStatus( 'Copied Agent Prompt!' );
		setTimeout( () => setCopyStatus( '' ), 2000 );
	};

	// Generate Layout & Positioning Agent Prompt for AI Selector
	const generateLayoutAgentPrompt = ( metrics: ElementMetrics ) => {
		const directive = customDirective.trim() || selectedChip;
		return `Please inspect and fix this element in the WP Rig theme:
- **Page URL:** \`${ window.location.pathname }\`
- **Selector:** \`${ metrics.selector }\`
- **Template Source:** \`${ metrics.templatePath }\`
- **Dimensions:** \`${ metrics.dimensions }\`
- **Display & Position:** \`display: ${ metrics.display }; position: ${ metrics.position }; z-index: ${ metrics.zIndex }\`
- **Box Model:** \`margin: ${ metrics.margin }; padding: ${ metrics.padding }\`
- **Computed Colors:** \`color: ${ metrics.color }; background: ${ metrics.backgroundColor }\`
- **Directive / Issue:** "${ directive }"

Current Computed Styles:
\`\`\`css
${ metrics.selector } {
    display: ${ metrics.display };
    position: ${ metrics.position };
    margin: ${ metrics.margin };
    padding: ${ metrics.padding };
}
\`\`\`
Please update the relevant PostCSS source file under \`assets/css/src/\` to resolve this issue.`;
	};

	const handleCopyLayoutPrompt = ( metrics: ElementMetrics ) => {
		const prompt = generateLayoutAgentPrompt( metrics );
		navigator.clipboard.writeText( prompt );
		setCopyStatus( 'Copied Layout Agent Prompt' );
		setTimeout( () => setCopyStatus( '' ), 2000 );
	};

	const handlePurgeCache = () => {
		fetch( '/wp-admin/admin-ajax.php?action=wprig_purge_cache' )
			.then( () => {
				setCopyStatus( 'Cache Purged Successfully!' );
				setTimeout( () => setCopyStatus( '' ), 2000 );
			} )
			.catch( () => {
				setCopyStatus( 'Cache Purge Requested' );
				setTimeout( () => setCopyStatus( '' ), 2000 );
			} );
	};

	const ignoredKeySet = new Set( ignoredRecords.map( ( r ) => r.key ) );

	const activeIssues = issues.filter(
		( issue ) => ! ignoredKeySet.has( getIssueKey( issue ) )
	);

	const errorCount = activeIssues.filter(
		( i ) => i.type === 'error'
	).length;
	const warningCount = activeIssues.filter(
		( i ) => i.type === 'warning'
	).length;
	const ignoredCount = ignoredRecords.length;
	const activeTotal = activeIssues.length;

	const selectedMetrics = selectedElement
		? getElementMetrics( selectedElement )
		: null;
	const offSpecStyles = selectedElement
		? getOffSpecStyles( selectedElement )
		: [];

	const filteredIssues = activeIssues
		.filter( ( issue ) => {
			if ( severityFilter !== 'all' && issue.type !== severityFilter ) {
				return false;
			}
			if (
				categoryFilter !== 'all' &&
				issue.category !== categoryFilter
			) {
				return false;
			}
			if ( searchQuery.trim() ) {
				const query = searchQuery.toLowerCase();
				return (
					issue.selector.toLowerCase().includes( query ) ||
					issue.message.toLowerCase().includes( query ) ||
					issue.detail.toLowerCase().includes( query )
				);
			}
			return true;
		} )
		.sort( ( a, b ) => {
			if ( sortBy === 'ratio' ) {
				return ( a.currentRatio || 99 ) - ( b.currentRatio || 99 );
			}
			if ( sortBy === 'category' ) {
				return a.category.localeCompare( b.category );
			}
			return a.type === 'error' ? -1 : 1;
		} );

	const filteredIgnoredRecords = ignoredRecords.filter( ( record ) => {
		if ( severityFilter !== 'all' && record.type !== severityFilter ) {
			return false;
		}
		if ( categoryFilter !== 'all' && record.category !== categoryFilter ) {
			return false;
		}
		if ( searchQuery.trim() ) {
			const query = searchQuery.toLowerCase();
			return (
				record.selector.toLowerCase().includes( query ) ||
				record.message.toLowerCase().includes( query ) ||
				record.detail.toLowerCase().includes( query )
			);
		}
		return true;
	} );

	// Calculate Drag Overlay Rect
	const dragRectCss =
		dragStart && dragCurrent
			? {
					top: Math.min( dragStart.y, dragCurrent.y ),
					left: Math.min( dragStart.x, dragCurrent.x ),
					width: Math.abs( dragCurrent.x - dragStart.x ),
					height: Math.abs( dragCurrent.y - dragStart.y ),
			  }
			: null;

	const hoverRectCss = hoverElement
		? hoverElement.getBoundingClientRect()
		: null;
	const selectedRectCss = selectedElement
		? selectedElement.getBoundingClientRect()
		: null;

	return (
		<div className="wprig-toolbar-container">
			{ /* Canvas Overlays */ }
			{ hoverRectCss && isSelecting && (
				<div
					className="wprig-hover-overlay"
					style={ {
						top: hoverRectCss.top,
						left: hoverRectCss.left,
						width: hoverRectCss.width,
						height: hoverRectCss.height,
					} }
				>
					<div className="wprig-overlay-badge">
						{ hoverElement?.tagName.toLowerCase() }{ ' ' }
						{ Math.round( hoverRectCss.width ) }x
						{ Math.round( hoverRectCss.height ) }px
					</div>
				</div>
			) }

			{ dragRectCss && (
				<div
					className="wprig-drag-overlay"
					style={ {
						top: dragRectCss.top,
						left: dragRectCss.left,
						width: dragRectCss.width,
						height: dragRectCss.height,
					} }
				>
					<div className="wprig-overlay-badge">
						Selecting: { Math.round( dragRectCss.width ) }x
						{ Math.round( dragRectCss.height ) }px
					</div>
				</div>
			) }

			{ selectedRectCss && ! isSelecting && (
				<div
					className="wprig-selected-overlay"
					style={ {
						top: selectedRectCss.top,
						left: selectedRectCss.left,
						width: selectedRectCss.width,
						height: selectedRectCss.height,
					} }
				>
					<div className="wprig-overlay-badge">
						Selected: { selectedElement?.tagName.toLowerCase() }{ ' ' }
						{ Math.round( selectedRectCss.width ) }x
						{ Math.round( selectedRectCss.height ) }px
					</div>
				</div>
			) }

			{ activeTab === 'a11y' &&
				filteredIssues.map( ( issue ) => {
					if (
						! issue.element ||
						! document.body.contains( issue.element )
					) {
						return null;
					}
					const rect = issue.element.getBoundingClientRect();
					if ( rect.width === 0 && rect.height === 0 ) {
						return null;
					}
					const isSelected = selectedIssue?.id === issue.id;

					return (
						<div
							key={ `a11y-overlay-${ issue.id }-${ overlayTick }` }
							className={ `wprig-a11y-target-overlay ${
								isSelected
									? 'wprig-a11y-target-overlay--selected'
									: 'wprig-a11y-target-overlay--subtle'
							} wprig-a11y-target-overlay--${ issue.type }` }
							style={ {
								top: rect.top,
								left: rect.left,
								width: rect.width,
								height: rect.height,
							} }
							onClick={ ( e ) => {
								e.stopPropagation();
								handleSelectIssue( issue );
							} }
							role="button"
							tabIndex={ 0 }
							aria-label={ `Inspect issue on canvas: ${ issue.category } - ${ issue.selector }` }
							onKeyDown={ ( e ) => {
								if ( e.key === 'Enter' || e.key === ' ' ) {
									e.preventDefault();
									handleSelectIssue( issue );
								}
							} }
						>
							<div className="wprig-a11y-overlay-badge">
								<A11yIcon />
								<span>
									{ isSelected
										? `${ issue.category }: ${ issue.message }`
										: issue.category }
								</span>
							</div>
						</div>
					);
				} ) }

			{ /* Bottom Docked Navigation Bar */ }
			<div
				className={ `wprig-toolbar-dock ${
					isClosed ? 'wprig-toolbar-dock--closed' : ''
				}` }
				role="region"
				aria-label="WP Rig Developer Tools Navigation"
			>
				<div className="wprig-toolbar-brand">
					<span>WP Rig Tools</span>
				</div>
				<div className="wprig-toolbar-nav" role="tablist">
					<button
						type="button"
						role="tab"
						aria-selected={
							isSelecting || activeTab === 'selector'
						}
						aria-label="AI Selector"
						className={ `wprig-toolbar-tab ${
							isSelecting || activeTab === 'selector'
								? 'wprig-toolbar-tab--active'
								: ''
						}` }
						onClick={ toggleSelectorMode }
					>
						<SelectorIcon />
						<span>AI Selector</span>
					</button>

					<button
						type="button"
						role="tab"
						aria-selected={ activeTab === 'file-locator' }
						aria-label="File Locator"
						className={ `wprig-toolbar-tab ${
							activeTab === 'file-locator'
								? 'wprig-toolbar-tab--active'
								: ''
						}` }
						onClick={ () =>
							setActiveTab(
								activeTab === 'file-locator'
									? null
									: 'file-locator'
							)
						}
					>
						<FileLocatorIcon />
						<span>File Locator</span>
					</button>

					<button
						type="button"
						role="tab"
						aria-selected={ activeTab === 'token-inspector' }
						aria-label="Token Inspector"
						className={ `wprig-toolbar-tab ${
							activeTab === 'token-inspector'
								? 'wprig-toolbar-tab--active'
								: ''
						}` }
						onClick={ () =>
							setActiveTab(
								activeTab === 'token-inspector'
									? null
									: 'token-inspector'
							)
						}
					>
						<TokenInspectorIcon />
						<span>Token Inspector</span>
					</button>

					<button
						type="button"
						role="tab"
						aria-selected={ activeTab === 'a11y' }
						aria-label="Accessibility Audit"
						className={ `wprig-toolbar-tab ${
							activeTab === 'a11y'
								? 'wprig-toolbar-tab--active'
								: ''
						}` }
						onClick={ () =>
							setActiveTab( activeTab === 'a11y' ? null : 'a11y' )
						}
					>
						<A11yIcon />
						<span>A11y Audit</span>
						{ errorCount > 0 && (
							<span className="wprig-badge">{ errorCount }</span>
						) }
						{ warningCount > 0 && (
							<span className="wprig-badge wprig-badge--warning">
								{ warningCount }
							</span>
						) }
					</button>

					<button
						type="button"
						aria-label="Purge Cache"
						className="wprig-toolbar-tab"
						onClick={ handlePurgeCache }
					>
						<PurgeIcon />
						<span>Purge Cache</span>
					</button>

					<button
						type="button"
						aria-label="Close Developer Toolbar"
						title="Close Toolbar"
						className="wprig-toolbar-tab wprig-toolbar-tab--close"
						onClick={ handleCloseToolbar }
					>
						<CloseIcon />
						<span>Close</span>
					</button>
				</div>
			</div>

			{ /* Reopen Circle Button in Bottom Right Corner */ }
			<button
				type="button"
				className={ `wprig-toolbar-reopen ${
					isClosed ? 'wprig-toolbar-reopen--visible' : ''
				}` }
				onClick={ handleOpenToolbar }
				aria-label="Open WP Rig Developer Tools"
				title="Open WP Rig Developer Tools"
			>
				<RigToolIcon />
			</button>

			{ /* AI Selector Panel */ }
			{ activeTab === 'selector' && (
				<div
					ref={ panelRef }
					style={ panelStyle }
					className={ `wprig-toolbar-panel ${
						isDraggingPanel ? 'wprig-toolbar-panel--dragging' : ''
					}` }
				>
					{ /* eslint-disable-next-line jsx-a11y/no-static-element-interactions */ }
					<div
						className="wprig-panel-header"
						onMouseDown={ handlePanelHeaderMouseDown }
						onTouchStart={ handlePanelHeaderTouchStart }
					>
						<h3 className="wprig-panel-title">
							<DragGripIcon />
							🎯 AI Selector & Layout Remediation
						</h3>
						<button
							type="button"
							className="wprig-panel-close"
							onClick={ () => setActiveTab( null ) }
						>
							✕
						</button>
					</div>
					<div className="wprig-panel-body">
						{ ! selectedMetrics ? (
							<div className="wprig-card">
								<div className="wprig-card-title">
									Selection Active
								</div>
								<p
									style={ {
										color: '#a1a1aa',
										fontSize: '12px',
									} }
								>
									Click or click-and-drag over any element on
									the page to inspect its metrics and build
									agent prompts for layout, positioning, and
									style remediation.
								</p>
								<button
									type="button"
									className="wprig-btn wprig-btn--primary"
									onClick={ toggleSelectorMode }
								>
									{ isSelecting
										? 'Selecting... (Click canvas)'
										: 'Start Selection Overlay' }
								</button>
							</div>
						) : (
							<>
								{ /* Selected Element Overview */ }
								<div className="wprig-card">
									<div className="wprig-card-title">
										Selected Element
									</div>
									<div className="wprig-metric-grid">
										<div className="wprig-metric-item">
											<span className="wprig-metric-label">
												Selector
											</span>
											<span className="wprig-metric-value">
												{ selectedMetrics.selector }
											</span>
										</div>
										<div className="wprig-metric-item">
											<span className="wprig-metric-label">
												Dimensions
											</span>
											<span className="wprig-metric-value">
												{ selectedMetrics.dimensions }
											</span>
										</div>
										<div
											className="wprig-metric-item"
											style={ { gridColumn: 'span 2' } }
										>
											<span className="wprig-metric-label">
												Template Source
											</span>
											<span
												className="wprig-metric-value"
												style={ { color: '#38bdf8' } }
											>
												{ selectedMetrics.templatePath }
											</span>
										</div>
									</div>
								</div>

								{ /* Box Model & Position Metrics */ }
								<div className="wprig-card">
									<div className="wprig-card-title">
										Layout & Spacing Metrics
									</div>
									<div className="wprig-metric-grid">
										<div className="wprig-metric-item">
											<span className="wprig-metric-label">
												Display
											</span>
											<span className="wprig-metric-value">
												{ selectedMetrics.display }
											</span>
										</div>
										<div className="wprig-metric-item">
											<span className="wprig-metric-label">
												Position
											</span>
											<span className="wprig-metric-value">
												{ selectedMetrics.position } (z:{ ' ' }
												{ selectedMetrics.zIndex })
											</span>
										</div>
										<div className="wprig-metric-item">
											<span className="wprig-metric-label">
												Margin
											</span>
											<span className="wprig-metric-value">
												{ selectedMetrics.margin }
											</span>
										</div>
										<div className="wprig-metric-item">
											<span className="wprig-metric-label">
												Padding
											</span>
											<span className="wprig-metric-value">
												{ selectedMetrics.padding }
											</span>
										</div>
									</div>
								</div>

								{ /* Prompt Directive Builder */ }
								<div className="wprig-card">
									<div className="wprig-card-title">
										Build Remediation Directive
									</div>

									<div
										style={ {
											display: 'flex',
											gap: '6px',
										} }
									>
										<select
											className="wprig-select"
											value={ directiveCategory }
											onChange={ ( e ) =>
												setDirectiveCategory(
													e.target.value
												)
											}
										>
											<option value="layout">
												Layout & Alignment
											</option>
											<option value="positioning">
												Positioning & Stacking
											</option>
											<option value="spacing">
												Spacing & Box Model
											</option>
											<option value="custom">
												Custom Directive
											</option>
										</select>
									</div>

									{ directiveCategory === 'layout' && (
										<div className="wprig-directive-chips">
											{ [
												'Align element with container',
												'Center horizontally',
												'Center vertically',
												'Fix flex/grid wrapping',
											].map( ( chip ) => (
												<button
													type="button"
													key={ chip }
													className={ `wprig-chip ${
														selectedChip === chip
															? 'wprig-chip--selected'
															: ''
													}` }
													onClick={ () =>
														setSelectedChip( chip )
													}
												>
													{ chip }
												</button>
											) ) }
										</div>
									) }

									{ directiveCategory === 'positioning' && (
										<div className="wprig-directive-chips">
											{ [
												'Fix z-index / overlapping',
												'Convert to position relative',
												'Fix mobile sticky menu collision',
											].map( ( chip ) => (
												<button
													type="button"
													key={ chip }
													className={ `wprig-chip ${
														selectedChip === chip
															? 'wprig-chip--selected'
															: ''
													}` }
													onClick={ () =>
														setSelectedChip( chip )
													}
												>
													{ chip }
												</button>
											) ) }
										</div>
									) }

									{ directiveCategory === 'spacing' && (
										<div className="wprig-directive-chips">
											{ [
												'Adjust responsive padding/margin',
												'Remove hardcoded margins',
												'Match design token spacing',
											].map( ( chip ) => (
												<button
													type="button"
													key={ chip }
													className={ `wprig-chip ${
														selectedChip === chip
															? 'wprig-chip--selected'
															: ''
													}` }
													onClick={ () =>
														setSelectedChip( chip )
													}
												>
													{ chip }
												</button>
											) ) }
										</div>
									) }

									<textarea
										className="wprig-textarea"
										placeholder="Optional: Add custom instructions or modifications..."
										value={ customDirective }
										onChange={ ( e ) =>
											setCustomDirective( e.target.value )
										}
									/>

									{ /* Prompt Preview Code Block */ }
									<div className="wprig-code-block">
										{ generateLayoutAgentPrompt(
											selectedMetrics
										) }
									</div>

									<div className="wprig-action-bar">
										<button
											type="button"
											className="wprig-btn wprig-btn--primary"
											onClick={ () =>
												handleCopyLayoutPrompt(
													selectedMetrics
												)
											}
										>
											Copy Agent Prompt
										</button>
										<button
											type="button"
											className="wprig-btn"
											onClick={ () =>
												setSelectedElement( null )
											}
										>
											Clear Selection
										</button>
									</div>
									{ promptCopyStatus && (
										<span
											style={ {
												fontSize: '11px',
												color: '#10b981',
											} }
										>
											{ promptCopyStatus }
										</span>
									) }
								</div>
							</>
						) }
					</div>
				</div>
			) }

			{ /* File Locator Panel */ }
			{ activeTab === 'file-locator' && (
				<div
					ref={ panelRef }
					style={ panelStyle }
					className={ `wprig-toolbar-panel ${
						isDraggingPanel ? 'wprig-toolbar-panel--dragging' : ''
					}` }
				>
					{ /* eslint-disable-next-line jsx-a11y/no-static-element-interactions */ }
					<div
						className="wprig-panel-header"
						onMouseDown={ handlePanelHeaderMouseDown }
						onTouchStart={ handlePanelHeaderTouchStart }
					>
						<h3 className="wprig-panel-title">
							<DragGripIcon />
							📂 Template File Locator
						</h3>
						<button
							type="button"
							className="wprig-panel-close"
							onClick={ () => setActiveTab( null ) }
						>
							✕
						</button>
					</div>
					<div className="wprig-panel-body">
						<div className="wprig-card">
							<div className="wprig-card-title">
								Root Template
							</div>
							<span
								className="wprig-metric-value"
								style={ { color: '#38bdf8', fontSize: '13px' } }
							>
								{ detectedTemplates.rootTemplate }
							</span>
						</div>

						<div className="wprig-card">
							<div className="wprig-card-title">
								Rendered Template Parts & Blocks (
								{ detectedTemplates.templates.length })
							</div>
							<div className="wprig-issue-list">
								{ detectedTemplates.templates.map( ( item ) => (
									<div
										key={ item.name }
										className="wprig-metric-item"
										style={ {
											display: 'flex',
											flexDirection: 'row',
											justifyContent: 'space-between',
											alignItems: 'center',
										} }
									>
										<div>
											<span className="wprig-metric-label">
												{ item.type }
											</span>
											<span className="wprig-metric-value">
												{ item.name }
											</span>
										</div>
										<span className="wprig-badge wprig-badge--info">
											{ item.count }x
										</span>
									</div>
								) ) }
							</div>
						</div>
					</div>
				</div>
			) }

			{ /* Token Inspector Panel */ }
			{ activeTab === 'token-inspector' && (
				<div
					ref={ panelRef }
					style={ panelStyle }
					className={ `wprig-toolbar-panel ${
						isDraggingPanel ? 'wprig-toolbar-panel--dragging' : ''
					}` }
				>
					{ /* eslint-disable-next-line jsx-a11y/no-static-element-interactions */ }
					<div
						className="wprig-panel-header"
						onMouseDown={ handlePanelHeaderMouseDown }
						onTouchStart={ handlePanelHeaderTouchStart }
					>
						<h3 className="wprig-panel-title">
							<DragGripIcon />
							🎨 Design Token Inspector
						</h3>
						<button
							type="button"
							className="wprig-panel-close"
							onClick={ () => setActiveTab( null ) }
						>
							✕
						</button>
					</div>
					<div className="wprig-panel-body">
						{ ! selectedElement ? (
							<div className="wprig-card">
								<p
									style={ {
										color: '#a1a1aa',
										fontSize: '12px',
									} }
								>
									Select an element on the canvas to audit its
									CSS properties against theme design tokens.
								</p>
								<button
									type="button"
									className="wprig-btn wprig-btn--primary"
									onClick={ toggleSelectorMode }
								>
									Pick Element
								</button>
							</div>
						) : (
							<div className="wprig-card">
								<div className="wprig-card-title">
									Hardcoded Values vs Tokens (
									{ getBemSelector( selectedElement ) })
								</div>
								<div className="wprig-issue-list">
									{ offSpecStyles.length === 0 ? (
										<p
											style={ {
												color: '#10b981',
												fontSize: '12px',
											} }
										>
											✓ All inspected styles appear
											compliant with theme tokens.
										</p>
									) : (
										offSpecStyles.map( ( item ) => (
											<div
												key={ item.property }
												className="wprig-metric-item"
											>
												<span className="wprig-metric-label">
													{ item.property }
												</span>
												<span
													className="wprig-metric-value"
													style={ {
														color: '#f87171',
													} }
												>
													{ item.value }
												</span>
												<span
													className="wprig-metric-label"
													style={ {
														marginTop: '4px',
													} }
												>
													Suggested Token:{ ' ' }
													<code
														style={ {
															color: '#38bdf8',
														} }
													>
														{ item.suggestedToken }
													</code>
												</span>
											</div>
										) )
									) }
								</div>
							</div>
						) }
					</div>
				</div>
			) }

			{ /* A11y Audit Panel */ }
			{ activeTab === 'a11y' && (
				<div
					ref={ panelRef }
					style={ panelStyle }
					className={ `wprig-toolbar-panel ${
						isDraggingPanel ? 'wprig-toolbar-panel--dragging' : ''
					}` }
					role="region"
					aria-label="Accessibility Audit Panel"
				>
					{ /* eslint-disable-next-line jsx-a11y/no-static-element-interactions */ }
					<div
						className="wprig-panel-header"
						onMouseDown={ handlePanelHeaderMouseDown }
						onTouchStart={ handlePanelHeaderTouchStart }
					>
						<h3 className="wprig-panel-title">
							<DragGripIcon />♿ Accessibility Inspector
						</h3>
						<button
							type="button"
							className="wprig-panel-close"
							onClick={ () => setActiveTab( null ) }
							aria-label="Close Accessibility Audit Panel"
						>
							✕
						</button>
					</div>
					<div className="wprig-panel-body">
						<div
							className="wprig-sr-only"
							aria-live="polite"
							aria-atomic="true"
						>
							{ `Found ${ filteredIssues.length } accessibility ${
								filteredIssues.length === 1 ? 'issue' : 'issues'
							}.` }
						</div>

						<div className="wprig-audit-summary">
							<div className="wprig-summary-stat">
								<span
									className="wprig-summary-value"
									style={ {
										color:
											errorCount > 0
												? '#ef4444'
												: '#10b981',
									} }
								>
									{ errorCount }
								</span>
								<span className="wprig-summary-label">
									Errors
								</span>
							</div>
							<div className="wprig-summary-stat">
								<span
									className="wprig-summary-value"
									style={ {
										color:
											warningCount > 0
												? '#f59e0b'
												: '#10b981',
									} }
								>
									{ warningCount }
								</span>
								<span className="wprig-summary-label">
									Warnings
								</span>
							</div>
							{ /* eslint-disable-next-line jsx-a11y/no-static-element-interactions */ }
							<div
								className="wprig-summary-stat"
								style={ { cursor: 'pointer' } }
								onClick={ () => setA11yViewMode( 'ignored' ) }
								role="button"
								tabIndex={ 0 }
								onKeyDown={ ( e ) => {
									if ( e.key === 'Enter' || e.key === ' ' ) {
										setA11yViewMode( 'ignored' );
									}
								} }
							>
								<span
									className="wprig-summary-value"
									style={ { color: '#c084fc' } }
								>
									{ ignoredCount }
								</span>
								<span className="wprig-summary-label">
									Ignored
								</span>
							</div>
							{ /* eslint-disable-next-line jsx-a11y/no-static-element-interactions */ }
							<div
								className="wprig-summary-stat"
								style={ { cursor: 'pointer' } }
								onClick={ () => setA11yViewMode( 'active' ) }
								role="button"
								tabIndex={ 0 }
								onKeyDown={ ( e ) => {
									if ( e.key === 'Enter' || e.key === ' ' ) {
										setA11yViewMode( 'active' );
									}
								} }
							>
								<span
									className="wprig-summary-value"
									style={ { color: '#38bdf8' } }
								>
									{ activeTotal }
								</span>
								<span className="wprig-summary-label">
									Active Total
								</span>
							</div>
						</div>

						<div className="wprig-view-toggle">
							<button
								type="button"
								className={ `wprig-toggle-btn ${
									a11yViewMode === 'active'
										? 'wprig-toggle-btn--active'
										: ''
								}` }
								onClick={ () => setA11yViewMode( 'active' ) }
							>
								Active Issues ({ activeTotal })
							</button>
							<button
								type="button"
								className={ `wprig-toggle-btn ${
									a11yViewMode === 'ignored'
										? 'wprig-toggle-btn--active'
										: ''
								}` }
								onClick={ () => setA11yViewMode( 'ignored' ) }
							>
								Ignored Callouts ({ ignoredCount })
							</button>
						</div>

						<div className="wprig-controls-bar">
							<div className="wprig-search-wrapper">
								<SearchIcon />
								<input
									type="text"
									className="wprig-search-input"
									placeholder="Search issues by selector or message..."
									value={ searchQuery }
									onChange={ ( e ) =>
										setSearchQuery( e.target.value )
									}
									aria-label="Search accessibility issues"
								/>
							</div>
							<div className="wprig-filter-group">
								<div className="wprig-select-wrapper">
									<select
										className="wprig-filter-select"
										value={ severityFilter }
										onChange={ ( e ) =>
											setSeverityFilter( e.target.value )
										}
										aria-label="Filter issues by severity"
									>
										<option value="all">
											All Severities
										</option>
										<option value="error">
											Errors Only
										</option>
										<option value="warning">
											Warnings Only
										</option>
									</select>
								</div>
								<div className="wprig-select-wrapper">
									<select
										className="wprig-filter-select"
										value={ categoryFilter }
										onChange={ ( e ) =>
											setCategoryFilter( e.target.value )
										}
										aria-label="Filter issues by category"
									>
										<option value="all">
											All Categories
										</option>
										<option value="contrast">
											Contrast
										</option>
										<option value="target-size">
											Target Size
										</option>
										<option value="alt-text">
											Alt Text
										</option>
										<option value="form-label">
											Form Labels
										</option>
										<option value="heading-hierarchy">
											Headings
										</option>
									</select>
								</div>
								<div className="wprig-select-wrapper">
									<select
										className="wprig-filter-select"
										value={ sortBy }
										onChange={ ( e ) =>
											setSortBy( e.target.value )
										}
										aria-label="Sort issues by"
									>
										<option value="severity">
											Sort: Severity
										</option>
										<option value="ratio">
											Sort: Contrast
										</option>
										<option value="category">
											Sort: Category
										</option>
									</select>
								</div>
							</div>
						</div>

						<div className="wprig-issue-list">
							{ a11yViewMode === 'active' && (
								<>
									{ filteredIssues.length === 0 ? (
										<div className="wprig-empty-state">
											🎉 No active accessibility issues
											found matching filter criteria!
										</div>
									) : (
										filteredIssues.map( ( issue ) => {
											const isSelected =
												selectedIssue?.id === issue.id;
											const options =
												issue.category === 'contrast' &&
												issue.fgColor &&
												issue.bgColor
													? generateColorRemediations(
															issue.fgColor,
															issue.bgColor,
															issue.requiredRatio ===
																3.0
													  )
													: [];

											return (
												<div
													key={ issue.id }
													data-issue-id={ issue.id }
													data-issue-key={ getIssueKey(
														issue
													) }
													className={ `wprig-issue-card wprig-issue-card--${
														issue.type
													} ${
														isSelected
															? 'wprig-issue-card--selected'
															: ''
													}` }
												>
													<div className="wprig-issue-card-top">
														<button
															type="button"
															className="wprig-issue-card-header"
															onClick={ () =>
																handleSelectIssue(
																	issue
																)
															}
														>
															<div className="wprig-issue-header">
																<span
																	className={ `wprig-issue-type wprig-issue-type--${ issue.type }` }
																>
																	{
																		issue.category
																	}
																</span>
																<span className="wprig-issue-element">
																	{
																		issue.selector
																	}
																</span>
															</div>
															<div className="wprig-issue-message">
																{
																	issue.message
																}
															</div>
															<div className="wprig-issue-detail">
																{ issue.detail }
															</div>
														</button>
														<button
															type="button"
															className="wprig-btn-action wprig-btn-action--ignore"
															title="Ignore callout"
															aria-label={ `Ignore callout for ${ issue.selector }` }
															onClick={ ( e ) => {
																e.stopPropagation();
																handleIgnoreIssue(
																	issue
																);
															} }
														>
															<EyeOffIcon />
															<span>Ignore</span>
														</button>
													</div>

													{ /* Contrast Color Picker Remediation */ }
													{ issue.category ===
														'contrast' &&
														isSelected && (
															<div className="wprig-remediation-box">
																<div className="wprig-remediation-header">
																	<span className="wprig-remediation-title">
																		Interactive
																		Color
																		Picker
																		Remediation
																	</span>
																	<button
																		type="button"
																		className="wprig-btn wprig-btn--sm"
																		onClick={
																			handleResetColors
																		}
																	>
																		Reset
																	</button>
																</div>

																<div className="wprig-color-picker-grid">
																	<div className="wprig-color-picker-box">
																		<label
																			className="wprig-picker-label"
																			htmlFor={ `fg-input-${ issue.id }` }
																		>
																			Foreground
																			(Text)
																		</label>
																		<div className="wprig-color-input-wrapper">
																			<input
																				id={ `fg-input-${ issue.id }` }
																				type="color"
																				className="wprig-color-swatch-input"
																				value={
																					customFgColor
																				}
																				onChange={ (
																					e
																				) =>
																					handleFgChange(
																						e
																							.target
																							.value
																					)
																				}
																			/>
																			<input
																				type="text"
																				aria-label="Foreground Hex Code"
																				className="wprig-input wprig-input--color-hex"
																				value={
																					customFgColor
																				}
																				onChange={ (
																					e
																				) =>
																					handleFgChange(
																						e
																							.target
																							.value
																					)
																				}
																			/>
																		</div>
																	</div>

																	<div className="wprig-color-picker-box">
																		<label
																			className="wprig-picker-label"
																			htmlFor={ `bg-input-${ issue.id }` }
																		>
																			Background
																		</label>
																		<div className="wprig-color-input-wrapper">
																			<input
																				id={ `bg-input-${ issue.id }` }
																				type="color"
																				className="wprig-color-swatch-input"
																				value={
																					customBgColor
																				}
																				onChange={ (
																					e
																				) =>
																					handleBgChange(
																						e
																							.target
																							.value
																					)
																				}
																			/>
																			<input
																				type="text"
																				aria-label="Background Hex Code"
																				className="wprig-input wprig-input--color-hex"
																				value={
																					customBgColor
																				}
																				onChange={ (
																					e
																				) =>
																					handleBgChange(
																						e
																							.target
																							.value
																					)
																				}
																			/>
																		</div>
																	</div>
																</div>

																{ ( () => {
																	const liveRatio =
																		calculateContrastRatio(
																			customFgColor,
																			customBgColor
																		) || 1;
																	const passesAA =
																		liveRatio >=
																		( issue.requiredRatio ||
																			4.5 );
																	const passesAAA =
																		liveRatio >=
																		( issue.requiredRatio ===
																		3.0
																			? 4.5
																			: 7.0 );

																	const fgRgb =
																		parseColorToRgb(
																			customFgColor
																		) || {
																			r: 0,
																			g: 0,
																			b: 0,
																			a: 1,
																		};

																	return (
																		<>
																			<div className="wprig-compliance-banner">
																				<div className="wprig-ratio-metric">
																					<span className="wprig-ratio-value">
																						{ liveRatio.toFixed(
																							2
																						) }
																						:1
																					</span>
																					<span className="wprig-ratio-label">
																						Live
																						Contrast
																						Ratio
																					</span>
																				</div>
																				<div className="wprig-status-badges">
																					<span
																						className={ `wprig-status-badge ${
																							passesAA
																								? 'wprig-status-badge--pass'
																								: 'wprig-status-badge--fail'
																						}` }
																					>
																						{ passesAA
																							? '✓ AA PASS'
																							: '✕ AA FAIL' }
																					</span>
																					<span
																						className={ `wprig-status-badge ${
																							passesAAA
																								? 'wprig-status-badge--pass'
																								: 'wprig-status-badge--fail'
																						}` }
																					>
																						{ passesAAA
																							? '✓ AAA PASS'
																							: '✕ AAA FAIL' }
																					</span>
																				</div>
																			</div>

																			<div
																				className="wprig-live-preview-card"
																				style={ {
																					color: customFgColor,
																					backgroundColor:
																						customBgColor,
																				} }
																			>
																				<span className="wprig-preview-headline">
																					Sample
																					Heading
																					(Aa)
																				</span>
																				<span className="wprig-preview-body">
																					Live
																					contrast
																					preview
																					updating
																					directly
																					on
																					page
																					element!
																				</span>
																			</div>

																			<div className="wprig-format-list">
																				<div className="wprig-format-item">
																					<span className="wprig-format-label">
																						HEX:
																					</span>
																					<span className="wprig-format-value">
																						{
																							customFgColor
																						}{ ' ' }
																						/{ ' ' }
																						{
																							customBgColor
																						}
																					</span>
																				</div>
																				<div className="wprig-format-item">
																					<span className="wprig-format-label">
																						HSL:
																					</span>
																					<span className="wprig-format-value">
																						{ rgbToHsl(
																							fgRgb.r,
																							fgRgb.g,
																							fgRgb.b
																						) }
																					</span>
																				</div>
																				<div className="wprig-format-item">
																					<span className="wprig-format-label">
																						OKLCH:
																					</span>
																					<span className="wprig-format-value">
																						{ rgbToOklch(
																							fgRgb.r,
																							fgRgb.g,
																							fgRgb.b
																						) }
																					</span>
																				</div>
																			</div>
																		</>
																	);
																} )() }

																<div className="wprig-preset-title">
																	Preset High
																	Contrast
																	Combinations
																</div>
																<div className="wprig-color-options">
																	{ options.map(
																		(
																			opt
																		) => (
																			<button
																				type="button"
																				key={
																					opt.id
																				}
																				className={ `wprig-color-option ${
																					customFgColor ===
																						colorToHex(
																							opt.fg
																						) &&
																					customBgColor ===
																						colorToHex(
																							opt.bg
																						)
																						? 'wprig-color-option--selected'
																						: ''
																				}` }
																				onClick={ () => {
																					handleFgChange(
																						colorToHex(
																							opt.fg
																						)
																					);
																					handleBgChange(
																						colorToHex(
																							opt.bg
																						)
																					);
																				} }
																			>
																				<div className="wprig-swatch-pair">
																					<div
																						className="wprig-color-swatch"
																						style={ {
																							color: opt.fg,
																							backgroundColor:
																								opt.bg,
																						} }
																					>
																						Aa
																					</div>
																					<div className="wprig-color-meta">
																						<span className="wprig-color-name">
																							{
																								opt.name
																							}
																						</span>
																						<span className="wprig-color-ratio">
																							{
																								opt.ratio
																							}
																							:1
																							(
																							{
																								opt.wcagRating
																							}

																							)
																						</span>
																					</div>
																				</div>
																				<span className="wprig-btn wprig-btn--sm">
																					Apply
																				</span>
																			</button>
																		)
																	) }
																</div>

																<div className="wprig-action-bar">
																	<button
																		type="button"
																		className="wprig-btn wprig-btn--success"
																		onClick={
																			handleCopyFixCSS
																		}
																	>
																		Copy CSS
																		Fix
																	</button>
																	<button
																		type="button"
																		className="wprig-btn wprig-btn--primary"
																		onClick={
																			handleCopyAgentPromptA11y
																		}
																	>
																		Copy
																		Agent
																		Prompt
																	</button>
																	{ promptCopyStatus && (
																		<span className="wprig-copy-status-msg">
																			{
																				promptCopyStatus
																			}
																		</span>
																	) }
																</div>
															</div>
														) }

													{ /* Touch Target Remediation */ }
													{ issue.category ===
														'target-size' &&
														isSelected && (
															<div className="wprig-remediation-box">
																<div className="wprig-remediation-title">
																	Touch Target
																	Size
																	Remediation
																</div>
																<div className="wprig-input-group">
																	<label
																		className="wprig-picker-label"
																		htmlFor={ `target-size-range-${ issue.id }` }
																	>
																		Minimum
																		Target
																		Size:{ ' ' }
																		{
																			customTargetSize
																		}
																		px
																	</label>
																	<input
																		id={ `target-size-range-${ issue.id }` }
																		type="range"
																		min="24"
																		max="60"
																		value={
																			customTargetSize
																		}
																		className="wprig-range-input"
																		onChange={ (
																			e
																		) =>
																			handleTargetSizeChange(
																				parseInt(
																					e
																						.target
																						.value,
																					10
																				)
																			)
																		}
																	/>
																</div>
																<div className="wprig-action-bar">
																	<button
																		type="button"
																		className="wprig-btn wprig-btn--success"
																		onClick={
																			handleCopyFixCSS
																		}
																	>
																		Copy CSS
																		Fix
																	</button>
																	<button
																		type="button"
																		className="wprig-btn wprig-btn--primary"
																		onClick={
																			handleCopyAgentPromptA11y
																		}
																	>
																		Copy
																		Agent
																		Prompt
																	</button>
																	{ promptCopyStatus && (
																		<span className="wprig-copy-status-msg">
																			{
																				promptCopyStatus
																			}
																		</span>
																	) }
																</div>
															</div>
														) }

													{ /* Alt Text Remediation */ }
													{ issue.category ===
														'alt-text' &&
														isSelected && (
															<div className="wprig-remediation-box">
																<div className="wprig-remediation-title">
																	Alt Text
																	Remediation
																</div>
																<input
																	type="text"
																	aria-label="Descriptive alt text"
																	className="wprig-input"
																	placeholder="Enter descriptive alt text..."
																	value={
																		customAltText
																	}
																	onChange={ (
																		e
																	) =>
																		handleAltTextChange(
																			e
																				.target
																				.value
																		)
																	}
																/>
																<div className="wprig-action-bar">
																	<button
																		type="button"
																		className="wprig-btn wprig-btn--primary"
																		onClick={
																			handleCopyAgentPromptA11y
																		}
																	>
																		Copy
																		Agent
																		Prompt
																	</button>
																	{ promptCopyStatus && (
																		<span className="wprig-copy-status-msg">
																			{
																				promptCopyStatus
																			}
																		</span>
																	) }
																</div>
															</div>
														) }

													{ /* Form Label Remediation */ }
													{ issue.category ===
														'form-label' &&
														isSelected && (
															<div className="wprig-remediation-box">
																<div className="wprig-remediation-title">
																	Accessible
																	Form Label
																	Remediation
																</div>
																<input
																	type="text"
																	aria-label="Accessible form label"
																	className="wprig-input"
																	placeholder="Enter aria-label text..."
																	value={
																		customLabelText
																	}
																	onChange={ (
																		e
																	) =>
																		handleLabelTextChange(
																			e
																				.target
																				.value
																		)
																	}
																/>
																<div className="wprig-action-bar">
																	<button
																		type="button"
																		className="wprig-btn wprig-btn--primary"
																		onClick={
																			handleCopyAgentPromptA11y
																		}
																	>
																		Copy
																		Agent
																		Prompt
																	</button>
																	{ promptCopyStatus && (
																		<span className="wprig-copy-status-msg">
																			{
																				promptCopyStatus
																			}
																		</span>
																	) }
																</div>
															</div>
														) }
												</div>
											);
										} )
									) }
								</>
							) }

							{ a11yViewMode === 'ignored' && (
								<>
									{ ignoredCount > 0 && (
										<div className="wprig-ignored-header-actions">
											<span className="wprig-ignored-subtitle">
												Ignored callouts are suppressed
												from active audits and canvas
												highlights.
											</span>
											<button
												type="button"
												className="wprig-btn-action wprig-btn-action--unignore"
												onClick={ handleUnignoreAll }
											>
												<RestoreIcon />
												<span>Restore All</span>
											</button>
										</div>
									) }
									{ filteredIgnoredRecords.length === 0 ? (
										<div className="wprig-empty-state">
											No ignored accessibility callouts
											found. Any ignored issues will
											appear here.
										</div>
									) : (
										filteredIgnoredRecords.map(
											( record ) => {
												const liveIssue = issues.find(
													( i ) =>
														getIssueKey( i ) ===
														record.key
												);
												const isSelected =
													liveIssue &&
													selectedIssue?.id ===
														liveIssue.id;

												return (
													<div
														key={ record.key }
														data-issue-key={
															record.key
														}
														data-issue-id={
															liveIssue?.id
														}
														className={ `wprig-issue-card wprig-issue-card--ignored wprig-issue-card--${
															record.type
														} ${
															isSelected
																? 'wprig-issue-card--selected'
																: ''
														}` }
													>
														<div className="wprig-issue-card-top">
															{ /* eslint-disable-next-line jsx-a11y/no-static-element-interactions */ }
															<div
																className="wprig-issue-card-header"
																onClick={ () => {
																	if (
																		liveIssue
																	) {
																		handleSelectIssue(
																			liveIssue
																		);
																	}
																} }
																role={
																	liveIssue
																		? 'button'
																		: undefined
																}
																tabIndex={
																	liveIssue
																		? 0
																		: undefined
																}
																onKeyDown={ (
																	e
																) => {
																	if (
																		liveIssue &&
																		( e.key ===
																			'Enter' ||
																			e.key ===
																				' ' )
																	) {
																		handleSelectIssue(
																			liveIssue
																		);
																	}
																} }
															>
																<div className="wprig-issue-header">
																	<span
																		className={ `wprig-issue-type wprig-issue-type--${ record.type }` }
																	>
																		{
																			record.category
																		}
																	</span>
																	<span className="wprig-issue-element">
																		{
																			record.selector
																		}
																	</span>
																</div>
																<div className="wprig-issue-message">
																	{
																		record.message
																	}
																</div>
																<div className="wprig-issue-detail">
																	{
																		record.detail
																	}
																	{ record.ignoredAt && (
																		<span className="wprig-ignored-timestamp">
																			{ ' ' }
																			•
																			Suppressed
																			at{ ' ' }
																			{
																				record.ignoredAt
																			}
																		</span>
																	) }
																</div>
															</div>
															<button
																type="button"
																className="wprig-btn-action wprig-btn-action--unignore"
																title="Restore callout to active list"
																aria-label={ `Unignore callout for ${ record.selector }` }
																onClick={ (
																	e
																) => {
																	e.stopPropagation();
																	handleUnignoreIssue(
																		record.key
																	);
																} }
															>
																<RestoreIcon />
																<span>
																	Unignore
																</span>
															</button>
														</div>
													</div>
												);
											}
										)
									) }
								</>
							) }
						</div>
					</div>
				</div>
			) }
		</div>
	);
};

function mountDevToolbar() {
	if ( document.getElementById( 'wprig-dev-toolbar-root' ) ) {
		return;
	}

	const container = document.createElement( 'div' );
	container.id = 'wprig-dev-toolbar-root';
	document.body.appendChild( container );

	const shadowRoot = container.attachShadow( { mode: 'open' } );

	const link = document.createElement( 'link' );
	link.rel = 'stylesheet';
	const windowData = (
		window as unknown as {
			wprigDevToolbarData?: { cssUri?: string };
		}
	 ).wprigDevToolbarData;
	link.href =
		windowData?.cssUri ||
		'/wp-content/themes/wprig/assets/css/dev-toolbar.css';
	shadowRoot.appendChild( link );

	const mountPoint = document.createElement( 'div' );
	shadowRoot.appendChild( mountPoint );

	const root = createRoot( mountPoint );
	root.render( <DevToolbarApp /> );
}

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', mountDevToolbar );
} else {
	mountDevToolbar();
}
