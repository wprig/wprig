# WordPress.org Theme Review Audit Checklist & Agentic Skill Guide

## Overview & Purpose

This document provides a comprehensive, structured checklist of all rules, checks, and criteria enforced by the official **WordPress.org Theme Review Team** (WPTT). It is designed to serve as an agentic skill definition and operational standard for **WP Rig**.

By equipping WP Rig and integrated AI development agents (e.g., Junie) with this reference, automated build tasks and linting routines can achieve near-100% parity with the official theme approval pipeline.

---

## 1. Automated Static Analysis & Standards (Linting)

These checks are performed via `PHP_CodeSniffer` (PHPCS), `ESLint`, and `Stylelint`. WP Rig runs these via `npm run build:phpcs`, `npm run lint:js`, and `npm run lint:css`.

### 1.1 PHP Coding Standards & Safety (WPCS + WPThemeReview)
* **PHP Notice / Warning / Error Zero-Tolerance:** Code must not generate any `E_NOTICE`, `E_WARNING`, `E_DEPRECATED`, or `E_PARSE` errors under `WP_DEBUG = true`.
* **Functions & Deprecations:** No deprecated WordPress functions or outdated PHP constructs (must support target PHP versions, typically PHP 7.4+ to 8.x).
* **Prefixing & Namespacing:**
	* All global functions, global variables, class names, interface names, trait names, action/filter hooks, image sizes, and script/style handles **must** be uniquely prefixed with the theme slug (or a standard short prefix derived from it).
	* Vendor libraries bundled with the theme must be namespaced to avoid collision with plugins.
* **Output Escaping (Mandatory):**
	* All dynamic data outputted in HTML must be escaped using appropriate functions: `esc_html()`, `esc_attr()`, `esc_url()`, `esc_js()`, `wp_kses()`, or `wp_kses_post()`.
	* Translations containing HTML must use `esc_html_e()`, `esc_html__()`, `esc_attr_e()`, or `esc_attr__()`.
* **Input Sanitization & Validation:**
	* All inputs from `$_GET`, `$_POST`, `$_REQUEST`, or `$_COOKIE` must be validated and sanitized before use (`sanitize_text_field()`, `absint()`, etc.).
	* Nonce verification (`check_admin_referer()`, `wp_verify_nonce()`) is strictly required for form submissions and state-changing actions.
* **Direct Database Queries:**
	* Direct `$wpdb` calls are discouraged; standard WP query functions (`WP_Query`, `get_posts()`) must be used.
	* If `$wpdb` is required, all queries must be prepared using `$wpdb->prepare()`. Direct string concatenation into SQL queries is prohibited.

### 1.2 Modern Frontend Standards (JavaScript & CSS)
* **WordPress JS Coding Standards:** JavaScript files must adhere to core ESLint rules (`@wordpress/eslint-plugin`).
* **WordPress CSS Coding Standards:** CSS/PostCSS/Sass files must pass `Stylelint` rules (`stylelint-config-wordpress`).
* **No Unminified Bundling Errors:** Source maps must be generated, and raw source files should remain readable or provided alongside production bundles.

---

## 2. Directory Policies & "Plugin Territory" (Strict Restrictions)

The WordPress.org Theme Directory strictly enforces the separation of concerns: **Themes control presentation; Plugins control functionality and persistent data.**

### 2.1 Prohibited Functionality (Must Be Moved to Plugins)
* **Custom Post Types & Custom Taxonomies:** Themes **must not** register custom post types or custom taxonomies via `register_post_type()` or `register_taxonomy()`.
* **Shortcodes:** Themes **must not** register user-facing shortcodes (`add_shortcode()`).
* **Custom Customizer / Admin UI Data Storage:**
	* Themes cannot create custom database tables or store non-theme data in the database.
	* Options saved in `wp_options` or Customizer options must be cleaned up or limited strictly to theme presentation options.
* **SEO & Analytics:**
	* No hardcoded meta tags for SEO (OpenGraph, meta descriptions, canonical URLs).
	* No embedded analytics, tracking pixels, or third-party monitoring scripts.
* **Social Sharing Functionality:** Dynamic social media sharing tools/metaboxes must not be bundled (only layout styling for plugins).

