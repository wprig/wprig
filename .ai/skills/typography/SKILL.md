---
description: Comprehensive guide to typography, font loading, and variable fonts in WP Rig.
globs: inc/Fonts/Component.php, theme.json, assets/css/src/_custom-properties.css
---

# WP Rig Typography

This guide covers the architecture and best practices for implementing typography in WP Rig themes, supporting both classic and block-based scenarios.

## 1. Core Philosophy
*   **Performance First:** Fonts should be preloaded, enqueued with `display: swap` (or `block` for brand fonts), and ideally served locally to minimize external dependencies.
*   **Fluidity:** Use `clamp()` and relative units (`rem`, `em`, `vw`) to ensure typography scales gracefully across devices.
*   **Consistency:** Define font stacks and sizes once in `theme.json` or CSS variables and reuse them throughout the theme.

## 2. Configuration & Asset Management

### theme.json (Block-Based & Universal Themes)
For modern WP Rig themes, `theme.json` is the source of truth for typography presets.
*   **fontFamilies**: Define your font stacks here.
*   **fontSizes**: Use the `fluid` property for automatic responsive sizing.

### CSS Variables (Classic & Hybrid Themes)
Define typography tokens in `assets/css/src/_custom-properties.css`:
```css
:root {
	--global-font-family: "Open Sans", sans-serif;
	--font-size-base: clamp(0.75rem, 0.667rem + 0.417vw, 1rem);
}
```

## 3. The Fonts Component (`inc/Fonts/Component.php`)
This component handles the technical registration and loading of fonts.

### Registering Google Fonts
Use the `get_google_fonts()` method to define your fonts.
*   **Standard Fonts**: Pass an array of weights (e.g., `['400', '700']`).
*   **Variable Fonts**: Pass a string containing the axis configuration (e.g., `wght@100..900`).

### Variable Font Best Practices
WP Rig supports the Google Fonts v2 API. For complex variable axes (optical size, weight ranges), use the `@` notation:
```php
'Google Sans Flex' => 'opsz,wght@6..144,1..1000',
```

### Local Font Downloads
To improve performance and privacy (GDPR), use the built-in downloader:
1.  Run `wp wprig fonts download` (if WP-CLI is available) or trigger `download_all_google_fonts()` via code.
2.  Fonts are saved to `assets/fonts/` and a `google-fonts.css` is generated in `assets/css/src/`.
3.  The theme automatically detects the local CSS and enqueues it instead of the Google CDN.

## 4. Modern WordPress Features

### Font Collections (WP 6.4+)
The `Fonts\Component` implements `wp_register_font_collection`. This allows users to select theme-approved fonts directly in the Site Editor.
*   Update `wprig_register_fonts()` to add new collections or families.

### Editor Styles
Ensure your fonts are visible in the Gutenberg editor by updating `action_add_editor_fonts()`. WP Rig handles both local and remote font enqueuing for the editor.

## 5. Performance & Loading

### Resource Hints
WP Rig automatically handles `preconnect` for Google Fonts and `preload` for local `.woff2` files.
*   **Preloading**: The first variant of each local font family is preloaded by default in `get_font_files_to_preload()`.
*   **Display**: The `wp_rig_google_fonts_display` filter defaults to `block`. Change to `swap` for better FCP (First Contentful Paint) if layout shift is acceptable.

### Icon Fonts vs. SVGs
*   **SVGs (Recommended)**: Use inline SVGs for better performance and accessibility.
*   **Icon Fonts**: If using an icon font (e.g., FontAwesome), enqueue it as a standalone style and ensure `font-display: block` is used to avoid "flicker of unstyled icons".

## 6. Developer Experience (DX)

### Adding a New Font
1.  Add the font to `get_google_fonts()` in `inc/Fonts/Component.php`.
2.  Update the font variables in `_custom-properties.css`.
3.  Update the `fontFamilies` in `theme.json`.
4.  Run `npm run dev` to rebuild CSS.

### Troubleshooting
*   **Fonts not loading?** Check the generated URL in the HTML `<head>`. Ensure `add_query_arg()` isn't collapsing duplicate `family` parameters (WP Rig core fix may be required for multiple fonts).
*   **Variable axes not working?** Verify the syntax matches the Google Fonts v2 API specification.
