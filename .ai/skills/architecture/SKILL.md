---
description: Guide to WP Rig theme architecture, file structure, components, and coding conventions.
globs: inc/**/*.php, functions.php, config/*.json, *.php
---

# WP Rig Architecture & Conventions

This guide describes the core structure and conventions used in WP Rig.

## Quick Reference

| Feature | Primary File(s) |
|---------|-----------------|
| Theme initialization | `functions.php`, `inc/Theme.php` |
| Paradigm system | `config/paradigms.json`, `inc/Paradigm.php`, `scripts/lib/paradigm.js`, `inc/Paradigm_Component_Trait.php` |
| Component registry manifest | `inc/components-manifest.json` (written by `rig` tooling) |
| Navigation menu | `inc/Nav_Menus/Component.php`, `assets/css/src/_navigation.css`, `assets/js/src/navigation.ts` |
| Typography | `assets/css/src/_typography.css` |
| CSS variables | `assets/css/src/_custom-properties.css` (tokens-generated) |
| Theme tokens → theme.json / CSS | `config/tokens.json`, `scripts/tasks/tokens.js` |
| Accessibility | `inc/Accessibility/Component.php`, `assets/css/src/_accessibility.css` |
| Sidebar/widgets | `inc/Sidebars/Component.php`, `assets/css/src/sidebar.css`, `assets/css/src/widgets.css` |
| Comments | `inc/Comments/Component.php`, `assets/css/src/comments.css` |
| Editor styles | `inc/Editor/Component.php`, `assets/css/src/editor/editor-styles.css` |
| Custom logo | `inc/Custom_Logo/Component.php` |
| Custom header | `inc/Custom_Header/Component.php` |
| Fonts | `inc/Fonts/Component.php` |
| Block patterns | `inc/Block_Patterns/Component.php` (block-based) |
| Blocks | `inc/Blocks/Component.php`, `assets/blocks/` |
| Build configuration | `config/config.default.json`, `config/config.json`, `config/config.local.json` |

## Configuration & Identity

Before making architectural changes, you **MUST** reference the `config/config.json` and check the [Component Registry skill](../component-registry/SKILL.md).

*   **Theme Identity:** Use `theme.PHPNamespace` and `theme.slug` for components and translations.
*   **Theme Type / Paradigm:** `theme.themeType` is one of `classic` | `universal` | `block-based` (validated against `config/paradigms.json`). Block-capable types (`universal`/`block-based`) enable block compilation (`enableBlocks`) and gate block-based components. Use `Paradigm::is_enabled( $tag )` (PHP) / `isFeatureEnabled( $tag )` (JS) — never hardcode paradigm decisions.
*   **Component Registry:** Search the registry using `npm run rig:search [keyword]` to see if the feature already exists as a verified component. **ALWAYS** prioritize leveraging existing registry components over building from scratch.
*   **Export Rules:** Update `export.filesToCopy` if adding new root-level folders.

## PHP Components

Located in `inc/` - each feature is a Component class implementing `Component_Interface`. `Theme::get_default_components()` discovers them from `inc/components-manifest.json` (preferred) or by directory scan, and skips any component whose `is_active()` returns false (paradigm gating).

| Component        | File | Responsibility | Paradigm |
|------------------|------|----------------|----------|
| Theme            | `inc/Theme.php` | Main class - discovers + initializes all components | all |
| Paradigm         | `inc/Paradigm.php` | Paradigm resolution (`is_enabled()`, `get_active_theme_type()`) | all |
| Localization     | `inc/Localization/Component.php` | Text domain, translations | all |
| Base_Support     | `inc/Base_Support/Component.php` | Core theme support features | all |
| Editor           | `inc/Editor/Component.php` | Block editor integration | all |
| Accessibility    | `inc/Accessibility/Component.php` | Accessibility enhancements (skip link, focus, scrollable regions) | all |
| Image_Sizes      | `inc/Image_Sizes/Component.php` | Custom image sizes | all |
| PWA              | `inc/PWA/Component.php` | Progressive Web App support | all |
| Comments         | `inc/Comments/Component.php` | Comment functionality | all |
| Nav_Menus        | `inc/Nav_Menus/Component.php` | Navigation menu registration | classic |
| Sidebars         | `inc/Sidebars/Component.php` | Widget area registration | classic |
| Customizer       | `inc/Customizer/Component.php` | Customizer integration | classic |
| EZ_Customizer    | `inc/EZ_Customizer/Component.php` | Customizer settings | classic |
| Custom_Background | `inc/Custom_Background/Component.php` | Custom background support | all |
| Custom_Header    | `inc/Custom_Header/Component.php` | Custom header support | all |
| Custom_Logo      | `inc/Custom_Logo/Component.php` | Custom logo support | all |
| Post_Thumbnails  | `inc/Post_Thumbnails/Component.php` | Featured image support | all |
| Fonts            | `inc/Fonts/Component.php` | Web font loading | all |
| Styles           | `inc/Styles/Component.php` | CSS enqueueing and preloading | all |
| Scripts          | `inc/Scripts/Component.php` | JavaScript enqueueing | all |
| Excerpts         | `inc/Excerpts/Component.php` | Excerpt customization | all |
| Options          | `inc/Options/Component.php` | Theme options page | all |
| Blocks           | `inc/Blocks/Component.php` | Block manifest registration | block-based |
| Block_Patterns   | `inc/Block_Patterns/Component.php` | Pattern categories + component patterns | block-based |
| Block_Styles     | `inc/Block_Styles/Component.php` | Registered block style variations | block-based |
| Layout           | `inc/Layout/Component.php` | Layout / content-width helpers | all |
| Performance      | `inc/Performance/Component.php` | Critical CSS, performance cleanup | all |
| Registry_Config  | `inc/Registry_Config/Component.php` | OCR registry configuration | all |
| Dev_Tools        | `inc/Dev_Tools/Component.php` | Developer toolbar (dev only) | all |

> Components without a `PARADIGM` constant behave as `all`. Gated components use `Paradigm_Component_Trait` + `const PARADIGM` and are skipped automatically when the active theme type doesn't include them.

## JavaScript / TypeScript

Source files are in `assets/js/src/` and processed by `build-js.js`.

| File | Purpose |
|------|---------|
| `global.ts` | Global scripts loaded on all pages |
| `navigation.ts` | Mobile menu toggle, dropdown behavior |
| `customizer.tsx` | Customizer live preview |
| `admin/index.jsx` | Admin settings React app |
| `admin/api.js` | REST API helpers for admin |

## Templates

| File | Purpose |
|------|---------|
| `templates/index.html` | Block theme template (header/main/footer landmarks) — used when block-based |
| `index.php` | Main template fallback |
| `header.php` | Site header (opens HTML, head, body) |
| `footer.php` | Site footer (closes body, HTML) |
| `sidebar.php` | Sidebar template |
| `comments.php` | Comments template |
| `404.php` | Not found page |
| `500.php` | Server error page |
| `offline.php` | PWA offline page |
| `template-parts/` | Reusable template partials |

## Configuration

| File | Purpose |
|------|---------|
| `config/paradigms.json` | Paradigm matrix — the single source of truth for `themeType` + feature tags |
| `config/tokens.json` | Design tokens — the single source of truth for colors/fonts/spacing/breakpoints (propagated to `theme.json` + CSS) |
| `config/config.default.json` | Default theme settings (do not edit) |
| `config/config.json` | Custom theme settings (version controlled) |
| `config/config.local.json` | Local-only settings (gitignored) |

## Common Architecture Tasks

### Add a new navigation menu location

1. Edit `inc/Nav_Menus/Component.php`.
2. Add to the array in the `register_nav_menus()` method.
3. Use `wp_nav_menu(['theme_location' => 'your-location'])` in templates.

### Change theme configuration

1. Copy settings from `config/config.default.json`.
2. Override in `config/config.json` (only include changed values).
3. For local-only settings, use `config/config.local.json`.

## Coding Conventions

- **PHP components**: Located at `inc/{Feature}/Component.php`.
- **PHP namespace**: `WP_Rig\WP_Rig`.
- **Text domain**: Matches theme slug in config.
- **Component Registration**: Components are discovered by `Theme::get_default_components()` via `inc/components-manifest.json` (written by `rig` tooling) or directory scan, and gated by `is_active()` (paradigm).
- **Paradigm Gating**: A component that only serves one paradigm declares `const PARADIGM = 'classic' | 'universal' | 'block-based'` and uses `Paradigm_Component_Trait`. Never wire block-based features into the classic core.
- **Custom Hooks**: Prefer custom hooks over core edits. Use filters like `wp_rig_css_files` and `wp_rig_js_files` to add assets.

## Skill Relationships

The Architecture skill is the bedrock of WP Rig, but it interacts directly with:

- **Feature Planning:** Any structural change to the architecture (new components, changes to `Theme.php`, or new global templates) must first be defined via the [Feature Planning skill](../feature-planning/SKILL.md).
- **Component Registry:** The [Component Registry skill](../component-registry/SKILL.md) provides a catalog of pre-built, optimized components that should be considered for any new architectural feature.
- **Web Designer:** Architectural choices for CSS/JS enqueuing and template structure are driven by the design system and interactive requirements defined in the [Web Designer skill](../web-designer/SKILL.md).
