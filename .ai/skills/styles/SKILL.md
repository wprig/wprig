---
description: Guide to managing CSS styles, partials, and builds in WP Rig.
globs: assets/css/src/**/*.css, build-css.js
---

# WP Rig Styles & CSS

This guide describes how to work with CSS in WP Rig.

## Configuration & Features

Before writing or modifying CSS, you **MUST** reference the `config/config.json`.

*   **CSS Preloading:** Check `dev.styles.preload` for files automatically injected into every compiled CSS file (e.g., `_custom-media.css`). Avoid redundant `@import` statements for these files.

## CSS Structure

Source files are in `assets/css/src/` and processed by `build-css.js`.
All CSS files are built into `assets/css/` if they are not prefixed with a `_`.


## Common Style Tasks

### Change the header styles

1. Edit `assets/css/src/_header.css`
2. Run `npm run dev` to rebuild and watch
3. Header styles are imported via `global.css`

### Add a new CSS partial

1. Create `assets/css/src/_yourfile.css`
2. Import it in the relevant css file (ex. `assets/css/src/global.css`) with `@import "_yourfile.css";`
3. Run `npm run dev` to rebuild if dev server is not already running

## Visual Verification (Ralph Loop)

For visual changes, use Playwright to ensure regressions are avoided:

1.  **Baseline**: Run `npm run test:e2e:screenshot -- SCREENSHOT_NAME="before-change.png"` before editing styles.
2.  **Edit**: Apply your CSS changes.
3.  **Verify**: Run `npm run test:e2e:screenshot -- SCREENSHOT_NAME="after-change.png"` and compare the results in `tests/e2e/specs/screenshot.spec.ts-snapshots/`.
4.  **Component Focus**: Use `SCREENSHOT_SELECTOR` to capture only the element you're styling (e.g., `.site-header`).

## Methodical Implementation Workflow

To manage the cognitive overhead of WP Rig's distributed CSS architecture, follow this step-by-step approach:

1.  **Drafting**: Create a single new CSS file in `assets/css/src/` (e.g., `assets/css/src/_temp-feature.css`).
2.  **Inclusion**: Temporarily `@import` this file at the end of `global.css` (or the relevant main entry point).
3.  **Iteration**: Implement all styles for the feature in this one file.
4.  **Verification**: Use the **Visual Verification** process above to confirm the styles work as expected.
5.  **Refactoring**: Once final, distribute the styles from the temporary file into the appropriate existing partials (e.g., `_header.css`, `_navigation.css`, etc.) or create a permanent new partial if justified.
6.  **Cleanup**: Delete the temporary file and remove its `@import` statement.

## PostCSS & Custom Media Queries
WP Rig uses **PostCSS**, not Sass. We use CSS Custom Properties (`var(--variable)`) and Custom Media Queries (`@media (--query-name)`). **Never write hardcoded pixel media queries like `@media (min-width: 768px)`.**

Available Custom Media Queries (defined in `_custom-media.css`):
- `@media (--narrow-menu-query)`: max-width 37.5em
- `@media (--wide-menu-query)`: min-width 37.5em
- `@media (--medium-query)`: min-width 40em
- `@media (--content-query)`: min-width 48em
- `@media (--sidebar-query)`: min-width 60em
- `@media (--tablet-menu-query)`: max-width 55em
- `@media (--desktop-menu-query)`: min-width 55em

### ❌ Bad Example (Do NOT do this)
```css
/* Hardcoded pixels, nested too deep, high specificity, no CSS variables */
body .site-header .main-navigation ul li a {
    color: #c0392b;
}
@media (min-width: 768px) {
    .site-header { margin-top: 20px; }
}
```

### ✅ Good Example (DO this)
```css
/* Uses CSS variables, shallow nesting, custom media queries */
.site-header {
    margin-top: var(--spacing-base);

    @media (--medium-query) {
        margin-top: calc(var(--spacing-base) * 2);
    }
}

.main-navigation-link {
    color: var(--color-red);
}
```

## Conventions

- **CSS partials**: Source files in `assets/css/src/` should be prefixed with an underscore (e.g., `_header.css`) unless they are intended to be enqueued as standalone files (like `content.css`).
- **Conditional styles**: Use `inc/Styles/Component.php` and the `wp_rig_css_files` filter to load styles only on pages that need them. For blocks, leverage enqueue_block_style() to load styles for specific blocks.
- **CSS variables**: Use CSS variables for theme colors, spacing, and other design tokens. Define them in `assets/css/src/_custom-properties.css` and use them throughout the theme. For block-based or universal themes, these should be defined in theme.json.
- **Media queries**: Use custom media queries to manage our responsive breakpoints and always reference these instead of statically writing media query values. Define them in `assets/css/src/_custom-media.css`. Our CSS build process adds these media queries to all CSS files.
- **CSS nesting**: Use CSS nesting to organize styles and avoid deep selectors. Nesting should be used sparingly and only when necessary. Avoid nesting more than 3 levels deep.
- **CSS specificity**: Avoid using high specificity selectors. Use BEM (Block Element Modifier) naming convention to keep selectors short and readable. Use utility classes sparingly and only when necessary. NEVER use !important and instead leverage specificity to override styles.
- **CSS comments**: Use comments to explain complex styles or decisions. Keep comments concise and relevant. Avoid commenting on obvious code.
- **CSS formatting**: Use consistent indentation and spacing. Follow the CSS style guide provided by the project. Avoid unnecessary whitespace and trailing commas.
- **CSS linting**: Use a CSS linter to catch common mistakes and enforce best practices. Configure the linter to match the project's style guide and run it as part of the build process. WP Rig comes with stylelint configured.
- **CSS animations**: Use CSS animations to enhance user experience and create smooth transitions. Keep animations short and avoid using them on elements that are frequently interacted with. Override animations with @prefers-reduced-motion media query to disable animations for users who prefer reduced motion.
- **CSS performance**: Keep header, navigation, global styles and other styles likely to be needed above the fold separate from other styles to improve page load performance. 100% of the CSS should be loaded asynchronously.
- **Source-Only Edits**: **NEVER** edit `.min.css` or `.map` files directly. These are managed by the build pipeline. Only edit files in `assets/css/src/`. Editing minified files will cause your changes to be overwritten by the next build and can break theme functionality.
