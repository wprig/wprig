#!/usr/bin/env node

/**
 * .ai/tools/inspect.js
 * Fast semantic DOM, layout, and responsive viewport inspector for agentic development.
 * 
 * Usage:
 *   node .ai/tools/inspect.js --url /about/ --selector ".my-component"
 *   node .ai/tools/inspect.js --url / --selector "#masthead" --screenshot
 *   node .ai/tools/inspect.js --selector "h1, p" --viewport "mobile, tablet, desktop"
 */

import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const rootDir = path.resolve( __dirname, '..', '..' );

// Load theme config to match proxyURL
const configPath = path.resolve( rootDir, 'config/config.json' );
let themeConfig = {};
try {
	themeConfig = JSON.parse( fs.readFileSync( configPath, 'utf-8' ) );
} catch ( e ) {
	// Fallback if file doesn't exist
}

const proxyURL = themeConfig?.dev?.browserSync?.proxyURL || 'localhost:8888';
const protocol = themeConfig?.dev?.browserSync?.https ? 'https' : 'http';
const wpBaseUrl = process.env.WP_BASE_URL || `${ protocol }://${ proxyURL }`;

const VIEWPORT_PRESETS = {
	mobile: { width: 375, height: 667 },
	tablet: { width: 768, height: 1024 },
	desktop: { width: 1200, height: 800 }
};

