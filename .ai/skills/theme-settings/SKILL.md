---
name: theme-settings
description: Guide for adding and managing theme settings using the React-based Options framework in WP Rig.
globs: assets/js/src/admin/*.{json,jsx,js}, inc/Options/Component.php
---

# WP Rig Options Framework

WP Rig features a React-based Options framework for managing theme settings through a custom admin page. This page is managed in `assets/js/src/admin`.

## Plan A: Adding Simple Settings

The most common way to add settings is by modifying `assets/js/src/admin/settingsFields.json`. This file defines the structure of the settings page, including tabs and fields.

### JSON Structure Example
```json
{
  "tabs": [
    {
      "id": "my-tab",
      "tabControl": { "label": "My Settings" },
      "tabContent": {
        "fields": [
          {
            "name": "my_text_setting",
            "label": "Text Setting",
            "type": "text"
          },
          {
            "name": "my_toggle_setting",
            "label": "Enable Feature",
            "type": "toggle"
          },
          {
            "name": "my_select_setting",
            "label": "Select Option",
            "type": "select",
            "options": [
              { "label": "Option 1", "value": "opt-1" },
              { "label": "Option 2", "value": "opt-2" }
            ]
          }
        ]
      }
    }
  ]
}
```

### Supported Field Types
The following field types are supported out-of-the-box:
- `text`, `email`, `url`, `password`, `number`, `search`, `tel`, `date`, `time`, `datetime-local` (rendered as `TextControl`)
- `toggle` (rendered as `FormToggle`)
- `select` (rendered as `SelectControl`, requires an `options` array in the field definition)

## Plan B: Complex Fields and Custom Logic

For more complex fields or custom behavior, you can modify the following files:

- **`assets/js/src/admin/index.jsx`**: The main React component for the settings page. You can add new field types to the rendering logic or implement custom validation.
- **`assets/js/src/admin/api.js`**: Handles the communication with the WordPress REST API.

## PHP Integration

### Accessing Settings
Use the `wp_rig()->get_setting()` method to retrieve settings in your PHP code.

**Example:**
```php
$is_enabled = wp_rig()->get_setting( 'my_toggle_setting', false );
if ( $is_enabled ) {
    // Execute feature logic
}
```

### Sanitization
When adding new settings, ensure they are properly sanitized in `inc/Options/Component.php` within the `sanitize_theme_settings()` method.

**Example:**
```php
switch ( $sanitized_key ) {
    case 'my_email_setting':
        $sanitized_settings[ $sanitized_key ] = sanitize_email( $value );
        break;
    default:
        $sanitized_settings[ $sanitized_key ] = sanitize_text_field( $value );
        break;
}
```

## Verification & Iteration (Ralph Loop)

To ensure your theme settings are working correctly:

1.  **Automation**: Create a Playwright test to navigate to the Theme Settings admin page, toggle a setting, and verify the frontend change.
2.  **Visual Proof**: Use `npm run test:e2e:screenshot` to capture the setting being toggled in the admin and the resulting change on the site.
3.  **Sanity Check**: Use `npx playwright test` to run existing smoke tests to ensure no regressions were introduced.

## Best Practices for Agents

1.  **Always prefer Plan A**: If a setting can be represented by a standard field type, use `settingsFields.json`.
2.  **Enable/Disable Features**: Wrap theme-level functionality in options controls to allow users to toggle features.
3.  **Default Values**: Provide sensible default values when calling `wp_rig()->get_setting()`.
4.  **Group Settings**: Use tabs to group related settings logically.
