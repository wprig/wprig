# Flawless Gutenberg FSE Template Engineering Skill

This skill provides a 100% reliable, repeatable, and verified workflow for engineering premium, standard-compliant static block templates and template parts in WordPress Full Site Editing (FSE). It leverages our custom, built-in **WP Rig Block Schema Linter (`npm run lint:blocks`)** to achieve error-free Gutenberg validation.

---

## ⚡ UNLOCKING THE LINTER POWER: WHEN & WHY TO USE IT

### 1. When MUST the Agent Use It?
Any AI Agent or Developer working in this repository **MUST** run the block linter under the following conditions:
*   **Before saving/injecting block markup:** Whenever creating or updating `.html` template files (in `templates/` or `parts/`).
*   **During Phase 3 Pre-Flight validation:** Run `npm run lint:blocks` alongside style and script compilers.
*   **When debugging database-override synchronization:** Whenever syncing local HTML file changes into the WordPress database via WP-CLI, REST APIs, or PHP runners.

### 2. Why MUST the Agent Use It?
Gutenberg is a strict, comment-based layout engine. If you violate a block's core schema (e.g., adding a custom class to a block that doesn't support it), WordPress will fail to parse it in the admin editor and throw a **Block Recovery Error** (breaking visual editing for users).
*   **Guarantees 100% Editability:** Passing the `lint:blocks` check ensures that the generated page layout remains fully visual, customizable, and drag-and-drop editable in the Gutenberg Site Editor.
*   **Pre-empts Block Failures:** Instead of loading the site and checking for recovery warnings manually, the linter pre-emptively catches schema violations offline in milliseconds.
*   **Validates Native Constraints:** It automatically catches specific constraints (like the `core/list-item` and `core/paragraph` `className: false` rules) by reading your active local Core block schemas.

---

## 🛠️ ENVIRONMENT PREREQUISITES & DATABASE WRITING BRIDGES

While block validation and linting run **100% locally and offline in Node.js** (requiring only standard Node.js and a standard WP directory hierarchy), **writing or syncing** these verified blocks to your live local database requires a bridge.

The agent or developer should verify their local stack and choose/activate the appropriate tool:

### 🟢 Option A: WordPress Studio CLI (Highly Recommended for Containers)
*   **Target Stack:** Local development environments running **WP Studio**.
*   **How it works:** Leverages the native container daemon integration. Running `studio wp eval-file <file>` executes raw PHP directly inside the SQLite/container context.
*   **Prerequisites:** Requires the `studio` CLI tool available globally on the host machine.
*   **Plugin Requirement:** **None.** No plugins need to be installed on your WordPress site.

### 🟢 Option B: Standard WP-CLI (Best for Native Local Stacks)
*   **Target Stack:** Native local stacks (MAMP, XAMPP, Homebrew PHP/MySQL, or standard Docker).
*   **How it works:** Uses your local terminal shell to run native `wp eval-file <file>` or `wp post update` commands directly.
*   **Prerequisites:** Requires `wp-cli` installed on the host computer and configured for the database.
*   **Plugin Requirement:** **None.** No plugins need to be installed on your WordPress site.

### 🟢 Option C: Custom REST API Plugin `ai-theme-content` (Best for Restricted Containers)
*   **Target Stack:** Environments like **Local by Flywheel** or headless remote staging sites where direct terminal shell or CLI container execution is locked/restricted.
*   **How it works:** The agent sends an HTTP POST request to the custom `ai-theme-content` endpoints. The plugin's REST API controller (`inc/Rest_API.php`) and Block Processor (`inc/Block_Processor.php`) handle block parsing, sanitization, and DB writes securely.
*   **Prerequisites:** Cloned or activated from `github.com/wprig/ai-theme-content` (a private repo).
*   **Plugin Requirement:** **Required.** Must be installed and activated inside your WordPress plugins panel.

---

## 📖 The Step-by-Step Block Engineering & Linting Workflow

### Step 1: Write Compliant FSE Block Markup
Always structure layouts using standard core blocks, placing layout classes in the `className` attribute:
```html
<!-- wp:group {"tagName":"footer","align":"full","className":"site-footer"} -->
<footer class="wp-block-group alignfull site-footer">
    <!-- Block Content -->
</footer>
<!-- /wp:group -->
```

### Step 2: Run the WP Rig Block Linter
Execute the native schema linter in the theme directory:
```bash
npm run lint:blocks
```

### Step 3: Analyze and Resolve Linter Warnings
*   **If you see `Block "core/paragraph" defines custom class "...", but custom classes are EXPLICITLY forbidden`:**
	*   ❌ **Invalid:** `<!-- wp:paragraph {"className":"my-class"} --><p class="my-class">Text</p><!-- /wp:paragraph -->`
	*   🟢 **Solution:** Wrap the paragraph block inside a styled Group container, or keep the paragraph classless and target it in CSS using parent layout selectors:
	    `<!-- wp:group {"className":"my-container-class"} -->`
	    `<div class="wp-block-group my-container-class"><!-- wp:paragraph --><p>Text</p><!-- /wp:paragraph --></div>`
	    `<!-- /wp:group -->`
*   **If you see `Block "core/list-item" defines custom class "...", but custom classes are EXPLICITLY forbidden`:**
	*   ❌ **Invalid:** `<!-- wp:list-item {"className":"my-class"} -->`
	*   🟢 **Solution:** Keep list-items classless, and style anchors inside them or style the parent `core/list` block using its `className` property.

### Step 4: Re-Run Until PASSED
Rerun `npm run lint:blocks` until the terminal outputs:
```text
=== Linter Execution Statistics ===
- Files Validated:  4
- Blocks Checked:   86
- Status:           🟢 PASSED
```

### Step 5: Sync to Site Editor Database
Once validated, sync the clean block code to the WordPress template parts database (for elements like footer ID `31`) using your chosen writing bridge (from Section 2 above).

---

### File Locations for This Skill:
- **Linter Task Engine:** `/scripts/tasks/validateBlocks.js`
- **CLI Commands Registry:** `/scripts/cli.js`
- **npm Trigger Scripts:** `package.json`
