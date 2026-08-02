# WordPress 7.1 Editor Full Iframe Compatibility Tracking

- **Status:** Planned
- **Release Target:** WordPress 7.1
- **Reference Article:** [The Post Editor is Going Full Iframe: What Block Developers Need to Know](https://gutenbergtimes.com/the-post-editor-is-going-full-iframe-what-block-developers-need-to-know-before-wordpress-7-1/)

---

## Background & Context
With WordPress 7.1, the block editor canvas goes **full iframe** for all post/page editing sessions, regardless of the `apiVersion` declared in a block. Setting `"apiVersion": 3` is the official standard to signal iframe compatibility and avoid developer warnings. 

Because the editor runs inside an iframe separated from the top-level admin page, block styles and scripts must not make global assumptions about the DOM context or styles.

---

## WP Rig Audit & Current Compatibility

WP Rig's architecture is already exceptionally clean and highly compatible with the iframe editor model, but several updates are required to declare full compatibility and avoid future warnings.

### 1. Style & Selectors (Pass ✅)
*   **Editor Styles:** Global theme styles are enqueued using `add_editor_style()`, which WordPress automatically parses and adapts for the iframe editor environment.
*   **Block-specific Styles:** Custom blocks register styles via `"editorStyle": "file:./build/editor.css"` in `block.json`. WordPress correctly injects these inside the iframe.
*   **Admin Class Dependencies:** There are no hardcoded `.wp-admin` or `.editor-styles-wrapper` overrides in WP Rig source styles that would fail within the isolated iframe document boundary.

### 2. Global JS/DOM References (Pass ✅)
*   Source JS/TS files do *not* contain direct queries targeting global `window` or `document` variables, which would fail to find block elements residing inside the iframe canvas. All compiled occurrences are standard webpack/React globals injections.

### 3. API Version Declaration (Needs Update ⚠️)
*   Standard scaffolding scripts and existing demo blocks currently target `apiVersion: 2`.

---

## Required Action Items

### 1. Update Block Scaffolding Core (`scripts/tasks/blockNew.js`)
Update the default generator to specify `apiVersion: 3` when creating minimal `block.json` files:
```javascript
// In scripts/tasks/blockNew.js
const raw = {
    name: `${ options.namespace }/${ options.slug }`,
    apiVersion: 3, // Update from 2 to 3
    ...
};
```

### 2. Update Block Templates (`scripts/templates/block/`)
Ensure fallback code templates default to modern API v3 registration patterns:
*   Update **`scripts/templates/block/index.js`** and **`index.tsx`**:
    ```javascript
    registerBlockType( 'wprig/example', {
        apiVersion: 3, // Update from 2 to 3
        ...
    } );
    ```

### 3. Promote Existing Block Demos
Update the metadata (`block.json`) and JS entry points (`index.js`) for the following blocks to declare `apiVersion: 3`:
*   `assets/blocks/hero/`
*   `assets/blocks/icon/`
*   `assets/blocks/test-block/`

### 4. Developer Guidelines for Future Complex Blocks
For interactive block types enqueuing complex scripts, developer guidelines must recommend using the `@wordpress/compose` utility `useRefEffect` hook to safely target the iframe’s isolated DOM scope:
```javascript
import { useRefEffect } from '@wordpress/compose';

const ref = useRefEffect( ( element ) => {
    const ownerDocument = element.ownerDocument; // Safely targets the iframe document
    const ownerWindow = ownerDocument.defaultView; // Safely targets the iframe window
} );
```
