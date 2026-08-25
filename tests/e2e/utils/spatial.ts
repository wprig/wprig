import type { Page, Locator } from '@playwright/test';

/**
 * Spatial & Visual Regression helpers — Track D Part A.
 *
 * Deterministic geometric layout checks built on Playwright `boundingBox()`.
 * These assertions are environment-independent: they reason about geometry
 * (overlap / bounds / containment) instead of pixels, so they are immune to
 * font, OS, and antialiasing variance. See `docs/testing.md` for the playbook.
 */

export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface BoxedElement {
	label: string;
	rect: Rect;
}

export interface Viewport {
	width: number;
	height: number;
}

export interface OverflowMetrics {
	documentScrollWidth: number;
	bodyScrollWidth: number;
	viewportWidth: number;
}

/** Default geometric tolerance (px) applied to every assertion. */
export const DEFAULT_TOLERANCE = 2;

/**
 * A structural layout region (header / content / sidebar / footer / …).
 * `selectors` are tried in order; the first selector that resolves to a
 * visible element wins. Selector lists keep the checks paradigm-agnostic so
 * the same suite serves classic, universal, and block-based themes.
 */
export interface LayoutRegion {
	name: string;
	selectors: string[];
}

/**
 * Are two axis-aligned rectangles overlapping beyond `tolerance` on both axes?
 * A sub-pixel / hairline intersection (borders, shadows) is not a collision.
 */
export function rectsOverlap( a: Rect, b: Rect, tolerance = DEFAULT_TOLERANCE ): boolean {
	const overlapX = Math.min( a.x + a.width, b.x + b.width ) - Math.max( a.x, b.x );
	const overlapY = Math.min( a.y + a.height, b.y + b.height ) - Math.max( a.y, b.y );
	return overlapX > tolerance && overlapY > tolerance;
}

/** Pairwise overlap report for a set of boxed elements. */
export function findOverlappingRects(
	boxes: BoxedElement[],
	tolerance = DEFAULT_TOLERANCE
): Array<[ BoxedElement, BoxedElement ]> {
	const overlaps: Array<[ BoxedElement, BoxedElement ]> = [];
	for ( let i = 0; i < boxes.length; i++ ) {
		for ( let j = i + 1; j < boxes.length; j++ ) {
			if ( rectsOverlap( boxes[ i ].rect, boxes[ j ].rect, tolerance ) ) {
				overlaps.push( [ boxes[ i ], boxes[ j ] ] );
			}
		}
	}
	return overlaps;
}

/** Is `rect` fully inside the viewport (with tolerance on every edge)? */
export function isWithinViewport(
	rect: Rect,
	viewport: Viewport,
	tolerance = DEFAULT_TOLERANCE
): boolean {
	return (
		rect.x >= -tolerance &&
		rect.y >= -tolerance &&
		rect.x + rect.width <= viewport.width + tolerance &&
		rect.y + rect.height <= viewport.height + tolerance
	);
}

/**
 * Is `rect` horizontally contained within the viewport (left edge on-screen,
 * right edge not overflowing)? Vertical extent is intentionally ignored — a
 * content container taller than the viewport scrolls normally.
 */
export function isHorizontallyWithinViewport(
	rect: Rect,
	viewport: Viewport,
	tolerance = DEFAULT_TOLERANCE
): boolean {
	return (
		rect.x >= -tolerance &&
		rect.x + rect.width <= viewport.width + tolerance
	);
}

/** Is `inner` contained within `outer` (with tolerance)? */
export function isContainedWithin(
	inner: Rect,
	outer: Rect,
	tolerance = DEFAULT_TOLERANCE
): boolean {
	return (
		inner.x >= outer.x - tolerance &&
		inner.y >= outer.y - tolerance &&
		inner.x + inner.width <= outer.x + outer.width + tolerance &&
		inner.y + inner.height <= outer.y + outer.height + tolerance
	);
}

/** Human-readable rect summary for assertion messages. */
export function describeRect( rect: Rect ): string {
	return `[x:${ round( rect.x ) }, y:${ round( rect.y ) }, w:${ round( rect.width ) }, h:${ round( rect.height ) }]`;
}

function round( value: number, digits = 1 ): number {
	const factor = 10 ** digits;
	return Math.round( value * factor ) / factor;
}

/**
 * Collect bounding boxes for every visible, non-zero-size match of the given
 * locators. Elements that are hidden, display:none, or occupy zero area are
 * skipped so they never pollute geometry assertions.
 */
