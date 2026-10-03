---
name: php-filters
description: Guide for using custom PHP hooks and conventions in WP Rig to extend functionality.
globs: inc/**/*.php, functions.php
---

# WP Rig custom filters and hooks

WP Rig provides several custom hooks to extend its core functionality without modifying core component files directly. These filters should be used to add or modify theme assets and behavior.

## Theme Identity & Namespace

When using filters or creating new PHP components, you **MUST** reference the `config/config.json`.

*   **Namespace:** Use `theme.PHPNamespace` instead of assuming `WP_Rig`.
*   **Slug:** Use `theme.slug` for text domains and unique identifiers.

## CSS and JS Assets

### `wp_rig_css_files`
Filters the list of CSS files enqueued by the theme. Use this to add custom stylesheets that are enqueued and potentially preloaded.

**Usage Example:**
```php
add_filter( 'wp_rig_css_files', function( $css_files ) {
    $css_files['my-custom-handle'] = [
        'file'             => 'my-custom.min.css', // Relative to assets/css/
        'global'           => false,                // Optional: set to true to enqueue globally
        'preload_callback' => 'is_single',         // Optional: condition for preloading
    ];
    return $css_files;
} );
```

### `wp_rig_js_files`
Filters the list of JS files enqueued by the theme.

**Usage Example:**
```php
add_filter( 'wp_rig_js_files', function( $js_files ) {
    $js_files['my-custom-handle'] = [
        'file'    => 'my-custom.min.js', // Relative to assets/js/
        'global'  => true,               // Enqueue on all pages
        'loading' => 'async',            // Optional: 'async' or 'defer'
        'footer'  => true,               // Load in footer
    ];
    return $js_files;
} );
```

### `wp_rig_preloading_styles_enabled`
Enables or disables style preloading globally.

## Typography and Fonts

### `wp_rig_google_fonts`
Filters the array of Google Fonts to download and use in the theme.

**Usage Example:**
```php
add_filter( 'wp_rig_google_fonts', function( $fonts ) {
    $fonts[] = [
        'font-family' => 'Open Sans',
        'font-weight' => '400,700',
        'font-style'  => 'normal,italic',
    ];
    return $fonts;
} );
```

## UI and Navigation

### Icon SVGs
*   `wp_rig_dropdown_icon_svg`: Filters the SVG for submenu dropdown buttons.
*   `wp_rig_menu_toggle_icon_svg`: Filters the SVG for the mobile menu toggle button.
*   `wp_rig_menu_close_icon_svg`: Filters the SVG for the menu close button.

### `wp_rig_customizer_settings`
Filters the theme settings used in the Customizer and available via `wp_rig()->get_setting()`.

## Best Practices for Agents

1.  **Prefer hooks over core edits**: When adding new styles or scripts, always use the `wp_rig_css_files` and `wp_rig_js_files` filters in `functions.php` or a custom component instead of editing `inc/Styles/Component.php` or `inc/Scripts/Component.php` directly.
2.  **Follow WP Rig file structure**: Place your custom CSS files in `assets/css/src/` and JS files in `assets/js/src/`, and ensure they are processed by the build system (using `npm run dev`).
3.  **Leverage preloading**: For critical styles that only load on certain pages, use the `preload_callback` in `wp_rig_css_files` to improve performance.
4.  **Use `wp_rig()->get_setting()`**: For theme options, use the built-in setting getter instead of `get_theme_mod()` directly.
