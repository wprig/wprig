---
description: Modern CSS authoring for WP Rig — Lightning CSS, enforced specificity budget, generated custom media, native nesting.
globs: assets/css/src/**/*.css, build-css.js
---

# WP Rig Styles & CSS (Modern CSS Playbook)

This is the authoritative reference for authoring CSS in WP Rig. The rules here are
**enforced** by `npm run lint:css` (stylelint, part of `ai:check`) and compiled by
**Lightning CSS** (`build-css.js`). Write to the enforced budget — do not write CSS
that the linter then has to be told to ignore.

## Build engine

- WP Rig compiles CSS with **Lightning CSS**, not PostCSS and not Sass. It natively
  supports CSS nesting, custom media, custom properties, `@layer`, container queries,
  `:has()`, and logical properties — no preprocessor step.
- Source files live in `assets/css/src/`; every non-underscore file is compiled to
  `assets/css/*.min.css`. Underscore files (`_*.css`) are **partials** — imported by
  entry files, never built standalone.
- **Never edit `.min.css` / `.map` files.** They are build artifacts; edits are
  overwritten on the next build.

## The enforced budget (stylelint)

`npm run lint:css` fails on:

| Rule | Budget |
| --- | --- |
| `max-nesting-depth` | ≤ 3 levels (nested `@media` does not count) |
| `selector-max-specificity` | `(0,4,1)` — 0 IDs, ≤ 4 class-level (classes / pseudo-classes / attributes), ≤ 1 element |
| `declaration-no-important` | none (the `screen-reader-text` pattern is the only documented exception) |
| `custom-property-no-missing-var-function` | custom properties must be read via `var()` |
| `no-descending-specificity` | later rules must not re-target selectors a prior rule already matched at lower specificity |

The `(0,4,1)` cap is the **current calibration** (Track C1). The long-term target is
`(0,2,0)`; tighten selectors toward it whenever you touch them. `_navigation.css`
carries a documented file-level exemption for `no-descending-specificity`; do not add
more exceptions.

## Configuration first

Before writing or modifying CSS, reference `config/config.json`:

- **CSS preloading:** `dev.styles.preload` lists files auto-injected into every bundle
  (e.g., `_custom-media.css`). Don't `@import` them again.
- **Block-based gating:** `dev.styles.preloadBlockBased` (`_blocks-based.css`) is only
  injected for universal/block-based themes — never reference it from the classic core.

## Modern CSS techniques

### 1. Native nesting (`&`, nested `@media`)

Use nesting to keep related rules together and to **avoid building long descendant
chains by hand**. Nesting deeper than 3 levels is a lint error — flatten by hoisting
or by turning nested parents into compound selectors.

```css
.site-header {
	display: flex;

	@media (--wide-menu-query) {
		flex-direction: row;
	}

	&.nav--toggled-on {
		.menu-toggle {
			display: block;
		}
	}
}
```

### 2. Specificity control with `:is()` / `:where()`

These are the primary tools for staying inside the budget.

- `:where(...)` contributes **zero** specificity — ideal for wrapping long contextual
  ancestor chains you don't want to count against you.
- `:is(...)` takes the specificity of its **most specific** argument — good for
  grouping element variants while keeping some weight.

```css
/* Before — 5 classes + 1 element → (0,5,1) ✗ violates (0,4,1) */
.nav--toggle-small.nav--toggled-on .menu-toggle.icon svg.close { display: block; }

/* After — contextual chain zeroed → (0,2,1) ✓ */
:where(.nav--toggle-small.nav--toggled-on) .menu-toggle.icon svg.close { display: block; }
```

```css
/* :is() — group headings without repeating the selector */
:is(h1, h2, h3, .entry-title) .site-title { margin-block: 0.5em; }
```

When you wrap in `:where()`, confirm no *competing* rule with higher specificity now
outranks yours for the same element/property (source order then decides).

### 3. `@layer`

`@layer` lets you order whole stylesheets so later rules never need extra
specificity. Lightning CSS compiles it natively.

```css
@layer base, components, utilities;

@layer components {
	.card { padding-block: var(--spacing-base); }
}
```

WP Rig's full `@layer` architecture is still being introduced (Track C3, deferred) —
use `@layer` for local scoping when it genuinely reduces specificity battles, but do
not restructure existing partials into layers yet.

### 4. Custom properties

Define tokens once and read them via `var()`. Hardcoding a value that already exists
as a token is a lint-adjacent smell; reading a custom property **without** `var()` is
a lint error.

```css
.site-header {
	margin-top: var(--spacing-base);
	margin-top: clamp(var(--spacing-base), 2vw, var(--spacing-large));
}
```

Design tokens live in `config/tokens.json` and are propagated to
`_custom-properties.css` (classic) and `theme.json` (universal/block-based). Colors,
spacing, and fonts come from there — not from inline literals.

### 5. Custom media (generated from `settings.viewport`)

**Never write raw `px`/`em` media queries.** The named aliases are generated by the
build from `config/tokens.json` `breakpoints` → WP 7.1 `settings.viewport`
(mobile = 480px, tablet = 782px) — the **single source of truth** (G2). Their current
px values are in the generated `assets/css/src/_custom-media.css`; the editor and the
frontend share the same breakpoints, so what previews in the editor renders on the site.

| Alias | Range (derived) |
| --- | --- |
| `--narrow-menu-query` | `max-width: 480px` |
| `--wide-menu-query` | `min-width: 481px` |
| `--medium-query` | `min-width: 481px` |
| `--content-query` | `min-width: 783px` |
| `--sidebar-query` | `min-width: 783px` |
| `--tablet-menu-query` | `max-width: 782px` |
| `--desktop-menu-query` | `min-width: 783px` |