### 2.2 Security & Code Injection
* **No Obfuscated Code:** Use of `eval()`, `base64_decode()`, `gzuncompress()`, or encoded execution blocks is strictly forbidden.
* **No Arbitrary File Uploads:** Custom upload scripts outside the standard WordPress Media Library API are prohibited.
* **No Execution of Dynamic Remote Code:** Fetching dynamic PHP code from remote endpoints via `wp_remote_get()` and executing it (e.g., `eval()` or temporary file creation) is an automatic permanent ban.

---

## 3. Structural, Metadata & Licensing Requirements

### 3.1 `style.css` Header & Metadata
* **Required Header Tags:**
	* `Theme Name`: Unique and not infringing on existing trademarks.
	* `Theme URI`: Must link to a valid demo, documentation, or product page (cannot be a general affiliate link).
	* `Author` & `Author URI`: Accurate identity attribution.
	* `Description`: Comprehensive summary of the theme.
	* `Version`: Must follow Semantic Versioning (e.g., `1.0.0`).
	* `Requires at least`: Minimum WordPress version.
	* `Tested up to`: Latest major WordPress version.
	* `Requires PHP`: Minimum PHP version supported (e.g., `7.4`).
	* `License`: Must be GPLv2 or GPLv2-compatible (e.g., `GNU General Public License v2 or later`).
	* `License URI`: Official URL to the license text (e.g., `https://www.gnu.org/licenses/gpl-2.0.html`).
	* `Text Domain`: Must match the exact theme directory slug.
	* `Tags`: Must only use approved tags from the official WordPress Tag List.

### 3.2 Licensing & Bundled Resources
* **100% GPL Compatibility:** Every line of code, script, icon, font, image, and library bundled with the theme must be licensed under GPLv2 or a GPL-compatible license (e.g., MIT, CC0, Apache 2.0).
* **Asset Attribution (`readme.txt` or `README.md`):**
	* All bundled third-party assets (JavaScript libraries, CSS frameworks, fonts, stock photos) **must** be explicitly credited in `readme.txt`.
	* Each asset listing must include: Asset Name, Source URL, Author, License Name, and License URL.
* **No External Resources (CDNs):**
	* All stylesheets, scripts, and fonts **must be bundled locally**.
	* Dynamic loading of Google Fonts, FontAwesome, or JS libraries from external CDNs without explicit user privacy compliance / opt-in is prohibited due to GDPR regulations.

---

## 4. Theme Execution, Hooks & Core Integration

To support the diverse architectural landscapes of modern WordPress development, WP Rig separates its theme execution, hooks, and core integration checks into two primary branches (Classic/Hybrid vs. Block Themes), supplemented by universal performance standards.

### 4.1 Branch A: Classic & Hybrid Themes (PHP Template Architecture)
These requirements apply to themes structured with standard PHP templates (`index.php`, `header.php`, `footer.php`, `single.php`, etc.).

* **Mandatory Template Hooks:**
	* `wp_head()` must be present immediately before `</head>` in `header.php`.
	* `wp_footer()` must be present immediately before `</body>` in `footer.php`.
	* `body_class()` must be included in the HTML `<body>` tag (`<body <?php body_class(); ?>>`).
	* `post_class()` must be included in the main article wrapper (`<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>`).
* **Title Tag Support:**
	* Theme must declare support for core title tags in `functions.php`: `add_theme_support('title-tag')`. No hardcoded `<title>` tag in `header.php`.
* **Navigation & Menus:**
	* Must register at least one primary navigation menu location via `register_nav_menus()`.
	* Navigation menus must degrade gracefully when no menu is assigned.
* **Post Formats, Thumbnails & Widgets:**
	* If post thumbnails are used, support must be declared via `add_theme_support('post-thumbnails')`.
	* Widget areas (if used) must be properly registered with `register_sidebar()` and checked with `is_active_sidebar()`.
* **Pagination & Multipage Posts:**
	* Archive and post list templates must include functional pagination (`the_posts_pagination()`, numeric pagination, or `posts_nav_link()`).
	* Paginated posts (`<!--nextpage-->` tag) must be handled in singular templates via `wp_link_pages()`.
* **Comments Integration:**
	* Single posts and pages must support comments via `comments_template()`.
	* Nested/threaded comments script must be enqueued conditionally: `if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) { wp_enqueue_script( 'comment-reply' ); }`.