export async function collectBoxes(
	items: Array<{ label: string; locator: Locator }>
): Promise<BoxedElement[]> {
	const boxes: BoxedElement[] = [];
	for ( const { label, locator } of items ) {
		const count = await locator.count();
		for ( let i = 0; i < count; i++ ) {
			const candidate = locator.nth( i );
			if ( ! ( await candidate.isVisible() ) ) {
				continue;
			}
			const rect = await candidate.boundingBox();
			if ( rect && rect.width > 0 && rect.height > 0 ) {
				boxes.push( {
					label: count > 1 ? `${ label } [${ i }]` : label,
					rect,
				} );
			}
		}
	}
	return boxes;
}

/**
 * Read the horizontal overflow state of the document. An overflowing element
 * (e.g. an unconstrained image, wide table, or long unbroken token) pushes
 * `scrollWidth` beyond the viewport width and causes a horizontal scrollbar.
 */
export async function readOverflowMetrics( page: Page ): Promise<OverflowMetrics> {
	return page.evaluate( () => {
		const docEl = document.documentElement;
		return {
			documentScrollWidth: docEl.scrollWidth,
			bodyScrollWidth: document.body.scrollWidth,
			viewportWidth: docEl.clientWidth,
		};
	} );
}

/**
 * Assert the page does not scroll horizontally: neither the document nor the
 * body may exceed the viewport width beyond `tolerance`.
 */
export function assertNoHorizontalOverflow(
	metrics: OverflowMetrics,
	tolerance = DEFAULT_TOLERANCE
): void {
	const offenders: string[] = [];
	if ( metrics.documentScrollWidth > metrics.viewportWidth + tolerance ) {
		offenders.push(
			`documentElement.scrollWidth ${ metrics.documentScrollWidth }px > viewport ${ metrics.viewportWidth }px (+${ tolerance }px)`
		);
	}
	if ( metrics.bodyScrollWidth > metrics.viewportWidth + tolerance ) {
		offenders.push(
			`body.scrollWidth ${ metrics.bodyScrollWidth }px > viewport ${ metrics.viewportWidth }px (+${ tolerance }px)`
		);
	}
	if ( offenders.length > 0 ) {
		throw new Error( `Horizontal overflow detected:\n- ${ offenders.join( '\n- ' ) }` );
	}
}

/**
 * Resolve a list of layout regions against the page. Each region is resolved
 * with its selector list in order; the first selector with a visible match
 * wins. Regions that resolve to nothing are omitted (paradigm-agnostic).
 */
export async function resolveRegions(
	page: Page,
	regions: LayoutRegion[]
): Promise<BoxedElement[]> {
	const boxes: BoxedElement[] = [];
	for ( const region of regions ) {
		for ( const selector of region.selectors ) {
			const locator = page.locator( selector ).first();
			if ( ! ( await locator.isVisible() ) ) {
				continue;
			}
			const rect = await locator.boundingBox();
			if ( rect && rect.width > 0 && rect.height > 0 ) {
				boxes.push( { label: region.name, rect } );
			}
			break;
		}
	}
	return boxes;
}

/**
 * Assert that the resolved structural regions do not overlap one another.
 * This catches real layout collisions (a fixed header covering content, a
 * sidebar colliding with the main column, a footer riding up over the post).
 */
export async function assertRegionsDoNotOverlap(
	page: Page,
	regions: LayoutRegion[],
	tolerance = DEFAULT_TOLERANCE
): Promise<void> {
	const boxes = await resolveRegions( page, regions );
	const overlaps = findOverlappingRects( boxes, tolerance );
	if ( overlaps.length === 0 ) {
		return;
	}
	const details = overlaps
		.map(
			( [ a, b ] ) =>
				`${ a.label } ${ describeRect( a.rect ) } × ${ b.label } ${ describeRect( b.rect ) }`
		)
		.join( '\n- ' );
	throw new Error(
		`Layout regions overlap (tolerance ${ tolerance }px):\n- ${ details }\nResolved regions: ${ boxes
			.map( ( b ) => b.label )
			.join( ', ' ) || '(none)' }`
	);
}

/**
 * Assert that the visible, non-nested block-level children of a container do
 * not overlap. Applies to direct children of `.entry-content` / `.site-content`
 * where adjacent blocks must stack cleanly without colliding.
 */
export async function assertSiblingsDoNotOverlap(
	container: Locator,
	tolerance = DEFAULT_TOLERANCE
): Promise<void> {
	const children = container.locator( ':scope > *' );
	const boxes = await collectBoxes( [ { label: container.toString(), locator: children } ] );
	const overlaps = findOverlappingRects( boxes, tolerance );
	if ( overlaps.length === 0 ) {
		return;
	}
	const details = overlaps
		.map(
			( [ a, b ] ) =>
				`${ a.label } ${ describeRect( a.rect ) } × ${ b.label } ${ describeRect( b.rect ) }`
		)
		.join( '\n- ' );
	throw new Error(
		`Sibling children of ${ container.toString() } overlap (tolerance ${ tolerance }px):\n- ${ details }`
	);
}
