# WP Rig AI Agent Onboarding Guide

Welcome, AI Developer! This guide helps you get up to speed with WP Rig efficiently and safely, ensuring you do not waste tokens, time, or perform redundant setup tasks.

## 🚀 The Onboarding Workflow

When you first enter this workspace or after a context reset, follow this step-by-step onboarding protocol:

### Step 1: Check Agent State
Check the `.ai/agent-state.md` file.
- **If Onboarding Status is already "Completed"**: Stop! Do NOT run setup or perform initial exploration. Proceed directly to the user's task.
- **If Onboarding Status is "Pending"**: Proceed to Step 2.

### Step 2: Initialize AI Setup (First-Time Only)
If your specific agent configuration file (e.g. `GEMINI.md` for Gemini CLI, `CLAUDE.md` for Claude Code, `.cursorrules` for Cursor, etc.) does not exist in the root directory:
1. Explain that you are running the setup command to configure your files.
2. Run `npm run ai:setup` and select your agent from the list.
3. This will copy the core agent instructions to your agent-specific rules file in the root, and automatically download the headless Playwright Chromium browser binaries so visual inspection tools are fully operational.

### Step 3: Read Developer Directions
Open and read `.ai/developer-directions.md`. This file contains project-specific guidelines, aesthetic rules, styling preferences, and constraints set by the theme developer. You **MUST** strictly adhere to any rules found there.

### Step 4: Map the Workspace & Initialize Project Rules
Analyze the codebase to understand the theme's specific configuration:
1. Read `config/config.json` to identify the theme type (e.g., Block-based or Classic), enabled supports, and other settings.
2. Read `package.json` to understand the build tooling and configured linter scripts.
3. Open `.ai/PROJECT_RULES.md` and fill out the initial sections: **Discovered Theme Configuration** and **Discovered Design System & Tokens** with your findings. This bootstraps the self-learning memory for future agents!

### Step 5: Update Agent State
Once the above steps are complete, update `.ai/agent-state.md` with:
- **Status**: Completed
- **Last Agent**: [Your Agent Name]
- **Last Updated**: [Current Date]
- Under **Completed Steps**, check off all the completed tasks.
- Add an entry under **Agent Log** noting your onboarding and the initialization of `.ai/PROJECT_RULES.md`.

---

## 🛠️ Key Developer Resources

To ensure your work aligns with WP Rig's high engineering standards, always utilize these specialized resources:

1. **Project Rules (`.ai/PROJECT_RULES.md`)**:
	- The active running log of discovered guidelines, local custom patterns, and major architectural decisions made during development. Check this frequently!
2. **AI Agent Skills (`.ai/skills/`)**:
	- Step-by-step recipes and guides for common tasks (e.g., [**Feature Planning**](.ai/skills/feature-planning/SKILL.md), [**Architecture**](.ai/skills/architecture/SKILL.md), [**Styles & CSS**](.ai/skills/styles/SKILL.md)).
3. **WP Rig Documentation (MCP)**:
	- Run `npm run mcp` to search and retrieve official documentation using the integrated Model Context Protocol server.
4. **Automated Tooling**:
	- Use `npm run create-rig-component` to scaffold new components.
	- Use `npm run ai:check` before submitting any PR to validate coding standards.