Use the aliases; never hardcode the values (they are derived and can change).

```css
/* Reference the named alias — never raw px */
@media (--sidebar-query) {
	.sidebar { display: block; }
}
```

### 6. Container queries

Scope styles to a container's size instead of the viewport. Lightning CSS compiles
`@container` natively.

```css
.card-grid {
	container-type: inline-size;
}

@container (min-width: 30rem) {
	.card { display: grid; grid-template-columns: 1fr 1fr; }
}
```

### 7. Logical properties

Use logical (`inline`/`block`) properties so layouts mirror automatically in RTL.
Lightning CSS + autoprefixer keep browser support sane.

```css
/* Before: physical */
.entry { margin-left: 2em; padding-top: 1em; }

/* After: logical */
.entry { margin-inline-start: 2em; padding-block-start: 1em; }
```

### 8. `:has()`

`:has()` styles an element based on its descendants — Lightning CSS compiles it
natively and WP Rig uses it for stateful layouts.

```css
.site-header:has(nav) { display: grid; }
.site-header:has(nav.nav--toggled-on) { z-index: 5; }
```

## The specificity budget — before / after

Staying under `(0,4,1)` is the default. Reach for `:where()` to zero *context*, keep
*meaningful* classes un-wrapped, and prefer classes over IDs (IDs alone bust the
budget).

| Before (violates) | After (passes) |
| --- | --- |
| `header#masthead:has(nav)` → `(1,1,1)` | `.site-header:has(nav)` → `(0,1,1)` |
| `#primary-menu .sub-menu` → `(1,1,0)` | `.primary-menu .sub-menu` → `(0,2,0)` |
| `.wp-block-gallery.columns-3 .blocks-gallery-item:last-child:nth-child(3n)` → `(0,5,0)` | `:where(.wp-block-gallery.columns-3) .blocks-gallery-item:last-child:nth-child(3n)` → `(0,4,0)` |
| `.nav--toggle-sub li.menu-item--toggled-on > button.dropdown-toggle .dropdown-symbol` → `(0,4,2)` | `:where(.nav--toggle-sub li.menu-item--toggled-on) > button.dropdown-toggle .dropdown-symbol` → `(0,3,1)` |

## Common style tasks

### Change the header styles

1. Edit `assets/css/src/_header.css`.
2. Run `npm run dev` to rebuild and watch (or `npm run build:css`).
3. Header styles are imported via `global.css`.

### Add a new CSS partial

1. Create `assets/css/src/_yourfile.css`.
2. `@import "_yourfile.css";` in the relevant entry (e.g., `global.css`).
3. Run `npm run dev` / `build:css`.

## Visual verification (Ralph Loop)

For visual changes, avoid regressions:

1. **Baseline**: `npm run test:e2e:screenshot -- SCREENSHOT_NAME="before-change.png"` before editing.
2. **Edit**: apply CSS changes.
3. **Verify**: run the same command with `after-change.png` and compare in
   `tests/e2e/specs/screenshot.spec.ts-snapshots/`.
4. **Component focus**: use `SCREENSHOT_SELECTOR` to capture only the styled element.

## The two-tier visual feedback loop (measurement-first)

Avoid full-page screenshots — they bloat prompts and slow iteration.

1. **Tier 1 — semantic measurement (cheap):** `npm run inspect -- --url "/page" --selector ".el1, .el2"` returns exact bounding boxes / computed styles. Batch viewports:
   `npm run inspect -- --selector ".site-header" --viewport "mobile, desktop"`.
   `layoutObservations` flags overflows/overlaps — verify these against intent before
   "fixing" (absolute positioning, negative margins, full-bleed blocks are often deliberate).
2. **Tier 2 — aesthetic verification (fallback):** screenshots only when layout
   properties can't express the issue: `npm run inspect -- --selector ".el" --screenshot`.
   Outputs land in `artifacts/inspect/`; don't paste raw image bytes into the prompt.

## Methodical implementation workflow

1. **Draft** a single new file `assets/css/src/_temp-feature.css`.
2. **Include** it via `@import` at the end of `global.css`.
3. **Iterate** on styles in that one file.
4. **Verify** with the visual loop above.
5. **Refactor** into the right partials (`_header.css`, `_navigation.css`, …) or a new
   permanent partial.
6. **Cleanup**: delete the temp file and its `@import`.

## Conventions

- **Partials**: `assets/css/src/_*.css` unless the file is a standalone entry
  (`content.css`, `sidebar.css`, `widgets.css`, `comments.css`, `front-page.css`,
  `editor/`, `admin/`).
- **Conditional styles**: use `inc/Styles/Component.php` + the `wp_rig_css_files`
  filter; `enqueue_block_style()` for block-scoped styles.
- **Design tokens**: from `config/tokens.json` → `_custom-properties.css` /
  `theme.json`. No inline color/spacing literals.
- **Media queries**: the named custom-media aliases only (see §5). No raw `px`/`em`.
- **Nesting**: use sparingly, ≤ 3 levels.
- **Specificity**: stay ≤ `(0,4,1)`; no IDs; `:where()` for context.
- **`!important`**: never (only the `screen-reader-text` exception).
- **Comments**: explain non-obvious decisions concisely.
- **Animations**: honor `@media (prefers-reduced-motion: reduce)`.
- **Performance**: keep above-the-fold styles (header/nav/global) critical-path;
  load the rest async.
- **Source-only edits**: never touch `.min.css` / `.map`.