### 4.2 Branch B: Modern Block Themes & Full Site Editing (FSE Architecture)
These requirements apply to block themes relying on blocks, global styles, and HTML markup files instead of PHP templates.

* **`theme.json` Integration:**
	* Must use a single, valid `theme.json` configuration file in the theme root for design tokens (colors, typography, spacing, layouts).
	* This file replaces hundreds of lines of inline CSS and PHP registration hooks. It must be audited against the official WordPress JSON schema to ensure parsing compliance.
* **HTML Templates & Template Parts:**
	* Block themes do **not** use `header.php`, `footer.php`, or PHP templates.
	* They must utilize HTML files with block markup located in `templates/` and `parts/` directories (e.g., `templates/index.html`, `parts/header.html`).
	* WP Rig static analysis must validate and lint these HTML block templates, ensuring block markup structure is syntactically correct.
* **Block Patterns:**
	* Reusable block patterns (such as banners, grids, and CTA banners) must be registered in the `/patterns` directory or via PHP registration hooks.
	* All patterns must use valid block markup and utilize theme-configured blocks.
* **Global Styles Variations:**
	* Block themes can contain alternative style variations, saved as custom `.json` files inside a `styles/` folder.
	* Each style variation must be audited for schema and design token conformity.
* **Menus & Widgets Replacement:**
	* Block themes **must not** use classic `register_nav_menus()` or `register_sidebar()` functions.
	* Instead, they must rely on the core **Navigation Block** (stored as the custom post type `wp_navigation`) and block-based template parts. Classic navigation and widget interfaces are automatically suppressed.

### 4.3 Universal Performance & Asset Loading Architecture
Efficient resource delivery is highly weighted during WPTT reviews to safeguard Core Web Vitals (LCP, INP, CLS).

* **Mandatory Enqueueing:**
	* All stylesheets and scripts must be enqueued via `wp_enqueue_scripts`, `admin_enqueue_scripts`, or `enqueue_block_editor_assets` actions.
	* No hardcoded `<script>` or `<link rel="stylesheet">` tags in any template or HTML block files.
* **Block-Level CSS Enqueueing:**
	* Monolithic `style.css` loading is highly discouraged for block themes.
	* The audit must verify that the theme loads stylesheets conditionally based on the blocks rendered on the current page, leveraging `theme.json` styles or enqueuing block-specific stylesheets via `wp_enqueue_block_style()` or block configuration parameters.
* **Asynchronous / Deferred Script Delivery:**
	* Non-critical scripts should be enqueued with `defer` or `async` tags to prevent render-blocking.

---

## 5. Universal Accessibility ("Accessibility-Ready" Requirements)

This section details the adapted WCAG guidelines that must be met by **both Classic/Hybrid and Block Theme architectures** to achieve the official "accessibility-ready" WPTT quality tag.

### 5.1 Keyboard Navigation & Focus
* **Full Keyboard Operability:** All interactive elements (links, buttons, menu items, inputs) must be fully operable using only the keyboard (`Tab`, `Enter`, `Space`, and arrow keys).
* **Visible Focus Indicators:** Visual focus indicators (e.g., highly visible outlines) must be explicitly styled and clearly visible on all focusable elements when they receive keyboard focus. Never use CSS to strip outlines without providing a robust, visible custom focus outline alternative.
* **Accessible Dropdown Menus:** Submenus and dropdown menus **must not** rely solely on mouse hover (`:hover`) triggers. Dropdowns must expand on keyboard focus (`:focus` or `:focus-within`), via ARIA-compliant button triggers, or natively via core blocks.

### 5.2 Skip Links
* **Skip to Content Link:** Themes must include a functioning skip link at the absolute beginning of the document body.
* **Visual Behavior:** The skip link should be hidden visually by default but must become fully visible and readable when it receives keyboard focus.
* **Targeting:** The skip link must target the container element of the main content area (e.g., `<a href="#content" class="skip-link">Skip to content</a>` targeting `<main id="content">`).

### 5.3 Color Contrast & Visual Design
* **Text Contrast (WCAG AA):** Body text must meet a minimum contrast ratio of **4.5:1** against backgrounds. Large text (typically 18pt or 14pt bold and above) must meet a minimum ratio of **3:1**.
* **Link Distinction:** Links nested within paragraph blocks or body text must contrast with surrounding non-link text by at least a **3:1** ratio if they are not underlined.
* **Multi-Modal Communication:** Color must not be the *only* method used to convey information or prompt responses (e.g., do not rely solely on color to indicate form errors or input states; always use text labels, patterns, or icons as well).

