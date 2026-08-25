# Architecture & Component System

This document explains how WP Rig is organized to help developers understand the codebase structure and its modular architecture.

## Directory Structure

```
wprig/
├── assets/                 # Frontend assets (CSS, JS, images, SVG)
│   ├── css/src/           # Source CSS files (compiled by build-css.js)
│   │   ├── global.css     # Main entry point - imports all partials
│   │   ├── _*.css         # Partial files (variables, header, nav, etc.)
│   │   └── editor/        # Block editor styles
│   ├── js/src/            # Source JS/TS files (compiled by build-js.js)
│   └── svg/               # SVG icons
├── config/                 # Theme configuration files
│   ├── config.default.json # Default settings (do not edit)
│   ├── config.json        # Custom settings (version controlled)
│   └── config.local.json  # Local-only settings (gitignored)
├── inc/                    # PHP components and theme logic
│   ├── Theme.php          # Main theme class - registers all components
│   ├── {Feature}/         # Feature components (Styles, Scripts, Nav_Menus, etc.)
│   │   └── Component.php  # Each implements Component_Interface
│   ├── Template_Tags.php  # Template helper functions accessed via wp_rig()
│   └── functions.php      # Helper functions
├── template-parts/         # Reusable template partials
├── functions.php           # Theme bootstrap - instantiates Theme class
└── index.php, header.php, footer.php, etc.  # Main templates
```

## Image Pipeline

Source images live in `assets/images/src/`. The build pipeline
(`scripts/tasks/images.js`, sharp/libvips) optimizes JPEG/PNG/GIF/SVG and then
emits **modern formats** from JPEG/PNG sources (`convertToModernFormats`):

- **WebP** — universal baseline (quality 75).
- **AVIF** — the 7.1-era default, encoded via sharp `heif({ compression: 'av1' })`
  (verified on sharp 0.35 / libvips 8.18). HDR AVIF (10-bit) is
  container-supported but needs 10/16-bit sources; the standard pipeline
  optimizes SDR masters. **HEIC/HEVC is deliberately not a target** — the shipped
  build has no HEVC encoder, HEIC is Safari-ecosystem-only and patent-encumbered.

If a host sharp build lacks the AV1 codec, AVIF is skipped with a warning and
WebP still ships — one missing codec never breaks the build.

## Component System

WP Rig uses a modular component architecture where each feature is encapsulated in its own class:

1. **Bootstrap**: `functions.php` creates the `Theme` instance.
2. **Registration**: `Theme::__construct()` loads default components from `inc/*/Component.php`.
3. **Initialization**: Each component's `initialize()` method hooks into WordPress.

```
functions.php → Theme.php → Component::initialize() → WordPress hooks
```

Each component implements `Component_Interface` and optionally `Templating_Component_Interface` for template tags. Components are self-contained: they register their own hooks, enqueue their own assets, and provide their own template functions.

### Component Registry (OCR)

WP Rig features an Open Component Registry that allows you to import and share performance-optimized, AI-ready theme components.

- **`npm run rig:list`**: List all installed components and their status. Use this to see what features are currently active in your theme.
- **`npm run rig:search [keyword]`**: Discover performance-optimized components from the community. Use this when you're looking for existing features to add to your theme.
- **`npm run rig:add [slug]`**: Download and install a component. It automatically registers the component and integrates its assets. Use this to quickly add new functionality.
- **`npm run rig:update [slug]`**: Check for and pull updates to components while preserving your local customizations. Use this to keep your components bug-free and up-to-date.
- **`npm run rig:remove [slug]`**: Completely remove a component from your theme. Use this when you no longer need a feature.
- **`npm run rig:test-component [slug]`**: Run a "pre-flight" check on a local component to ensure it meets registry standards. Use this before sharing your component.
- **`npm run rig:prepare [slug]`**: Package a local component and get instructions for submitting it via GitHub Pull Request. Use this when you want to share your work with the community.

Components added via the registry are automatically registered in `inc/Theme.php` and integrated into the build pipeline. For more details, see the [Component Registry Breakdown](development/wprig-v3-4-component-registry-feature-breakdown.md).

### Component Scaffolding

WP Rig includes a component scaffolding system that makes it easy to create new PHP components under the `inc/` directory.

#### Usage

```bash
npm run create-rig-component "Component Name" [options]
```

#### Options

- `--templating`: Add `Templating_Component_Interface` and `template_tags()` method.
- `--tests`: Create a minimal PHPUnit test skeleton.

#### Example

```bash
npm run create-rig-component "Related Posts" --templating --tests
```

This command will:
1. Create a new component at `inc/Related_Posts/Component.php`.
2. Implement required interfaces.
3. Add a `template_tags()` method ready to be customized.
4. Create a test file at `tests/phpunit/unit/inc/Related_Posts/ComponentTest.php`.
5. Auto-register the component in `Theme.php`.
