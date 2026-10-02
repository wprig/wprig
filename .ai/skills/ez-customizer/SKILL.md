---
name: ez-customizer
description: Guide for adding and managing WordPress Customizer settings via JSON configuration in WP Rig.
globs: inc/EZ_Customizer/themeCustomizeSettings.json, inc/EZ_Customizer/Component.php
---

# EZ Customizer in WP Rig

WP Rig includes the `EZ_Customizer` component, which allows developers to register Customizer sections, settings, and controls using a declarative JSON configuration file.

## Configuration File

The Customizer settings are defined in `inc/EZ_Customizer/themeCustomizeSettings.json`.

### Basic JSON Structure
```json
{
  "theme_name": "My Theme",
  "settings_id": "my_theme",
  "sections": [
    {
      "id": "my_section",
      "title": "My Section",
      "description": "Description of the section.",
      "priority": 30
    }
  ],
  "settings": [
    {
      "id": "my_setting",
      "label": "My Setting",
      "section": "my_section",
      "type": "text",
      "default": "Default Value",
      "refresh": false
    }
  ]
}
```

### Key Properties

- **`theme_name`**: Used as a prefix for control IDs.
- **`settings_id`**: Used as a prefix for section IDs.
- **`sections`**: An array of objects defining Customizer sections.
- **`settings`**: An array of objects defining individual settings.

### Field Configuration

- **`type`**: Supported types include:
    - `text`, `checkbox`, `radio`, `select`, `textarea`, `dropdown-pages`, `email`, `url`, `number`, `range`, `tel`, `search`, `password`, `date`, `time`.
    - Special types (handled by classes): `color`, `date`, `media`.
- **`refresh`**: If set to `false`, `transport` is set to `postMessage` (live preview). Defaults to `true` (full refresh).
- **`default`**: Default value for the setting.
- **`choices`**: An object or array for `select`, `radio`, or `checkbox` types.

## Accessing Customizer Settings

Use the standard WordPress `get_theme_mod()` function to retrieve Customizer settings.

```php
$my_setting_value = get_theme_mod( 'my_setting', 'Default Value' );
```

## Verification & Iteration (Ralph Loop)

Use Playwright to verify your Customizer settings:

1.  **Setting Persistence**: Automate navigating to the Customizer and setting a value to ensure it saves and renders correctly.
2.  **Visual Verification**: Use `npm run test:e2e:screenshot` to verify that the frontend reflects the changes made via Customizer.
3.  **Live Preview**: Verify that `postMessage` refreshes are working for settings with `refresh: false`.

## Best Practices for Agents

1. **Declarative First**: Always prefer adding settings via `themeCustomizeSettings.json` before writing manual PHP Customizer code.
2. **Naming Conventions**: Use descriptive IDs and ensure they are unique within the project.
3. **Live Preview**: Set `refresh: false` for settings that can be updated via JavaScript (CSS changes, text swaps) to provide a better user experience.
4. **Section Grouping**: Group related settings into sections to keep the Customizer organized.
5. **Sanitization**: Standard WordPress Customizer sanitization is used. For complex validation, you may need to hook into `customize_register` in `inc/EZ_Customizer/Component.php`.
6. **Filters**: Use the `wp_rig_customizer_settings` filter if you need to dynamically modify settings at runtime.
