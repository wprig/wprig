---
description: Mandatory self-review protocol for AI agents to follow before concluding any coding task or pull request phase.
globs: *
---

# Agent Self-Code Review Protocol

## When to use
You **MUST** run this skill proactively before telling the user "I have finished the task," before asking to move on to the next phase of a multi-step plan, or before authoring a Pull Request. This prevents unintended regressions, deleted docblocks, and broken tests.

## 1. Diff Analysis (The "Oops" Check)
Before doing anything else, you must review exactly what you changed.
```bash
git status
git diff
```
**Look specifically for:**
- **Unintended Deletions:** Did a regex or `sed` command accidentally delete PHP docblocks (`/** ... */`)? This breaks WP-CLI commands and WordPress hook documentation.
- **Scope Creep:** Did you modify files outside the scope of the user's request?
- **Hardcoded Values:** Did you hardcode local URLs (like `http://wprig.test`), absolute machine paths (`/Users/name/...`), or temporary debug logging?
- **Core vs. Edge:** If building an optional feature (like WP.org theme directory compliance), did you accidentally force those strict defaults onto the core WP Rig starter framework?

## 2. Automated Cleanup & Linting
Do not leave spacing, formatting, or basic syntax errors for the user to catch. Run the auto-fixers.
```bash
# Fix PHP formatting and modernize code
composer fix

# Fix JS/TS formatting
npm run lint:js -- --fix

# Fix CSS formatting
npm run fix:css
```

## 3. Unit & Integration Testing
Ensure you haven't broken the build or the internal logic.
```bash
# Test Node.js build scripts and CLI tools
npm run test:scripts

# Test PHP backend logic
composer test:unit

# (Optional, if UI was changed) Test E2E/A11y
# Note: Ensure local dev server is running first
npm run test:e2e
```

## 4. Temporary File Cleanup
Did you create any `update-script.php`, `test.js`, or `dummy.xml` files in the root to accomplish your task? 
- Check `git status` for untracked files.
- Delete any temporary scaffolding or data-dump files before completing the task.

## 5. Final Sanity Check
If a test failed or a linter threw an unfixable error, **you are not done**. Fix the underlying issue. Only present the work to the user once `git diff` looks intentional and tests are green.
