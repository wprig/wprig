---
description: Step-by-step recipe for creating a new PHP component in WP Rig.
globs: inc/**/*.php, functions.php
---

# Create a New WP Rig Component

This skill provides the recipe to scaffold and register a new theme component.

## Before Creating a New Component

**ALWAYS** check the [Component Registry skill](../component-registry/SKILL.md) first. Search the registry using `npm run rig:search [keyword]` to see if the feature already exists as a verified, optimized component. **LEVERAGE** existing registry components rather than building from scratch.

## Step 1: Use the Scaffolding Script

WP Rig provides a dedicated script to create the component directory and initial class file.

```bash
npm run create-rig-component "Your Feature Name"
```

This will:
1. Create a folder in `inc/Your_Feature_Name/`.
2. Generate `Component.php` inside it, implementing `Component_Interface`.
3. **Automatically Register** the new component in `inc/Theme.php` by adding it to the `get_default_components()` method.

## Step 2: Implement Hooks

After scaffolding, the component is already wired and ready. Open your new `inc/Your_Feature_Name/Component.php` and use the `initialize()` method to add WordPress hooks.

```php
public function initialize() {
	add_action( 'wp_enqueue_scripts', array( $this, 'action_enqueue_scripts' ) );
}
```

## Best Practices

- Always use `npm run create-rig-component` instead of manual creation.
- Ensure the namespace matches `WP_Rig\WP_Rig\{Feature}`.
- Implement only the interfaces you need (e.g., `Templating_Component_Interface` if you provide template tags).
- If the scaffolding script fails to auto-wire (check command output), manually add `new Your_Feature_Name\Component(),` to `inc/Theme.php`.
