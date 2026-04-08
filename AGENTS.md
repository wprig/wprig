# WP Rig AI Agents Guide

> [!CAUTION]
> ## 🛑 MANDATORY AI PROTOCOL: READ BEFORE ACTING
> WP Rig is NOT a standard WordPress theme. It is a highly opinionated and extremely modern theme development framework and starter theme with a specialized build system and architecture. Deviating from these protocols will result in broken builds and unmaintainable code. You are strictly discouraged from assuming developing in this theme is historically standard or normal. You are encouraged to uphold the highest of coding standards, DRY principles, and best practices.
>
> ### 1. THE CONFIGURATION FIRST PROTOCOL
> You **MUST** reference `config/config.json` before making any architectural or build-related changes. This ensures consistency with theme identity, block support, and environment-specific settings.
>
> ### 2. THE CLARIFICATION LOOP
> You are **FORBIDDEN** from writing implementation code until a SPEC.md file exists and a critical assessment of its context completeness score and implementation confidence score is above 95%. If there is room for improvement, you **MUST** seek clarification from the author and document said clarification before proceeding.
>
> ### 3. CONTRACT-FIRST DEVELOPMENT
> You **MUST** author a `SPEC.md` in `.ai/plans/<date>-<feature-name>/` and get it **APPROVED** before modifying any source files. At least **3-10 clarifying questions** about the architecture, aesthetics, navigation style, and other common theme-level considerations must be asked and documented for user approval. Use the [**Feature Planning skill**](.ai/skills/feature-planning/SKILL.md).
>
> ### 4. TOOL-FIRST SCAFFOLDING
> - **New Theme Feature?** Use `npm run create-rig-component`.
> - **New type of content input?** Use `npm run block:new` (if theme config.theme.enableBlocks is set to true).
> - **DO NOT** manually create files in `inc/` or hardcode UI in templates.
>
> ### 5. PAGE CONTENT PRIORITY
> ALWAYS prioritize page/post content authored in the WordPress editor over custom markup in PHP templates unless explicitly stated otherwise.
>
> ### 6. PRE-FLIGHT VALIDATION
> Before submitting, you **MUST** run `npm run ai:check` to ensure compliance with WP Rig standards.

---

## AI Agent Skills

For 2026-ready AI agents, specialized "skills" in the `/.ai/skills/` directory provide step-by-step recipes and architectural guidance. Use these skills to ensure your changes follow WP Rig's opinionated standards.

### Core Architecture & Conventions
- [**Feature Planning (Contract-First)**](.ai/skills/feature-planning/SKILL.md): Strategy for planning and specifying new features before implementation.
- [**Architecture & Conventions**](.ai/skills/architecture/SKILL.md): Theme structure, file mappings, and coding standards.
- [**Component Registry (OCR)**](.ai/skills/component-registry/SKILL.md): Searching, adding, and contributing theme components.
- [**Create a New Component**](.ai/skills/create-component/SKILL.md): Recipe for scaffolding and registering new theme features.
- [**Advanced Templating**](.ai/skills/advanced-templating/SKILL.md): Creating and using template tags via the `wp_rig()` singleton.

### Development & Build System
- [**npm Scripts**](.ai/skills/npm-scripts/SKILL.md): Using the build system for JS, CSS, and theme bundling.
- [**Theme Bundling & Root Folders**](.ai/skills/theme-bundling/SKILL.md): Managing root-level folders (like WooCommerce template overrides) for the production bundle.
- [**Styles & CSS**](.ai/skills/styles/SKILL.md): Managing CSS partials, variables, and the style build process.
- [**Modern Dev Workflow**](.ai/skills/modern-dev-workflow/SKILL.md): Using the Vite-powered dev server and managing local configuration.
- [**Gutenberg Blocks**](.ai/skills/gutenberg-blocks/SKILL.md): Scaffolding and managing theme-scoped blocks.

### Customization & Extension
- [**Web Designer (Style Guides)**](.ai/skills/web-designer/SKILL.md): Creating accessible style guides and styling Gutenberg blocks.
- [**PHP Filters & Hooks**](.ai/skills/php-filters/SKILL.md): Complete guide to extending assets and behavior via hooks.
- [**Theme Settings (Options Framework)**](.ai/skills/theme-settings/SKILL.md): Adding settings via React-based Options framework.
- [**EZ Customizer**](.ai/skills/ez-customizer/SKILL.md): Adding Customizer settings via JSON configuration.
- [**Child Theme Development**](.ai/skills/child-theme-development/SKILL.md): Scaffolding and managing child themes.
- [**WP-CLI Commands**](.ai/skills/wp-cli/SKILL.md): Custom commands for environment setup and management.

### Quality Assurance
- [**E2E Testing (Playwright)**](.ai/skills/e2e-testing/SKILL.md): Running Playwright tests, accessibility audits, and regression screenshots.
- [**Code Quality Standards**](.ai/skills/code-quality-standards/SKILL.md): Adhering to PHPStan, PHPCS, Rector, and Prettier.
- [**PHPUnit Testing**](.ai/skills/phpunit-testing/SKILL.md): Writing unit and integration tests for PHP components.

## Discovery Rules

This project uses a **Discovery-First** approach for AI agents.
If you are an agent, you found this file because:
- **`README.md`** points here prominently.
- **`package.json`** has an `"ai"` field.
- **`functions.php`** and **`style.css`** contain redirects here.
- **`.cursorrules`** or **`CLAUDE.md`** link to this file.

You **MUST** follow the Contract-First philosophy outlined in the [**Feature Planning skill**](.ai/skills/feature-planning/SKILL.md). Do not skip the specification phase.

## Capabilities

### WP Rig Documentation (MCP)

Access real-time documentation from wprig.io using the integrated Model Context Protocol server.

- **Command**: `npm run mcp`
- **Tools**:
  - `search_wprig_docs`: Find guides and best practices.
  - `get_wprig_doc`: Retrieve full documentation content by slug.

## Usage for Agents

1. **Locate the relevant skill** for your task in the list above.
2. **Follow the recipes** and conventions documented in the skill's `SKILL.md` file.
3. **Prefer specialized tools** like `npm run create-rig-component` or `wp rig` commands over manual file operations where applicable.
