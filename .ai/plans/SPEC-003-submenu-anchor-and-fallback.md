# SPEC-003: Submenu Collision Prevention with CSS Anchor Positioning & TS Fallback

## 1. Problem Statement
In WP Rig, multi-level navigation submenus can overflow the right edge of the viewport on desktop and tablet screens, especially when the main navigation is positioned on the right side of the header. There is currently no collision detection or flipping mechanism in place to prevent submenu items from going offscreen.

## 2. Proposed Solution
We will implement a hybrid, highly performant collision prevention system:
1. **Modern CSS Anchor Positioning API**: The primary native approach. For modern supporting browsers (Chrome/Edge 125+, Safari 18+), submenus will anchor to their parent items and automatically flip to the opposite inline direction (`flip-inline`) when they overflow the viewport edge. This is entirely handled by the browser's rendering engine with zero JS, zero latency, and zero layout thrashing.
2. **TypeScript Intersection Observer Fallback**: For browsers that do not yet support CSS Anchor Positioning (e.g., Firefox, older Safari versions), we will initialize a highly optimized `IntersectionObserver` in `navigation.ts`. It will monitor submenu visibility and apply an `.open-left` CSS helper class when a menu item overflows the viewport boundaries.

---

## 3. Implementation Details

### 3.1 CSS Implementation (`assets/css/src/_navigation.css`)
We will add anchor declarations and fallback styling to our CSS.

#### Anchor Positioning Rules
```css
/* 1. Register Anchor Names on Parent Menu Items */
.nav--toggle-sub li.menu-item-has-children,
.nav--toggle-sub li.menu-item--has-toggle {
    anchor-name: --menu-item-anchor;
    position: relative;
}

/* 2. Style Submenus to use Anchor Positioning with Fallbacks where supported */
@supports (position-anchor: --menu-item-anchor) {
    .nav--toggle-sub ul ul {
        position: absolute;
        position-anchor: --menu-item-anchor;
        top: anchor(bottom);
        left: anchor(left);
        position-try-options: flip-block, flip-inline;
    }

    /* 3rd-level submenus (nested) */
    .nav--toggle-sub ul ul ul {
        position-anchor: --menu-item-anchor;
        top: anchor(top);
        left: anchor(right);
        position-try-options: flip-inline;
    }
}
```

#### JS Fallback Utility Classes
These classes will be toggled by the TypeScript observer on browsers that do not support Anchor Positioning.
```css
/* Fallback: Align standard submenus to the right of their parent, so they expand leftward */
.nav--toggle-sub ul ul.open-left {
    left: auto;
    right: 0;
}

/* Fallback: Align 3rd-level submenus to the left of their parent */
.nav--toggle-sub ul ul ul.open-left {
    left: auto;
    right: 100%;
}
```

---

### 3.2 TypeScript Implementation (`assets/js/src/navigation.ts`)
We will add a highly-efficient Intersection Observer in our navigation module.

#### Feature Detection & Initialization
We will only run the JS fallback in browsers that **lack** native CSS Anchor Positioning support:
```typescript
/**
 * Detects if the browser supports CSS Anchor Positioning.
 */
function supportsAnchorPositioning(): boolean {
	return (
		typeof CSS !== 'undefined' &&
		'supports' in CSS &&
		CSS.supports('position-anchor', '--foo')
	);
}
```

#### Submenu Observer Logic
```typescript
/**
 * Initializes an IntersectionObserver to detect when submenus overflow the viewport.
 * This acts as the JS fallback for browsers that do not support native CSS Anchor Positioning.
 */
function initSubmenuCollisionObserver(): void {
	// Skip JS initialization if native browser support is present
	if (supportsAnchorPositioning()) {
		return;
	}

	const submenus = document.querySelectorAll<HTMLElement>(
		'ul.sub-menu, ul.wp-block-navigation__submenu-container'
	);

	if (!submenus.length || !('IntersectionObserver' in window)) {
		return;
	}

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				const submenu = entry.target as HTMLElement;
				// Submenu is visible if its bounding width is non-zero
				const isVisible = entry.boundingClientRect.width > 0;

				if (isVisible) {
					const viewportWidth = document.documentElement.clientWidth;
					const overflowsRight = entry.boundingClientRect.right > viewportWidth;
					const overflowsLeft = entry.boundingClientRect.left < 0;

					if (overflowsRight) {
						submenu.classList.add('open-left');
					} else if (overflowsLeft) {
						// Keep it aligned left if it overflows left
						submenu.classList.remove('open-left');
					}
				} else {
					// Clean up the class when the menu is closed
					submenu.classList.remove('open-left');
				}
			});
		},
		{
			root: null, // Relative to viewport
			threshold: [0.99, 1.0], // Trigger when fully displayed / slightly clipped
		}
	);

	submenus.forEach((submenu) => observer.observe(submenu));
}
```

We will call `initSubmenuCollisionObserver()` at the end of the `initNavigation()` sequence:
```typescript
function initNavigation(): void {
	initNavToggleSubmenus();
	initNavToggleSmall();
	watchForWindowSizeChanges();
	initSubmenuCollisionObserver(); // Initialize our observer
}
```

---

## 4. Verification Plan

### 4.1 Automated Pre-Flight Checks
- Run `npm run ai:check` to ensure the new TypeScript code is clean, complies with type checking (via `tsc`), and passes all linting rules (ESLint & Stylelint).

### 4.2 Manual Verification Protocol
1. **Modern Browser Check (Chrome/Safari 18)**:
   - Ensure native anchor positioning works out of the box with zero active JS event intervention.
   - Hover/toggle nested menus and verify that they flip to open leftwards when near the right screen edge.
2. **Fallback Browser Check (Firefox or Simulated lack of support)**:
   - To simulate a fallback scenario, modify `supportsAnchorPositioning()` temporarily to return `false`.
   - Hover/toggle nested submenus on the right edge. Verify that the `.open-left` class is added correctly, shifting the menu leftwards inside the viewport.
   - Close the submenu and confirm that `.open-left` is removed.

---

## 5. Questions, Risks & Mitigations
- **Compatibility with Gutenberg blocks**:
  Gutenberg block navigation uses different CSS classes (`.wp-block-navigation__submenu-container` instead of `.sub-menu`). The query selector in both JS and CSS handles both standard WordPress navigation markup and block-editor-based theme navigation markup seamlessly.
- **Root/Z-Index Issues**:
  Sometimes, deeply nested submenus are clipped by parent containers with `overflow: hidden` (e.g., custom header layouts). *Mitigation*: While CSS Anchor Positioning generally works within the standard layout flow, if parent container boundaries clip it, we recommend using a container-independent styling layer. Since WP Rig's headers do not standardly have `overflow: hidden`, this risk is low.
