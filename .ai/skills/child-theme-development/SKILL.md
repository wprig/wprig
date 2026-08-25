---
description: Guide for creating and managing child themes using WP Rig's "childify" script.
globs: childify.js, package.json
---

# Child Theme Development in WP Rig

WP Rig includes a specialized tool for creating child themes that inherit the core functionality of the parent theme while allowing for customizations.

## Configuration & Child Context

Before developing or modifying a child theme, you **MUST** reference the `config/config.json`.

*   **Check Context:** Determine if you are operating within a child theme by checking `child.enabled`.
*   **Parent Reference:** Use `child.parentSlug` to correctly reference the parent theme in logic and overrides.

## Creating a Child Theme

Use the `childify` script to scaffold a new child theme.

```bash
npm run childify
```

The script will:
1. Prompt for a child theme slug.
2. Create a new directory for the child theme in the WordPress `themes/` folder.
3. Copy the necessary assets (`style.css`, `functions.php`, `package.json`, `config/`).
4. Set the parent theme reference in `style.css`.

### Paradigm-aware child themes (3.5)

`childify` inherits the parent's **paradigm intelligence**: the component keep-list is derived from the active `theme.themeType` (classic keeps the classic core; universal/block-based also keep Editor, Blocks, Block_Patterns, Block_Styles, Icons), and the keep-list is written to `inc/components-manifest.json` through the framework-native mechanism. The child's config resolves from the shared chain (`config.default.json` → `config.json`), never `config.local.json`, so local harness overrides don't leak into a shipped child.

## Architecture of WP Rig Child Themes

Child themes in WP Rig are designed to be thin layers on top of the parent theme.

### Key Considerations

- **Component Overrides**: Child themes can override parent components by implementing a class with the same slug.
- **Assets**: Child themes have their own `assets/` directory and build system.
- **Functions.php**: Use `functions.php` for child-specific hooks or to load child components.
- **Styles**: Child themes automatically enqueue the parent's styles. Add custom styles to the child theme's `assets/css/src/global.css`.

## Development Workflow

1. **Scaffold**: Run `npm run childify`.
2. **Setup Child**: Navigate to the new child theme directory (`cd ../{child-slug}`).
3. **Install Dependencies**: Run `npm install` in the child theme directory.
4. **Configure**: Update `config/config.json` in the child theme to set the `devURL`.
5. **Develop**: Use `npm run dev:modern` from within the child theme directory.

## Best Practices for Agents

1. **Keep it Thin**: Only add code to the child theme that is truly specific to the customization.
2. **Use Components**: If the child theme needs significant new functionality, create a new component in the child theme's `inc/` directory rather than overloading `functions.php`.
3. **Parent Assets**: Avoid copying parent assets unless you need to modify them. Use the parent theme's enqueued scripts and styles when possible.
4. **Theme Slug**: Be mindful of the theme slug in your PHP namespace. Child theme components should use a namespace that distinguishes them from the parent theme.
5. **Testing**: Test the child theme's build process (`npm run build`) independently of the parent theme.