async function main() {
	const args = process.argv.slice( 2 );
	
	const urlIndex = args.indexOf( '--url' );
	const urlArg = args.find( a => a.startsWith( '--url=' ) )?.split( '=' )[ 1 ] || ( urlIndex !== -1 ? args[ urlIndex + 1 ] : '/' );
	
	const selectorIndex = args.indexOf( '--selector' );
	const selector = args.find( a => a.startsWith( '--selector=' ) )?.split( '=' )[ 1 ] || ( selectorIndex !== -1 ? args[ selectorIndex + 1 ] : null );
	
	const screenshot = args.includes( '--screenshot' );

	const hoverIndex = args.indexOf( '--hover' );
	const hoverSelector = args.find( a => a.startsWith( '--hover=' ) )?.split( '=' )[ 1 ] || ( hoverIndex !== -1 ? args[ hoverIndex + 1 ] : null );
	
	const viewportIndex = args.indexOf( '--viewport' ) !== -1 ? args.indexOf( '--viewport' ) : args.indexOf( '--viewports' );
	const viewportsArg = args.find( a => a.startsWith( '--viewport=' ) )?.split( '=' )[ 1 ] || args.find( a => a.startsWith( '--viewports=' ) )?.split( '=' )[ 1 ] || ( viewportIndex !== -1 ? args[ viewportIndex + 1 ] : null );

	if ( ! selector ) {
		console.error( JSON.stringify( { error: 'Missing --selector argument. Example: --selector ".site-header"' } ) );
		process.exit( 1 );
	}

	const selectors = selector.split( ',' ).map( s => s.trim() ).filter( Boolean );
	
	const explicitlyPassedViewports = !! viewportsArg;
	const viewports = viewportsArg 
		? viewportsArg.split( ',' ).map( v => v.trim().toLowerCase() ).filter( Boolean )
		: [ 'desktop' ];

	const browser = await chromium.launch();
	const page = await browser.newPage();
	page.setDefaultTimeout( 5000 );

	const targetUrl = ( urlArg.startsWith( 'http://' ) || urlArg.startsWith( 'https://' ) ) ? urlArg : `${ wpBaseUrl }${ urlArg }`;

	try {
		await page.goto( targetUrl, { waitUntil: 'networkidle' } );
		
		const results = {};

		for ( const vpName of viewports ) {
			let width = 1200;
			let height = 800;

			if ( VIEWPORT_PRESETS[ vpName ] ) {
				width = VIEWPORT_PRESETS[ vpName ].width;
				height = VIEWPORT_PRESETS[ vpName ].height;
			} else if ( vpName.includes( 'x' ) ) {
				const [ w, h ] = vpName.split( 'x' ).map( Number );
				if ( w ) width = w;
				if ( h ) height = h;
			} else if ( ! isNaN( Number( vpName ) ) ) {
				width = Number( vpName );
			}

			await page.setViewportSize( { width, height } );
			// Wait a moment for responsive layout and custom media query reflows to settle
			await page.waitForTimeout( 250 );

			if ( hoverSelector ) {
			        const hoverSelectors = hoverSelector.split( ',' ).map( s => s.trim() ).filter( Boolean );
			        for ( const hSel of hoverSelectors ) {
			                const hoverEl = page.locator( hSel ).first();
			                if ( await hoverEl.count() > 0 ) {
			                        await hoverEl.hover();
			                        // Wait a moment for hover transitions to settle before the next hover
			                        await page.waitForTimeout( 300 );
			                }
			        }
			        // Final wait for nested menus to settle
			        await page.waitForTimeout( 200 );
			}

			results[ vpName ] = {};

			for ( const sel of selectors ) {
				const element = page.locator( sel ).first();
				if ( await element.count() === 0 ) {
					results[ vpName ][ sel ] = { error: `Element not found: ${ sel }` };
					continue;
				}

				// Perform deep semantic measurement
				const layoutData = await element.evaluate( ( el ) => {
					const rect = el.getBoundingClientRect();
					const style = window.getComputedStyle( el );
					
					// Extract sibling offsets
					const prev = el.previousElementSibling;
					const next = el.nextElementSibling;
					const prevRect = prev ? prev.getBoundingClientRect() : null;
					const nextRect = next ? next.getBoundingClientRect() : null;

					// Automated visual auditing & overflow/overlap observations
					const observations = [];

					// 1. Parent Overflow Check
					const parent = el.parentElement;
					if ( parent ) {
						const parentRect = parent.getBoundingClientRect();
						// Check for horizontal overflow
						if ( rect.left < parentRect.left - 1 || rect.right > parentRect.right + 1 ) {
							observations.push( `Horizontal boundary overlap with parent (${ parent.tagName.toLowerCase() }). Note: Overlap can be intentional for full-width designs, alignwide features, or custom absolute offsets.` );
						}
						// Check for vertical overflow
						if ( rect.top < parentRect.top - 1 || rect.bottom > parentRect.bottom + 1 ) {
							observations.push( `Vertical boundary overlap with parent (${ parent.tagName.toLowerCase() }). Note: Overlap can be intentional for stacked designs, custom overflow scrollbars, or absolute positioning.` );
						}
					}

					// 2. Sibling Overlap Check
					if ( prev && prevRect ) {
						const isOverlappingPrev = ! ( rect.right <= prevRect.left || 
						                              rect.left >= prevRect.right || 
						                              rect.bottom <= prevRect.top || 
						                              rect.top >= prevRect.bottom );
						if ( isOverlappingPrev ) {
							observations.push( `Overlap observed with preceding sibling (${ prev.tagName.toLowerCase() }${ prev.className ? '.' + Array.from( prev.classList ).join( '.' ) : '' }). Note: Overlap can be intentional for elements utilizing negative margins, absolute positioning, or overlapping grid cells.` );
						}
					}
					if ( next && nextRect ) {
						const isOverlappingNext = ! ( rect.right <= nextRect.left || 
						                              rect.left >= nextRect.right || 
						                              rect.bottom <= nextRect.top || 
						                              rect.top >= nextRect.bottom );
						if ( isOverlappingNext ) {
							observations.push( `Overlap observed with succeeding sibling (${ next.tagName.toLowerCase() }${ next.className ? '.' + Array.from( next.classList ).join( '.' ) : '' }). Note: Overlap can be intentional for elements utilizing negative margins, absolute positioning, or overlapping grid cells.` );
						}
					}

					return {
						tagName: el.tagName.toLowerCase(),
						id: el.id,
						classList: Array.from( el.classList ),
						rect: {
							width: rect.width,
							height: rect.height,
							top: rect.top,
							left: rect.left,
							bottom: rect.bottom,
							right: rect.right
						},
						layoutProperties: {
							display: style.display,
							position: style.position,
							float: style.float,
							zIndex: style.zIndex,
							opacity: style.opacity,
							visibility: style.visibility,
							pointerEvents: style.pointerEvents,
							boxSizing: style.boxSizing
						},
						spacing: {
							margin: style.margin,
							padding: style.padding,
							gap: style.gap
						},
						siblingProximity: {
							distanceToPrevSibling: prevRect ? ( rect.top - prevRect.bottom ) : null,
							distanceToNextSibling: nextRect ? ( nextRect.top - rect.bottom ) : null
						},
						layoutObservations: observations
					};
				} );

				// Handle screenshot only if explicitly requested (Token efficiency rule!)
				if ( screenshot ) {
					const screenshotDir = path.resolve( rootDir, 'artifacts/inspect' );
					if ( ! fs.existsSync( screenshotDir ) ) {
						fs.mkdirSync( screenshotDir, { recursive: true } );
					}
					const sanitizedSelector = sel.replace( /[^a-z0-9]/gi, '_' ).toLowerCase();
					const screenshotPath = path.join( screenshotDir, `inspect_${ sanitizedSelector }_${ vpName }.png` );
					
					await element.screenshot( { path: screenshotPath } );
					layoutData.screenshotPath = screenshotPath;
				}

				results[ vpName ][ sel ] = layoutData;
			}
		}

		// Structure output format to maximize backward compatibility
		if ( ! explicitlyPassedViewports && selectors.length === 1 ) {
			// Single selector, single default viewport (desktop) -> return direct element data
			console.log( JSON.stringify( results[ 'desktop' ][ selectors[ 0 ] ], null, 2 ) );
		} else if ( ! explicitlyPassedViewports ) {
			// Multiple selectors, single default viewport (desktop) -> return dict keyed by selector
			const singleVpResults = {};
			for ( const sel of selectors ) {
				singleVpResults[ sel ] = results[ 'desktop' ][ sel ];
			}
			console.log( JSON.stringify( singleVpResults, null, 2 ) );
		} else if ( selectors.length === 1 ) {
			// Single selector, multiple viewports -> return dict keyed by viewport
			const singleSelResults = {};
			for ( const vp of viewports ) {
				singleSelResults[ vp ] = results[ vp ][ selectors[ 0 ] ];
			}
			console.log( JSON.stringify( singleSelResults, null, 2 ) );
		} else {
			// Multiple selectors, multiple viewports -> return nested dict
			console.log( JSON.stringify( results, null, 2 ) );
		}
	} catch ( err ) {
		console.error( JSON.stringify( {
			error: `Navigation / Interaction failed: ${ err.message }`,
			tip: 'Make sure your local development server is running (e.g. run "npm run start" or "npm run dev")'
		} ) );
	} finally {
		await browser.close();
	}
}

main();
