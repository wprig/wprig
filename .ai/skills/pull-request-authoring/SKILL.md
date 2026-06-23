---
description: Workflow for creating WP Rig pull requests that match the repository template, including release-specific guidance for develop-to-master merges.
globs: .github/PULL_REQUEST_TEMPLATE.md, CHANGELOG.md, docs/**/*.md
---

# Pull Request Authoring for WP Rig

Use this skill whenever you need to open a pull request in WP Rig and want a consistent, review-ready result.

## Required Sources

Before drafting the PR, review:

1. `.github/PULL_REQUEST_TEMPLATE.md` (required structure).
2. `CHANGELOG.md` (release/version context).
3. Release notes/highlights docs when available (for example, `../docs/content/wprig-v3-4-release-highlights.md` in this local workspace).

## Standard PR Workflow

### 1) Collect Inputs

- `head` branch and `base` branch.
- Issue/ticket number.
- What changed (high-level), how it solves the issue, and why it is safe.
- Testing evidence.

### 2) Pre-flight Checks

- Confirm no duplicate open PR exists for the same `head` -> `base` pair.
- Ensure the PR title is explicit and action-oriented.
- For release merges, avoid generic titles like `Merge develop into master`; use a version-led release headline.
- Keep the body concise and mapped to the repository template sections.

### 3) Fill the Template Exactly

Mirror `.github/PULL_REQUEST_TEMPLATE.md`:

- `## Description`
  - Include `Addresses issue #...`
  - Summarize what changed, how it solves the issue, and why this implementation was chosen.
- `## List of changes`
  - Check the relevant change type(s): bug fix, new feature, breaking change.
- `## Checklist`
  - Mark items only when truly completed (ticket relation, tested, changelog entry, WP Rig inclusion intent).

## Special Workflow: `develop` -> `master` PRs

For release merges from `develop` into `master`, you **must** add explicit release context.

### Required Release PR Title

Use this exact pattern for the PR title:

`v<version> - <release headline>`

Examples:

- `v3.3 - Agent Ready`
- `v3.4 - Faster by Default, Smarter to Extend, Safer to Scale`

Title rules:

1. Start with the release version (`v3.4` or `v3.4.0`, matching `CHANGELOG.md`).
2. Add a short, human-readable release headline that reflects the version goals.
3. Keep it concise (roughly 3-8 words after the dash when possible).
4. Do **not** use branch-only titles like `Merge develop into master`.

### Required Release Context

Add a `### Release Context` subsection under `## Description` that includes:

1. **Version Number**
   - State the target release version explicitly (example: `v3.4.0`).
   - Verify against the top unreleased/target section in `CHANGELOG.md`.
2. **Version Goals**
   - Include 2-5 bullets describing the goals of that version.
   - Source these goals from release highlights documentation when available.
3. **Release Scope Summary**
   - Briefly summarize major themes included in the merge (for example: performance, component lifecycle, security/tooling hardening).

If release highlights are missing, derive goals from changelog themes and clearly label them as synthesized from `CHANGELOG.md`.

## Reusable PR Body Templates

### Standard Feature/Fix PR

```md
## Description
Addresses issue #<issue-number>

<what changed>
<how it solves the issue>
<why this approach is appropriate>

## List of changes
- [x] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)

## Checklist:
- [x] This pull request relates to a ticket.
- [x] This code is tested.
- [x] This change has been added to CHANGELOG.md
- [ ] I want my code added to WP Rig.
```

### `develop` -> `master` Release PR

```md
Title: v<version> - <release headline>

## Description
Addresses issue #<issue-number-or-release-tracker>

This PR merges `develop` into `master` for the `v<version>` release.

### Release Context
- **Version:** `v<version>`
- **Goals for v<version>:**
  - <goal 1>
  - <goal 2>
  - <goal 3>
- **Release scope summary:** <one short paragraph or 2-4 bullets>

## List of changes
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)

## Checklist:
- [x] This pull request relates to a ticket.
- [x] This code is tested.
- [x] This change has been added to CHANGELOG.md
- [x] I want my code added to WP Rig.
```

## Final Quality Gate

Before creating the PR, verify:

1. Template sections are present and complete.
2. `develop` -> `master` PRs include both version number and version goals.
3. `develop` -> `master` PR title follows `v<version> - <release headline>`.
4. Claims in the PR are traceable to `CHANGELOG.md`, release notes, and executed tests.
