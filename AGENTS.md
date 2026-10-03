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
- **Gutenberg Local Authoring:** ALWAYS use our local WP-CLI Gutenberg Bridge for block schema discovery and compiling block markup. NEVER write complex Gutenberg HTML comments manually. See [**Gutenberg Local Authoring Skill**](.ai/skills/flawless-gutenberg-fse/SKILL.md).

### 3. CONTRACT-FIRST DEVELOPMENT
- Do not modify source files without an approved plan. You must author a `SPEC.md` in `.ai/plans/` and ask clarifying questions first to reach a >95% confidence score. See [**Feature Planning Skill**](.ai/skills/feature-planning/SKILL.md).

### 4. CONFIGURATION & CONTENT FIRST
- **Configuration First:** Reference `config/config.json` before making build or architectural changes.

### 5. PRE-FLIGHT QUALITY CHECK
- Run `npm run ai:check` before submitting to ensure compliance with PHPCS, PHPStan, ESLint, and Stylelint. See [**Code Quality skill**](.ai/skills/code-quality-standards/SKILL.md).

---

## Day-to-Day Command Shortlist

The full `package.json` has ~90 scripts (e2e, perf, bundle, audit, component registry, …). For day-to-day theme editing you only need these — check here **before** assuming a build command from file exploration:

| Command | What it does |
| --- | --- |
| `npm run dev` | Build the dev theme + watch everything (all-in-one loop) |
| `npm run build` | One-shot dev build, no watch |
| `npm run build:css` | Compile CSS once (Lightning CSS; prints a summary line) |
| `npm run dev:css` | Same, unminified + sourcemaps |
| `npm run watch:css` | Compile CSS, then recompile on every save |
| `npm run dev:js` / `npm run watch:js` | Same cycle for JS |
| `npm run lint:css` / `npm run lint:blocks` | Fast targeted linting |
| `npm run rig:tokens` | Regenerate `theme.json` + CSS vars from `config/tokens.json` |

Full reference: [`docs/commands.md`](./docs/commands.md), or run `npm run` (no args) to list every script.

---

## AI Agent Skill Directory
Refer to [**.ai/SKILLS.md**](.ai/SKILLS.md) for a comprehensive directory of specialized skills, including:
- **Foundational Pillars:** Architecture, Feature Planning, Code Quality.
- **Design & UI:** Styles, Typography, Gutenberg Blocks, Hero Canvas.
- **Logic & Backend:** Advanced Templating, WP-CLI, PHP Filters.
- **Quality & Workflow:** Testing (PHPUnit/E2E), Modern Dev Workflow.

## Capabilities & Tooling
- **WP Rig Docs (MCP)**: Run `npm run mcp` to access the Model Context Protocol server.
- **Verification**: Run `npm run ai:check` for comprehensive linting and end-to-end regression validation.
