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
| Navigation menu | `inc/Nav_Menus/Component.php`, `assets/css/src/_navigation.css`, `assets/js/src/navigation.ts` |
| Typography | `assets/css/src/_typography.css` |
| CSS variables | `assets/css/src/_custom-properties.css` |
| Accessibility | `inc/Accessibility/Component.php`, `assets/css/src/_accessibility.css` |
| Sidebar/widgets | `inc/Sidebars/Component.php`, `assets/css/src/sidebar.css`, `assets/css/src/widgets.css` |
| Comments | `inc/Comments/Component.php`, `assets/css/src/comments.css` |
| Editor styles | `inc/Editor/Component.php`, `assets/css/src/editor/editor-styles.css` |
| Custom logo | `inc/Custom_Logo/Component.php` |
| Custom header | `inc/Custom_Header/Component.php` |
| Fonts | `inc/Fonts/Component.php` |
| Build configuration | `config/config.default.json`, `config/config.json` |

## Configuration & Identity

Before making architectural changes, you **MUST** reference the `config/config.json` and check the [Component Registry skill](../component-registry/SKILL.md).

*   **Theme Identity:** Use `theme.PHPNamespace` and `theme.slug` for components and translations.
*   **Theme Type:** Check `theme.themeType` (classic vs block-based) to determine template strategy.
*   **Component Registry:** Search the registry using `npm run rig:search [keyword]` to see if the feature already exists as a verified component. **ALWAYS** prioritize leveraging existing registry components over building from scratch.
*   **Export Rules:** Update `export.filesToCopy` if adding new root-level folders.

## PHP Components

Located in `inc/` - each feature is a Component class implementing `Component_Interface`.

| Component        | File | Responsibility |
|------------------|------|----------------|
| Theme            | `inc/Theme.php` | Main class - registers and initializes all components |
| Localization     | `inc/Localization/Component.php` | Text domain, translations |
| Base_Support     | `inc/Base_Support/Component.php` | Core theme support features |
| Editor           | `inc/Editor/Component.php` | Block editor integration |
| Accessibility    | `inc/Accessibility/Component.php` | Accessibility enhancements |
| Image_Sizes      | `inc/Image_Sizes/Component.php` | Custom image sizes |
| PWA              | `inc/PWA/Component.php` | Progressive Web App support |
| Comments         | `inc/Comments/Component.php` | Comment functionality |
| Nav_Menus        | `inc/Nav_Menus/Component.php` | Navigation menu registration |
| Sidebars         | `inc/Sidebars/Component.php` | Widget area registration |
| Custom_Background | `inc/Custom_Background/Component.php` | Custom background support |
| Custom_Header    | `inc/Custom_Header/Component.php` | Custom header support |
| Custom_Logo      | `inc/Custom_Logo/Component.php` | Custom logo support |
| Post_Thumbnails  | `inc/Post_Thumbnails/Component.php` | Featured image support |
| EZ_Customizer    | `inc/EZ_Customizer/Component.php` | Customizer settings |
| Fonts            | `inc/Fonts/Component.php` | Web font loading |
| Styles           | `inc/Styles/Component.php` | CSS enqueueing and preloading |
| Scripts          | `inc/Scripts/Component.php` | JavaScript enqueueing |
| Excerpts         | `inc/Excerpts/Component.php` | Excerpt customization |
| Options          | `inc/Options/Component.php` | Theme options page |

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
- **Component Registration**: Components are registered in `inc/Theme.php` in the `get_default_components()` method.
- **Custom Hooks**: Prefer custom hooks over core edits. Use filters like `wp_rig_css_files` and `wp_rig_js_files` to add assets.

## Skill Relationships

The Architecture skill is the bedrock of WP Rig, but it interacts directly with:

- **Feature Planning:** Any structural change to the architecture (new components, changes to `Theme.php`, or new global templates) must first be defined via the [Feature Planning skill](../feature-planning/SKILL.md).
- **Component Registry:** The [Component Registry skill](../component-registry/SKILL.md) provides a catalog of pre-built, optimized components that should be considered for any new architectural feature.
- **Web Designer:** Architectural choices for CSS/JS enqueuing and template structure are driven by the design system and interactive requirements defined in the [Web Designer skill](../web-designer/SKILL.md).
