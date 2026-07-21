# WP Rig AI Agents Guide

Welcome, AI Agent! WP Rig is a modern, highly opinionated theme development framework. To ensure a seamless experience, you **MUST** follow these 5 core pillars.

---

### 1. ONBOARDING & STATE PROTOCOL
Before starting, check `.ai/agent-state.md` for your status:
- **If Pending:** Follow [**The Onboarding Guide**](.ai/ONBOARDING.md) (run `npm run ai:setup` once, read [**Developer Directions**](.ai/developer-directions.md), read/initialize [**Project Rules**](.ai/PROJECT_RULES.md), and mark state as Completed).
- **If Completed:** Read [**Project Rules**](.ai/PROJECT_RULES.md) for any dynamic, self-learned theme conventions, and keep it updated with new architectural decisions. Proceed directly to the user's task. Do NOT re-run setup.

### 2. ARCHITECTURE & BUILD PIPELINE
- **Source Files Only:** NEVER edit compiled artifacts (`.min.css`, `.min.js`, etc.). Edit only source files under `src/` directories. See [**Architecture Skill**](.ai/skills/architecture/SKILL.md).
- **Scaffolding Tooling:** Use existing scripts (like `npm run create-rig-component` or block commands) rather than manually bootstrapping files. See [**Component Registry**](.ai/skills/component-registry/SKILL.md).

### 3. CONTRACT-FIRST DEVELOPMENT
- Do not modify source files without an approved plan. You must author a `SPEC.md` in `.ai/plans/` and ask clarifying questions first to reach a >95% confidence score. See [**Feature Planning Skill**](.ai/skills/feature-planning/SKILL.md).

### 4. CONFIGURATION & CONTENT FIRST
- **Configuration First:** Reference `config/config.json` before making build or architectural changes.

### 5. PRE-FLIGHT QUALITY CHECK
- Run `npm run ai:check` before submitting to ensure compliance with PHPCS, PHPStan, ESLint, and Stylelint. See [**Code Quality skill**](.ai/skills/code-quality-standards/SKILL.md).

---

## AI Agent Skills (`.ai/skills/`)
Refer to specialized skills in the `/.ai/skills/` directory for step-by-step recipes:
- [**Onboarding Guide**](.ai/ONBOARDING.md): First-time setup protocol.
- [**Developer Directions**](.ai/developer-directions.md): Custom requirements from the theme developer.
- [**Project Rules & Learned Guidelines**](.ai/PROJECT_RULES.md): Discovered theme architecture, custom patterns, and running learning log maintained by the agent.
- [**Feature Planning**](.ai/skills/feature-planning/SKILL.md): Strategy for planning specs and clarifications.
- [**Architecture & Conventions**](.ai/skills/architecture/SKILL.md): Core structures and conventions.
- [**Code Quality Standards**](.ai/skills/code-quality-standards/SKILL.md): Linting, PHPStan, and formatting.
- [**npm Scripts**](.ai/skills/npm-scripts/SKILL.md): Using the build and utility scripts.
- [**Styles & CSS**](.ai/skills/styles/SKILL.md): CSS partials, variables, and the build process.

*Additional skills for specific tasks (like Gutenberg blocks, Customizer settings, Playwright E2E tests) can be found under `/.ai/skills/`.*

## Capabilities & Tooling
- **WP Rig Docs (MCP)**: Run `npm run mcp` to access the Model Context Protocol server.
- **Verification**: Run `npm run ai:check` for comprehensive linting and end-to-end regression validation.
