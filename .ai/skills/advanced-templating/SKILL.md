---
name: advanced-templating
description: Guide for creating and using template tags within WP Rig's component-based architecture.
globs: inc/**/*.php, template-parts/**/*.php, *.php
---

# Advanced Templating in WP Rig

WP Rig uses a "No Globals" approach for template functions. Instead of defining global PHP functions, template tags are registered as methods within theme components and accessed via the `wp_rig()` singleton.

## Theme Type Awareness

When creating templates or template tags, you **MUST** reference the `config/config.json`.

*   **Theme Type:** Check `theme.themeType` in the configuration.
    *   **`classic`**: Focus on PHP-based components and templates in `template-parts/`.
    *   **`block-based`**: Focus on `theme.json`, block patterns, and HTML templates in `templates/`.

## How it Works

1. **Component Interface**: A component must implement `Templating_Component_Interface` to register template tags.
2. **Method Definition**: Define the template logic as a public method within the component's class.
3. **Tag Registration**: Return an associative array of tag names and their corresponding callbacks in the `template_tags()` method.
4. **Template Access**: Call the tag in your template files using `wp_rig()->tag_name()`.

## Step-by-Step: Adding a New Template Tag

### 1. Update the Component Class
Ensure the class implements `Templating_Component_Interface` and define your logic.

```php
namespace WP_Rig\WP_Rig\My_Feature;

use WP_Rig\WP_Rig\Component_Interface;
use WP_Rig\WP_Rig\Templating_Component_Interface;

class Component implements Component_Interface, Templating_Component_Interface {
    public function get_slug(): string { return 'my-feature'; }
    public function initialize(): void { /* ... */ }

    // Register the template tag
    public function template_tags(): array {
        return [
            'my_custom_tag' => [ $this, 'my_custom_tag_logic' ],
        ];
    }

    // Define the logic
    public function my_custom_tag_logic( string $name = 'World' ): string {
        return sprintf( esc_html__( 'Hello, %s!', 'wp-rig' ), $name );
    }
}
```

### 2. Access in Templates
Call your tag anywhere in a template file (`index.php`, `header.php`, `template-parts/*.php`).

```php
<div class="my-feature">
    <?php echo wp_rig()->my_custom_tag( 'WP Rig' ); ?>
</div>
```

## Built-in Template Tags

WP Rig provides several built-in tags out-of-the-box (see `inc/*/Component.php` for others):
- `wp_rig()->posted_on()`: Displays post date.
- `wp_rig()->posted_by()`: Displays post author.
- `wp_rig()->entry_footer()`: Displays post category/tags.
- `wp_rig()->get_theme_asset()`: Retrieves contents or URL of theme assets.
- `wp_rig()->block_wrapper_attributes()`: Returns block attributes for dynamic blocks.

## Best Practices for Agents

1. **Avoid `functions.php`**: Never add template logic directly to `functions.php`. Always use a component.
2. **No Global Functions**: Do not define functions in the global namespace.
3. **Escaping**: Always escape output in the template tag method or the template file using `esc_html`, `esc_attr`, etc.
4. **Return vs. Echo**: Template tags can either return a value or echo it. Use clear naming conventions (e.g., `get_...` for return, `display_...` for echo).
5. **Context-Free**: Try to keep template tags generic so they can be reused in different parts of the theme.