### 5.4 Scalable Typography & Fluid Layouts
* **No Layout Breakage at 200%:** Text must be resizable up to 200% using browser zoom without breaking layout grids, clipping text, or forcing multi-directional (horizontal and vertical) scrolling.
* **Relative Sizing Units:** The use of relative units (`ems`, `rems`, percentages) is required for font sizes, line heights, paddings, and margins. Avoid using absolute `px` values for typography or container widths.

### 5.5 Proper HTML Semantics
* **Logical Heading Hierarchy:** Headings must maintain a strict, logical hierarchical structure (`<h1>` must be followed by `<h2>`, followed by `<h3>`). Jumping across levels (e.g., `<h1` directly to `<h4>`) or using heading tags purely for styling is prohibited.
* **Form Field Labels:** Every form input must have a properly associated, programmatically linked `<label>` tag using the `for` attribute, or be explicitly defined using `aria-label` or `aria-labelledby`.

---

## 6. Visual Rendering, Edge Cases & Manual QA Checklist

These checks verify layout stability under heavy or unusual content configurations (traditionally tested using the official **WordPress Theme Unit Test Data** XML file).

### 6.1 Text & Layout Edge Cases
* **Extremely Long Titles:** Titles with 50+ words or single long unbroken strings (e.g., `Supercalifragilisticexpialidocious...`) must not break the grid, overflow containers, or clip text awkwardly.
* **Hierarchy & Typography:** Proper hierarchy rendering for `<h1>` through `<h6>`, blockquotes, unordered/ordered lists, tables, and preformatted text (`<pre>`).
* **No Hardcoded Strings / Full i18n:** Every user-facing text string must be wrapped in translation functions (`__()`, `_e()`, `esc_html__()`, etc.) using the theme's matching text domain.

### 6.2 Media & Alignment Checks
* **Image Alignments:** Images with classes `.alignleft`, `.alignright`, `.aligncenter`, `.alignnone`, `.alignwide`, and `.alignfull` must render correctly on both desktop and mobile viewports.
* **Captions:** Captions (`.wp-caption`, `<figcaption>`) must wrap properly around images and stay within container boundaries.
* **Responsive Embeds:** Embedded videos (YouTube, Vimeo, iFrames) and responsive media must maintain aspect ratio and not overflow small screens.

### 6.3 Special Pages & States
* **Sticky Posts:** Sticky posts must have a distinct visual style or badge on archive pages.
* **404 Page:** Must provide a clear `404.php` template with a search bar and clear navigation options back to the home page.
* **Search Results Page:**
	* Must handle empty search results gracefully with an informative message.
	* Search form must utilize standard `get_search_form()`.
* **Empty State Handling:** Archives with no posts (e.g., empty categories or authors with zero posts) must render an empty state message without PHP errors.

---

## 7. Recommended WP Rig Implementation Plan

