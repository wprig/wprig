# WP Rig Enhancements Checklist

This list contains prioritized enhancements for WP Rig based on AI-driven experiments and visual fidelity gap analysis. Enhancements are ordered by their estimated positive impact on the framework (highest impact first).

## 1. Core Framework Stability & Architecture
- [x] **Manifest Protection in `rig.js`**: Update the CLI to use a `merge` strategy when updating `components-manifest.json` instead of overwriting. This prevents manifest corruption which causes silent theme failures.
- [x] **Unified Design Token Registry**: Implement a central `tokens.json` file as the single source of truth for colors, typography, and spacing. Propagate these tokens to `theme.json`, and global CSS variables.
- [x] **Enhance understanding of CSS build pipeline**: Ensure our AI Agent never tries to edit .min.css files or files that are managed by the build pipeline for us. Only src files. Recent experimentation ignored this at first.

## 2. Block & Pattern Workflow
- [x] **Block Pattern Scaffolding**: Add a CLI command (e.g., `npm run rig:pattern`) to scaffold Block Patterns. Shift focus from individual block development to pattern-based assembly of core blocks.
- [x] **Native-First Block Extension Strategy**: Implement a systematic way to register `block_styles` and `editor_styles` for core blocks via the framework, reducing the need for custom blocks and improving maintainability.
- [x] **Default Layout Components**: Add a `Layout_Provider` component to WP Rig core to handle common modern patterns like floating navigation shells and bento grid structures out of the box.

## 3. Asset & Asset Management
- [x] **Unified Icon Registry Component**: Create a core component and PHP helper (e.g., `wprig_icon()`) that loads SVGs from a dedicated folder. This eliminates dependence on external icon fonts and improves performance.
- [x] **Asset Localization Utility (`rig:localize`)**: Implement a CLI utility that scans the theme for external image URLs, downloads them to `assets/images/`, and updates the source code references automatically.

## 4. Automation & Developer Experience
- [x] **Methodical CSS Workflow for AI**: Encourage AI agents to start CSS work in a single new file, then refactor after visual confirmation. This reduces cognitive overhead caused by WP Rig's distributed CSS architecture.
- [x] **Fluid Typography Generator**: Implement a build-step or PHP utility that generates responsive `clamp()` typography scales automatically based on the `fontSizes` defined in `theme.json` or `tokens.json`.
- [x] **Visual Regression Hook**: Integrate a Playwright-based `screenshot-compare` script. This tool should compare the live site against a mockup image and provide a fidelity score to ensure design accuracy during development.

---
*Created on: April 26, 2026*
*Source: AI Experiment Reports (Optimus Primary)*
