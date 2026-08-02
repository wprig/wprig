# SPEC: Persistent Mobile Navigation for Development

## Problem
The mobile navigation menu in WP Rig (especially when using the Core Navigation block) automatically closes when the window loses focus or when DevTools are opened. This is caused by the WordPress Core Interactivity API's default behavior, which removes the necessary classes (`mobile-menu-open`, `nav--toggled-on`) and resets `aria-expanded` attributes.

## Proposed Solution
Introduce a "Lock" mechanism for the mobile navigation that prevents these classes and attributes from being removed. This will be opt-in via a modifier key (Alt/Option) when opening the menu, making it a perfect tool for developers without affecting end-users.

## Implementation Details

### 1. JavaScript (`assets/js/src/navigation.ts`)
- Add a module-level variable `isMenuLocked` to track the lock state.
- Update `toggleMenuToggleState` to detect if the `Alt` key is pressed during the click event.
- If `Alt` is pressed while opening the menu, set `isMenuLocked = true`.
- If the menu is closed normally, set `isMenuLocked = false`.
- Implement a `MutationObserver` that watches the `body` and `.menu-toggle` elements.
- If `isMenuLocked` is true and a script (like Core's Interactivity API) tries to remove the mobile menu classes or change `aria-expanded` to `false`, the observer will immediately re-apply them.

### 2. CSS (`assets/css/src/_navigation.css`)
- Add a visual indicator (e.g., a subtle border or a change in the toggle button color) when the menu is locked, so the developer knows why it's not closing.
- Ensure the `mobile-menu-open` class on the body is respected even if other scripts try to hide parts of the UI.

## Verification Plan
1. Open the mobile menu normally: it should behave as usual.
2. Open the mobile menu while holding the `Alt` (Option) key.
3. Open DevTools or click outside the menu: the menu should remain open.
4. Verify that classes `mobile-menu-open` and `nav--toggled-on` stay on the appropriate elements.
5. Click the toggle again to close the menu: it should close and reset the lock state.