To enable an AI agent or automated developer workflow to execute this audit natively within WP Rig, the following tools, tasks, and configurations should be integrated into WP Rig:

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                                   WP RIG BUILD SYSTEM                                 │
├───────────────────────────────┬───────────────────────────────┬───────────────────────┤
│    Static PHP/JSON Analysis   │   JS / CSS Static Analysis    │  Theme Directory Gate │
├───────────────────────────────┼───────────────────────────────┼───────────────────────┤
│ • PHPCS                       │ • ESLint                      │ • Theme Check CLI     │
│ • WPCS (WordPress-Extra)      │ • Stylelint                   │ • WPTT Sniffer        │
│ • WPThemeReview Ruleset       │ • Jest Unit Testing           │ • Theme Unit Test Runner│
│ • PHPCompatibilityWP          │ • Axe-core Accessibility Tests│                       │
│ • theme.json Schema Linter    │                               │                       │
└───────────────────────────────┴───────────────────────────────┴───────────────────────┘
```

### 1. Extended NPM Scripts Suite (`package.json`)
Provide dedicated task entry points for the AI agent to execute individual or full-suite QA audits:
* `npm run audit:phpcs` — Runs PHPCS specifically targeting the `WPThemeReview` ruleset.
* `npm run audit:theme-json` — Lints and validates `theme.json` configuration file against the official WordPress JSON schema.
* `npm run audit:html-templates` — Analyzes and validates FSE HTML template and template part block markup.
* `npm run audit:accessibility` — Executes automated accessibility and contrast scans (e.g., Playwright + Axe-core tests).
* `npm run audit:theme-check` — Executes a headless Theme Check scan (via WP-CLI integration or node wrapper).
* `npm run audit:i18n` — Validates text domain consistency and checks for missing translation wrappers.
* `npm run audit:all` — Master task that runs PHPCS, ESLint, Stylelint, JSON/HTML audits, accessibility checks, i18n checks, and asset/license verification in sequence.

### 2. Standardized Configuration Files
* **`.phpcs.xml.dist`:** Updated to mandate `WPThemeReview` alongside `WordPress-Extra` and `PHPCompatibilityWP`.
* **`.eslintrc.json` & `.stylelintrc.json`:** Extended to match WordPress Gutenberg/Core standards out-of-the-box.
* **`theme-check-config.json`:** Custom configuration parameters for automated local Theme Check scans.

### 3. Agentic Skill Prompt / Rule Integration
Provide a structured JSON/Markdown schema file inside the repository (e.g., `.wprig/theme-review-skill.md`) that an AI agent (such as Junie) can load into context to systematically audit files, refactor non-compliant code, and auto-generate compliance reports before tagging releases.

---

## 8. Step-by-Step Theme Review Environment Setup & Playbook

To thoroughly mimic the official WordPress.org Theme Review Team's audit workflow and ensure your WP Rig theme passes inspection on the first submission, follow this operational playbook.

### 8.1 Transitioning PHPCS to the WPThemeReview Ruleset

The `WPThemeReview` standard is a PHP_CodeSniffer ruleset that combines WordPress core standards with the exact structural and programmatic requirements of the Theme Directory.

#### Step 1: Install the WPThemeReview Composer Package
Run the following command in the WP Rig root directory to add the standard to your dev dependencies:
```bash
composer require --dev wp-coding-standards/wp-theme-review
```
*Note: Because `dealerdirect/phpcodesniffer-composer-installer` is already configured in WP Rig's `composer.json`, it will automatically register the new standard's path with PHP_CodeSniffer.*

#### Step 2: Register the Standard Manually (If Auto-Register Fails)
If for any reason the installer does not register the path, configure it manually:
```bash
vendor/bin/phpcs --config-set installed_paths vendor/wp-coding-standards/wpcs,vendor/phpcompatibility/php-compatibility,vendor/wp-coding-standards/wp-theme-review
```

#### Step 3: Switch the Ruleset in `phpcs.xml.dist`
To make the `WPThemeReview` ruleset your default local standard, open `phpcs.xml.dist` and find the following lines:
```xml
	<rule ref="WordPress"/>
	<rule ref="WordPress-Core" />
	<rule ref="WordPress-Docs" />
	<rule ref="WordPress-Extra" />
```
Replace them with a reference to the `WPThemeReview` ruleset:
```xml
	<!-- Use the official WordPress.org Theme Review Coding Standards -->
	<rule ref="WPThemeReview"/>
```
*Note: The `WPThemeReview` standard internally includes and customizes elements of `WordPress-Core` and `WordPress-Extra` specifically tuned for theme structures, meaning you don't need to specify them individually.*

#### Step 4: Run the Theme Review Audit via CLI
To check the theme files using the newly configured ruleset:
```bash
vendor/bin/phpcs -s --parallel=4
```
Alternatively, run it on-demand without editing the default ruleset:
```bash
vendor/bin/phpcs -s --standard=WPThemeReview --extensions=php .
```
To streamline this for development, add a dedicated npm script in `package.json`:
```json
"audit:theme-review": "vendor/bin/phpcs -s --standard=WPThemeReview --extensions=php ."
```

---

### 8.2 Setting Up the Theme Sniffer Plugin

**Theme Sniffer** is a WordPress plugin that wraps PHP_CodeSniffer and the `WPThemeReview` ruleset into a friendly admin interface, allowing you to run audits directly within your local WordPress site.

#### Step 1: Install & Activate the Plugin
Install it via WP-CLI:
```bash
wp plugin install theme-sniffer --activate
```
*Alternatively, if you require the latest developer version with newer sniffs:*
1. Navigate to your local plugins directory: `wp-content/plugins`
2. Clone the repository: `git clone https://github.com/WordPress/theme-sniffer.git`
3. Enter the folder and install dependencies: `cd theme-sniffer && composer install && npm install && npm run build`
4. Activate the plugin via WP Admin or `wp plugin activate theme-sniffer`.

