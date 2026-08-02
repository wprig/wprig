# SPEC-001: Automated Version Promotion

## 1. Problem Statement
Updating the theme version in WP Rig is currently a manual process that involves editing multiple files (`package.json`, `style.css`, `readme.txt`, `CHANGELOG.md`). This is prone to human error and inconsistency.

## 2. Proposed Solution
Implement a new CLI command `npm run rig version <new-version>` that:
1. Validates the version format (SemVer).
2. Updates `package.json`.
3. Updates `style.css`.
4. Updates `readme.txt` (Stable tag).
5. Updates `CHANGELOG.md` (adds a new header or updates the latest one).
6. Provides a summary of changes.

## 3. Implementation Details
### 3.1 CLI Command
- Entry point: `scripts/rig.js`
- Command: `version <new-version>`
- Options:
    - `--description`: Optional description to add to the changelog.

### 3.2 File Updates
- `package.json`: Update `"version"` field.
- `style.css`: Replace `Version: <old-version>` with `Version: <new-version>`.
- `readme.txt`: Replace `Stable tag: <old-version>` with `Stable tag: <new-version>`.
- `CHANGELOG.md`: 
    - If a section for the new version doesn't exist, insert it at the top (after the main header).
    - If it exists, skip or update.

### 3.3 New Skill
Create `.ai/skills/version-management/SKILL.md` to document the process and the use of the new command.

## 4. Verification Plan
1. Run `npm run rig version 3.4.2` (to complete the current bump).
2. Verify all files are updated correctly.
3. Run linting to ensure no formatting issues were introduced.

## 5. Questions & Risks
- **Changelog Formatting**: The changelog has a specific style. The script should try to match it.
- **Git integration**: Should we auto-commit? *Decision: No, let the user review and commit manually.*
