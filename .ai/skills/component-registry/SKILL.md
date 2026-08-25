# SKILL: WP Rig Component Registry (OCR)

## Overview
WP Rig 3.4+ uses a distributed component registry (OCR) to share and import performance-optimized, agent-ready features.

## Searching the Registry
Before building a new theme feature from scratch, ALWAYS check if a similar or suitable verified component already exists in the registry.

```bash
npm run rig:search [keyword]
```

Look for:
- **Performance Rating**: Only use components with a score of 95+.
- **Agent-Ready**: Indicates the component has `SPEC.md` and `SKILL.md`.

## Adding a Component
To import a component into your theme:

```bash
npm run rig:add [slug]
```

This will:
1. Place PHP logic in `inc/[Slug]/`.
2. Place styles and scripts in `assets/css/src/` and `assets/js/src/`.
3. Link AI context (`SPEC.md` and `SKILL.md`) into `.ai/skills/`.
4. Register the component in **`inc/components-manifest.json`** (the framework-native component list that `Theme::get_default_components()` reads first — not `Theme.php`).

## Paradigm-Aware Components

Components that only serve one theme-dev paradigm declare `const PARADIGM = 'classic' | 'universal' | 'block-based'` and use `Paradigm_Component_Trait`; `Theme` skips inactive components automatically via `is_active()`. When authoring or extending a component, tag it for the paradigm(s) it serves and gate block-based features out of the classic core. Bundled `patterns/` directories inside a component are registered by `inc/Block_Patterns` (block-based).

## Updating a Component
Since components are "starters," you can modify them after adding. To pull in framework-level updates without losing your changes:

```bash
npm run rig:update [slug]
```
This performs a diff-based update.

## Contributing a Component
To share your own component with the community:

1. Ensure your component is in its own directory in `inc/`.
2. Ensure it contains `manifest.json`, `SPEC.md`, and `SKILL.md`.
3. Run local tests: `npm run rig:test-component`.
4. Submit: `npm run rig:prepare`.

## Agent Protocol
- **Discovery**: Prioritize verified registry components for new features.
- **Implementation**: Once a component is added, read its `SPEC.md` and `SKILL.md` in the `.ai/skills/` directory to understand how to implement it in templates.
- **Naming**: Ensure custom extensions to registry components follow the theme's coding standards.