#### Step 2: Run a Scan in WP Admin
1. Go to **Tools > Theme Sniffer** in your WordPress dashboard.
2. Select **WP Rig** (or your active theme) from the theme dropdown.
3. Select **WPThemeReview** as the standard.
4. Check **Hide Warnings** if you only want to focus on blocker errors first.
5. Click **Go** to run the scan.
6. Fix any reported escaping, sanitization, or naming violations directly in your WP Rig source code (remembering to edit files only in `src/` or `inc/` templates, never in compiled build folders).

---

### 8.3 Installing the Theme Check Plugin (The Official Review Gate)

The **Theme Check** plugin is the exact tool used by the WordPress.org Theme Review team during the initial automated intake phase. It checks your theme files for basic directory compliance, required/prohibited tags, and metadata.

#### Step 1: Install & Activate Theme Check
```bash
wp plugin install theme-check --activate
```

#### Step 2: Run the Official Checklist
1. Navigate to **Appearance > Theme Check** in WP Admin.
2. Choose your WP Rig theme from the dropdown.
3. Click **Check it!**.
4. Review the results. Pay close attention to:
   - **WARNINGS** and **REQUIRED** items: These are absolute blockers for theme approval.
   - **INFO** items: These are recommendations or suggestions to follow.

---

### 8.4 Runtime Diagnostics & Performance Aids

Static analysis doesn't catch dynamic database issues or notices generated during execution. To mimic a thorough reviewer's runtime check, install the following:

#### Query Monitor
An essential debugging plugin that lists SQL queries, enqueued scripts, hook order, API calls, and PHP errors in real-time.
```bash
wp plugin install query-monitor --activate
```

#### Log Deprecated Notices
Logs the usage of deprecated files, functions, and function arguments, which is a major point of friction for theme reviews.
```bash
wp plugin install log-deprecated-notices --activate
```

---

### 8.5 Testing with the Official Theme Unit Test Data

The Theme Review Team does not just look at code; they manually import a special dataset and click through every single page template. You **must** verify your layout stability under these exact conditions.

#### Step 1: Get the Official Test Data XML
Download the official WordPress Theme Unit Test XML file from the GitHub repository:
* Source: [WordPress Theme Test Data](https://github.com/WordPress/theme-test-data)
* Direct XML Link: `https://raw.githubusercontent.com/WordPress/theme-test-data/master/theme-pattern-test-data.xml`

#### Step 2: Import the Data via WP-CLI
First, ensure you have the core importer installed:
```bash
wp plugin install wordpress-importer --activate
```
Next, download and import the XML file, automatically generating missing authors and downloading attachment assets:
```bash
curl -o theme-test-data.xml https://raw.githubusercontent.com/WordPress/theme-test-data/master/theme-pattern-test-data.xml
wp import theme-test-data.xml --authors=create --skip=attachment
```
*(If you want to download all test images, omit `--skip=attachment`—though skipping is faster if you just want to verify layout integrity).*

#### Step 3: Run the Visual QA Checklist
Review your WP Rig site on the frontend and ensure:
1. **Sticky Posts:** Are clearly styled, highlighted, or badged differently from standard posts.
2. **Comment Threading:** Multi-level nested comments render gracefully without overlapping layout boundaries.
3. **No-Title / Long-Title Posts:** Posts without titles still display a permalink; posts with extremely long titles (or single unbroken words) wrap correctly and do not break the container grid.
4. **Alignment Resiliency:** Ensure block alignment classes (`alignleft`, `alignright`, `aligncenter`, `alignnone`, `alignwide`, `alignfull`) display as intended.
5. **Pagination & Multi-Page Posts:** Check archive pages for proper pagination. Open a post containing the `<!--nextpage-->` tag and verify that the page navigation links are present and styled nicely.