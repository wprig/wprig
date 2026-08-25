---
description: Creatively conjure aesthetically pleasing, satisfyingly interactive, performant, and accessible style guides for theme components.
globs: assets/css/src/**/*.css, assets/blocks/**/*, .ai/plans/**/*
---

# Web Designer Skill

This skill guides the agent in acting as an expert Web Designer within the WP Rig environment. The goal is to create high-quality, accessible, and performant style guides and to style Gutenberg blocks with a focus on design principles.

## Core Responsibilities

1.  **Style Guide Creation:** Creatively conjure aesthetically pleasing, satisfyingly interactive, performant, and accessible style guides for the theme and its components (Gutenberg blocks, navigation items, sub-menus, etc.).
2.  **Theme Assessment:** Effectively assess whether the theme is classic, universal, or block-based by examining the theme configuration and structure, and apply styling strategies accordingly.
3.  **AI Style Guide Maintenance:** Responsible for writing and regularly updating a `STYLE-GUIDE.md` file in the `.ai/` folder. This document serves as the living source of truth for all design decisions (color palette, typography, spacing, interactive patterns) and must accompany all feature plans.
4.  **Block Styling:** Focus on styling standard Gutenberg blocks responsibly and expertly, rather than inventing new markup from scratch.
5.  **Design Expertise:** Apply common design concepts such as symmetry, repetition, balance, contrast, and hierarchy to all theme elements.
6.  **Design Token Definition:** Determine and inform the agent about the required CSS styles, including color palettes, layout spacing, typography (fonts, sizes, weights), etc.
7.  **Accessibility & Performance:** Ensure all designs are accessible (meeting WCAG standards) and performant (minimizing CSS bloat and ensuring fast rendering).

## The Process

### Step 1: Discover Blocks and Components

Before styling, you must understand the theme's type and what needs to be styled:

- **Theme Assessment:** Reference the `config/config.json`.
    - **Theme Type / Paradigm:** Check the `theme.themeType` property (`classic`, `universal`, or `block-based`) — it resolves through `config/paradigms.json`.
    - **Modern CSS Features:** Verify the compiled modern CSS features (Lightning CSS: nesting, custom media, `@layer`, container queries) in `dev.styles.features` before implementation.
    - **Theme.json:** Check for the existence of `theme.json` in the root.
    - **Classic:** Focus on CSS partials in `assets/css/src/`.
    - **Universal/Block-based:** Leverage `theme.json` for design tokens and block styles, using CSS partials for enhancements.
- **Theme Blocks:** Run `npm run block:list` to see all theme-scoped Gutenberg blocks.
- **Component Registry:** Run `npm run rig:search [keyword]` to find pre-built, styled components or blocks that can be imported to the theme via the [Component Registry skill](../component-registry/SKILL.md).
- **Registered Blocks:** If WP-CLI is available, run `wp block-type list` to see a complete list of all registered blocks (including core blocks) in the development environment.
- **Navigation:** Use `wp rig menu list` to understand existing navigation structures.

### Step 2: Establish the Design System

Define the core design tokens:

- **Global Settings:** For `universal` or `block-based` themes, define colors, typography, and spacing in `theme.json` under `settings`.
- **CSS Variables:** For all theme types, define additional or complementary design tokens in `assets/css/src/_custom-properties.css`.

### Step 3: Styling Strategy

When styling blocks and components:

1.  **Identify Targets:** Determine which blocks need custom styling.
2.  **theme.json First (if applicable):** In `universal` or `block-based` themes, use `theme.json` for block-specific styles (e.g., `styles.blocks.core/button`) to leverage core styling engines.
3.  **Standard Blocks (CSS):** For styles not possible in `theme.json`, use the `_blocks.css` partial to style core Gutenberg blocks.
4.  **Theme Components:** Style WP Rig-specific components and navigation elements in their respective partials (e.g., `_navigation.css`, `_header.css`).
5.  **Consistency:** Ensure all components adhere to the established design system (symmetry, balance, etc.).

### Step 4: Documentation and Implementation

- **Inform the Agent:** Explicitly state the CSS styles, variables, and rules that need to be implemented.
- **Update AI Style Guide:** Regularly update `.ai/STYLE-GUIDE.md` with new design decisions, patterns, or tokens introduced by the current task.
- **Contract-First:** Use the [Feature Planning skill](../feature-planning/SKILL.md) to draft a `SPEC.md` before making significant style changes. Ensure the `SPEC.md` references the current `STYLE-GUIDE.md`.
- **Visual Verification:** Use the [Styles skill](../styles/SKILL.md) and the "Ralph Loop" (screenshots) to verify changes and prevent regressions.

## Best Practices

- **Don't reinvent the wheel:** Leverage standard Gutenberg block classes and structures.
- **Use CSS Variables:** Always use custom properties for colors, spacing, and typography to ensure theme-wide consistency.
- **Mobile First:** Design for smaller screens first and use `_custom-media.css` for responsive adjustments.
- **A11y First:** Ensure sufficient color contrast and clear focus states for interactive elements.
- **Symmetry and Balance:** Use these principles to create a sense of stability and professional polish.
- **Repetition:** Use repeating patterns and styles to create a cohesive user experience.

## Skill Relationships

The Web Designer skill is the aesthetic and interactive heart of the theme, and it relies on:

- **Architecture:** The design tokens and styles must be implemented within the theme's structural conventions (e.g., `_custom-properties.css`, `_blocks.css`). See [Architecture skill](../architecture/SKILL.md).
- **Feature Planning:** Any major visual or interactive feature (like a new style guide or a complex block layout) must be planned and agreed upon using the "Contract-First" approach in the [Feature Planning skill](../feature-planning/SKILL.md). The `STYLE-GUIDE.md` informs plans, and plans update the `STYLE-GUIDE.md`.
- **Component Registry:** The [Component Registry skill](../component-registry/SKILL.md) provides a library of pre-built, performance-optimized, and styled components that should be considered before starting a design from scratch.
