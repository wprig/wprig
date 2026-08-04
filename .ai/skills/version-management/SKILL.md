---
description: Guide to managing and promoting theme versions in WP Rig.
globs: package.json, style.css, readme.txt, CHANGELOG.md
---

# Version Management in WP Rig

This guide describes how to manage and promote theme versions in WP Rig using automated tooling.

## Core Principle

Theme versions must be consistent across all metadata files. WP Rig uses `package.json` as the primary source of truth for tooling, and `style.css` as the source of truth for WordPress.

## Automated Version Promotion

WP Rig provides a CLI command to update all version-related files simultaneously.

### Usage

```bash
npm run rig version <new-version>
```

### Options

- `-d, --description <text>`: Provide a short description for the `CHANGELOG.md` entry.

### Files Updated

1. **`package.json`**: Updates the `"version"` field.
2. **`style.css`**: Updates the `Version:` header.
3. **`readme.txt`**: Updates the `Stable tag:` field.
4. **`CHANGELOG.md`**: Adds a new version section at the top.

## Manual Verification

After running the version promotion command, you should verify:

1.  **Changelog**: Ensure the new entry accurately reflects the changes in the release.
2.  **WordPress Admin**: Check the theme version in the Appearance -> Themes screen.
3.  **Asset Versioning**: Verify that enqueued scripts and styles are using the new version (WP Rig does this automatically via the `Versioning_Trait`).

## PHP Implementation

WP Rig components use the `Versioning_Trait` to fetch the theme version dynamically from `style.css`.

```php
// In a component
$version = $this->get_version();
wp_enqueue_style( 'my-handle', $url, [], $version );
```

## Related Skills

- [**Theme Bundling**](../theme-bundling/SKILL.md): Preparing the theme for distribution.
- [**npm Scripts**](../npm-scripts/SKILL.md): Other utility scripts in WP Rig.
