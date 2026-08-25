---
description: Step-by-step recipe for creating a new PHP component in WP Rig.
globs: inc/**/*.php, functions.php
---

# Create a New WP Rig Component

This skill provides the recipe to scaffold a new theme component that is ready for the
Open Component Registry (OCR).

## Before Creating a New Component

**ALWAYS** check the [Component Registry skill](../component-registry/SKILL.md) first. Search the registry using `npm run rig:search [keyword]` to see if the feature already exists as a verified, optimized component. **LEVERAGE** existing registry components rather than building from scratch.

## Step 1: Use the Scaffolding Script

WP Rig provides a dedicated script to create a registry-ready component directory, class file, manifest, SPEC, SKILL, and stub assets.

```bash
npm run create-rig-component "Your Feature Name" [--paradigm all|classic|universal|block-based]
```

This will:
1. Create a folder in `inc/Your_Feature_Name/` with `Component.php` (implements `Component_Interface`), `manifest.json` (OCR schema v2), `SPEC.md`, and `SKILL.md`.
2. Create stub `assets/css/src/<slug>.css` + `assets/js/src/<slug>.ts` referenced by the manifest.
3. When `--paradigm` is not `all` (e.g. `block-based`), generate a **gated** component: a `PARADIGM` const + `Paradigm_Component_Trait` so `Theme` skips it for inactive paradigms, and mark manifest assets `scoped: true`.

> Wiring is automatic — `Theme::get_default_components()` discovers components from
> `inc/components-manifest.json` (or directory scan) and gates them via `is_active()`.
> There is no `inc/Theme.php` registration step.

## Step 2: Implement Hooks

After scaffolding, the component is already wired and ready. Open your new `inc/Your_Feature_Name/Component.php` and use the `initialize()` method to add WordPress hooks.

```php
public function initialize() {
	add_action( 'wp_enqueue_scripts', array( $this, 'action_enqueue_scripts' ) );
}
```

For a `block-based` component, enqueue its `scoped` styles/scripts conditionally (e.g. `enqueue_block_style()` / `viewScript`) so they never load globally.

## Step 3: Validate for the Registry

```bash
npm run rig:test-component "Your_Feature_Name"   # pre-flight (manifest, paradigm, security)
npm run rig:prepare "Your_Feature_Name"          # package to dist/components/ + submit instructions
```

## Best Practices

- Always use `npm run create-rig-component` instead of manual creation.
- Ensure the namespace matches `WP_Rig\WP_Rig\{Feature}`.
- Implement only the interfaces you need (e.g., `Templating_Component_Interface` if you provide template tags).
- Choose `--paradigm` to match what the component serves; `block-based` components must never be wired into the classic core.
- Keep `manifest.paradigm` in sync with the `PARADIGM` const — the pre-flight validator fails on mismatch.
