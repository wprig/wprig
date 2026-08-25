# WP Rig CSS Architecture Audit (Track C5)

Status: **audited 2026-08-24** (3.5 Wave 1, Track C5). Every module below maps to a
**droppable scenario** so a theme can shed CSS it does not need. Block-level CSS is
consolidated in `_blocks.css` / `_blocks-based.css`; classic template partials stay
separate; editor/admin CSS stays isolated.

## Module inventory (`assets/css/src/`)

| Module | Role | Droppable scenario | Paradigm gate |
| --- | --- | --- | --- |
| `_custom-properties.css` | Design tokens (generated from `config/tokens.json`) | never (core) | all |
| `_custom-media.css` | `@custom-media` aliases (generated from `settings.viewport`) | never (core) | all |
| `_reset.css` | Baseline reset | never (core) | all |
| `_typography.css` | Fonts / type scale | never (core) | all |
| `_elements.css` | Base element styles | never (core) | all |
| `_utility.css` | Utility classes | never (core) | all |
| `_links.css` | Link/focus affordances | never (core) | all |
| `_accessibility.css` | SR-text + a11y affordances | never (core) | all |
| `_header.css` | Classic header + **block-nav layout integration** (`nav div.wp-block-navigation__responsive-dialog`, `.site-header > .wp-block-group`) | classic themes | all (block-nav lines are dead-but-harmless in classic) |
| `_navigation.css` | Classic menu system + **Navigation-block submenu integration** (`.wp-block-navigation__*` icons, containers, anchor positioning) | classic-only themes drop the `.wp-block-navigation` rules (still interleaved with shared submenu rules — see Follow-ups) | all |
| `_footer.css` | Footer | classic themes | all |
| `_forms.css` | Forms + buttons | classic themes | all |
| `_media.css` | Captions + legacy gallery | classic themes | all |
| `_blocks.css` | **All block-level CSS** (quote, cover, latest-posts, gallery grid, custom block styles, `has-*` color/font utilities, block-image alignment, Search-block button) — imported by `content.css` + `editor-styles.css` | **no-Gutenberg themes** (see Follow-ups for config gating) | all (ships via content.min.css today) |
| `_blocks-based.css` | **FSE-only core block CSS** (Theme Parts, Navigation block baseline, Query Loop) | classic themes | universal / block-based only (`dev.styles.preloadBlockBased` + `isFeatureEnabled('block-based')`) |
| `global.css` | Core entry (imports reset/typography/elements/utility/links/a11y) | never (core) | all |
| `content.css` | Post/page content (alignments shared classic+blocks, content nav) | — | all |
| `front-page.css` | Front-page template grid + **block-image override** (ordering-sensitive, stays in module) | — | all |
| `sidebar.css` / `widgets.css` | Widget areas | classic themes | classic / universal (gated by `Sidebars::is_active()`) |
| `comments.css` | Comments | classic themes | all |
| `layout.css` / `header-navigation.critical.css` | Critical/above-the-fold bundles | — | all |
| `editor/editor-styles.css` | **Editor canvas** (imports `_blocks.css`, media, elements) | — | all (editor-only enqueue) |
| `admin/theme-settings.css` | **Admin settings page** | — | admin-only enqueue |

## Droppable scenarios

- **No-Gutenberg classic theme** (`themeType: classic` + no blocks): drops `_blocks-based.css`
  (already gated). `_blocks.css` still ships inside `content.min.css` today — config gating is
  the tracked follow-up below. The `.wp-block-navigation` rules in `_navigation.css`/`_header.css`
  are dead-but-harmless for classic themes.
- **Classic theme** (no FSE): drops `_blocks-based.css` (gated). Universal keeps it.
- **Universal / block-based theme**: keeps block modules; may drop classic template partials
  (header/nav/sidebar/widgets/comments) — the paradigm gating in `inc/Styles` +
  `Sidebars::is_active()` already handles sidebar/widgets.

## Block-selector audit (grep check)

Target: no block selectors outside `_blocks*.css`. **Result after C5 cleanup:**

| File | Block refs | Disposition |
| --- | --- | --- |
| `_blocks.css` | all block styles consolidated | ✅ home |
| `_blocks-based.css` | FSE-only | ✅ home (gated) |
| `content.css` | **0** | ✅ `.has-*` color/font utilities moved to `_blocks.css` (26 rules) |
| `_media.css` | **0** | ✅ `.wp-block-image` alignment moved to `_blocks.css` |
| `_forms.css` | **0** | ✅ `.wp-block-search__button` moved to `_blocks.css` |
| `editor/editor-styles.css` | 10 | ✅ isolated editor module (correctly targets blocks) |
| `_navigation.css` | 24 | ⚠️ **documented coupling** — Navigation-block submenu icons/containers/anchor positioning, interleaved with the classic submenu system's shared rule groups. Splitting into `_blocks-based.css` is the tracked follow-up. |
| `_header.css` | 2 | ⚠️ **documented coupling** — header layout for block-nav (`nav div.wp-block-navigation__responsive-dialog`, `.site-header > .wp-block-group`). |
| `front-page.css` | 2 | ⚠️ **documented coupling** — `.wp-block-image` alignment overrides inside the front-page grid; ordering-sensitive (must follow `_media` in the cascade), kept in module. |

The `.alignleft/.alignright/.alignwide/.alignfull` classes in `content.css` are **shared
classic+block alignment utilities**, not block-only — correctly outside `_blocks.css`.

## Follow-ups (deferred, tracked)

1. **Config-gate `_blocks.css`** so a no-Gutenberg classic theme truly drops block CSS:
   make the `@import "_blocks.css"` in `content.css`/`editor-styles.css` conditional on
   `enableBlocks` (or move block CSS to a gated preload like `_blocks-based.css`). Needs a
   small `build-css.js` extension for config-conditional imports.
2. **Split `.wp-block-navigation` submenu integration** out of `_navigation.css` (24 refs)
   into `_blocks-based.css` so classic themes drop it. Deferred: the rules share selector
   groups with the classic submenu system; split after the anchor-positioning refactor
   stabilizes (verify with the nav e2e suite).
3. **C4 (auto-sync playbook breakpoints from `settings.viewport`)** remains backlogged.
