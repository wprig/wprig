---
name: version-management
description: Guide to managing the WP Rig framework version and the theme version independently.
globs: config/framework.json, config/config.default.json, config/config.json, package.json, style.css, readme.txt, CHANGELOG.md
---

# Version Management in WP Rig

WP Rig tracks **two independent versions**:

| Version | What it is | Single source of truth | Bundled? |
| --- | --- | --- | --- |
| **WP Rig framework version** | The version of WP Rig the theme is built on | `config/framework.json` (mirrored in `package.json`) | **No** — source-only, stripped on `childify` |
| **Theme version** | The version of the theme being built with WP Rig | `config/config.default.json` → `theme.version` (overridable in `config/config.json`) | Yes — stamped into `style.css` / `readme.txt` |

The framework version never appears in a theme built with WP Rig: `config/` is
not part of the production bundle, and `childify` deletes
`config/framework.json`. `wp_rig()->get_wp_rig_version()` therefore returns
`null` in a built theme.

## Assessing the versions

```bash
npm run rig version
```

Prints both:

```
Theme version:         1.0.0
WP Rig framework version: 3.5.0
```

In a built theme the framework line reads `not present (built theme)`.

## Promoting the theme version

```bash
npm run rig version <new-version>
```

Updates the **theme** version only:

1. `config/config.default.json` → `theme.version`
2. `config/config.json` → `theme.version` (if present)
3. `style.css` → `Version:` header
4. `readme.txt` → `Stable tag:`
5. `CHANGELOG.md` → new section

The production build stamps `style.css` / `readme.txt` from
`config.theme.version`, so the built theme always reports the theme version —
never the framework version.

## Promoting the WP Rig framework version

```bash
npm run rig version:framework <new-version>
```

Updates the **framework** version only:

1. `config/framework.json` → `version` (the single source of truth)
2. `package.json` → `version` (npm mirror, source-only)
3. `CHANGELOG.md` → new section

### Options

Both commands accept `-d, --description <text>` for the `CHANGELOG.md` entry.

## Manual verification

1. **Changelog**: ensure the new entry reflects the release.
2. **WordPress Admin**: the Appearance → Themes version is the **theme** version.
3. **Source repo**: `npm run rig version` shows both numbers.
4. **Built theme**: confirm no `config/framework.json` exists and
   `wp_rig()->get_wp_rig_version()` returns `null`.

## PHP implementation

- `Versioning_Trait::get_version()` — theme version (from `style.css`, via `wp_get_theme()`); drives asset cache-busting.
- `Versioning_Trait::get_wp_rig_version()` — framework version (from `config/framework.json`); `null` when absent.

```php
// In a component
$theme_version     = $this->get_version();
$framework_version = $this->get_wp_rig_version(); // null in a built theme
```

## Related Skills

- [**Theme Bundling**](../theme-bundling/SKILL.md): preparing the theme for distribution.
- [**npm Scripts**](../npm-scripts/SKILL.md): other utility scripts in WP Rig.
