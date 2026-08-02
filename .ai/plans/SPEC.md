# Spec: Fixing Stale and Inconsistently Renamed Gutenberg Block Assets in Production Bundles (Issue #943)

## 1. Problem Description

When running `npm run bundle`, the production theme can contain stale or inconsistently renamed Gutenberg block assets if theme-scoped blocks are enabled.

### Root Causes
1. **Stale Assets:** In `scripts/tasks/bundle.js`, the `prodPrep` task (which copies the theme files, including `assets/blocks/`, to the production folder) runs *before* the `buildBlocks()` task compiles block source files. Any changes made to block sources since the last manual build are not copied to the bundle, resulting in stale block assets.
2. **Inconsistent Renaming:** During production bundling, `prodStringReplace` replaces occurrences of the default theme slug (`wp-rig`) with the user's custom production slug (e.g. `waldruh`). However, this is only run on `.js`, `.css`, and `.php` files, and NOT on `block.json` files. This results in a mismatch:
   * CSS classes like `.wp-block-wp-rig-myblock` are renamed to `.wp-block-my-custom-theme-myblock`.
   * Block registration name like `wp-rig/myblock` is renamed in JS and PHP to `my-custom-theme/myblock`.
   * But `block.json` is not updated and retains `wp-rig/myblock`.
   * This breaks editor styles, registration, and layout rendering because of the mismatch.

---

## 2. Solution Strategy

### Change 1: Reorder Tasks in `scripts/tasks/bundle.js`
We will reorder the bundle task pipeline to execute `buildBlocks()` before running the `prodPrep` task.
* By building blocks first, the compiled block assets in `assets/blocks/` are fully up-to-date in the development directory.
* When `prodPrep` runs, it will copy the freshly built assets into the production theme folder.

### Change 2: Protect Block Identifiers & Classes in `scripts/lib/utils.js`
We will modify the `getReplacements` function so that when replacing the theme slug (`wp-rig`), it uses a specific regular expression that excludes block namespaces and WordPress block CSS classes.
* Specifically, the default theme slug `wp-rig` should be protected if:
  * It is preceded by `wp-block-` (e.g. `wp-block-wp-rig-myblock`), using a negative lookbehind `(?<!wp-block-)`.
  * It is followed by `/` (e.g. `wp-rig/myblock`), using a negative lookahead `(?!/)`.
* This ensures block identifiers and CSS selectors remain stable as `wp-rig` across the whole codebase, matching the un-replaced `block.json` files and preserving database compatibility.

---

## 3. Detailed Technical Changes

### File: `scripts/tasks/bundle.js`
Move `buildBlocks()` invocation to run before `prodPrep` is executed.
```javascript
export default async function runBundle( {
	phpcs = false,
	lint = false,
} = {} ) {
	// Build blocks first so the freshly compiled blocks can be copied
	await buildBlocks();

	// Prepare production
	await runTask( prodPrep, 'prodPrep' );
...
```

### File: `scripts/lib/utils.js`
Update `getReplacements` function to return a modified regex for the `slug` nameField.
```javascript
export function getReplacements( isProdFlag ) {
	const themeConfig = getThemeConfig( isProdFlag );
	return Object.keys( nameFieldDefaults ).map( ( nameField ) => {
		let searchValue;
		if ( nameField === 'slug' ) {
			searchValue = new RegExp(
				'(?<!wp-block-)' +
				escapeRegExp( String( nameFieldDefaults[ nameField ] ) ) +
				'(?!/)',
				'g'
			);
		} else {
			searchValue = new RegExp(
				escapeRegExp( String( nameFieldDefaults[ nameField ] ) ),
				'g'
			);
		}
		return {
			searchValue,
			replaceValue: themeConfig.theme[ nameField ],
		};
	} );
}
```

---

## 4. Verification & Testing Plan

### 1. Unit Tests
Add unit tests in `scripts/tests/utils.test.js` to:
* Verify that `getReplacements` correctly sets up the search pattern for `slug` (using the negative lookbehind and lookahead).
* Test the replacements logic against test strings representing standard code (which should be replaced) versus block identifiers/classes (which should remain intact).

### 2. E2E / CLI verification
Run the unit test suite:
`npm run test:scripts`

Run the linter checks to ensure correctness:
`npm run lint:js`
