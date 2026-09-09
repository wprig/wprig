---
description: Bake Site Editor changes (patterns, templates, template parts, Global Styles, Font Library fonts) from the WordPress database into the active WP Rig block theme with rig:bake, review them as a git diff, and clean the DB records — the Site Editor version-control round-trip.
globs: ["patterns/**", "templates/**", "parts/**", "config/user-styles.json"]
---

# SKILL: Site Editor Bake & Sync (`rig:bake`)

## Overview

WP Rig block-theme (universal / block-based) work often happens in the Site
Editor — but the editor saves to the **database**, not to git. `rig:bake`
(vendored from [wp-theme-control](https://github.com/bacoords/wp-theme-control))
moves that work into the theme's files so it can be diffed, reviewed, and
committed. Baked Global Styles land in `config/user-styles.json`, which
`rig:tokens` merges into `theme.json` — so baked work is never clobbered by
token regeneration.

**Gates:** this workflow refuses to run unless `theme.themeType` is
`universal` or `block-based` (tag: `block-based`), and upstream refuses when
the active theme is not a block theme (`wp_is_block_theme()`).

## The round-trip loop (always in this order)

1. **Clean tree.** `git status` must be clean. A bake is meant to be reviewed
   as a diff; baking over uncommitted work destroys the review.
2. **Plan first — always.**

   ```bash
   npm run rig:bake:plan
   ```

   Read-only inventory: what DB customizations exist, which files would be
   written, collision warnings. Present this to the developer before writing.

3. **Bake (review-first).**

   ```bash
   npm run rig:bake          # all scopes; does NOT clean the DB
   ```

   Writes `patterns/*.php`, `templates/*.html`, `parts/*.html`,
   `assets/fonts/<slug>/`, and `config/user-styles.json`. Every write is
   recorded in a TSV manifest (`.wp-theme-control/runs/`, gitignored) with a
   sha256 of the written file. Baked patterns carry a `Baked: yes` header and
   a namespaced `Slug: <theme>/<slug>`.

4. **Inspect the diff.** Review every written file. `npm run lint:patterns`
   and `npm run lint:blocks` must pass (baked files get a tolerance profile,
   but broken markup still fails).

5. **Commit** the reviewed files.

6. **Clean the DB — only after the commit.**

   ```bash
   npm run rig:bake:clean -- .wp-theme-control/runs/<run>/manifest.tsv
   ```

   Deletes only records whose exported files still match the manifest hash.
   Alternatively bake with upstream's `--clean` when the developer explicitly
   asked for bake-and-clean in one step.

## Scopes

| Command | Writes |
| :--- | :--- |
| `npm run rig:bake:plan` | nothing |
| `npm run rig:bake patterns` | unsynced user-created patterns → `patterns/` |
| `npm run rig:bake templates` | custom templates/parts → `templates/`, `parts/` (runtime-URL content patternizes to `patterns/hidden-*.php`, `Inserter: no`) |
| `npm run rig:bake fonts` | Font Library activations → `assets/fonts/<slug>/` + `config/user-styles.json` `fonts` block |
| `npm run rig:bake styles` | user Global Styles → `config/user-styles.json` (NOT theme.json) |
| `npm run rig:bake` | fonts → templates → styles → patterns, in order |

Passthrough flags: `--path=`, `--url=`, `--user=`, `--state-dir=`,
`--dry-run`, `--clean`, `--force` (e.g. `npm run rig:bake -- --dry-run`).

## What is tracked vs generated

| Path | Git | Note |
| :--- | :--- | :--- |
| `patterns/*.php`, `templates/*.html`, `parts/*.html` | tracked | real source files now |
| `assets/fonts/<slug>/**` | tracked | font files copied out of the Font Library |
| `config/user-styles.json` | tracked | the baked Global Styles layer |
| `theme.json` | gitignored | still generated — **only** by `rig:tokens`, which merges the overlay last |
| `.wp-theme-control/**` | gitignored | manifests + backups (machine-local) |

## Safety rules (non-negotiable)

- `plan` before every write unless the developer explicitly asked to skip it.
- Never bake over a dirty working tree.
- Never hand-edit `config/user-styles.json` while the DB Global Styles post
  still holds the same changes — re-bake instead, or clean first. After a
  clean, hand-editing (or hand-authoring) the overlay is fine; `rig:tokens`
  will honor it.
- `--force` bypasses only the file-hash check, never record-type checks.
  Treat upstream collision refusals as questions to answer, not errors to
  silence.
- The overlay never carries `settings.viewport`, `version`, `$schema`, or
  `settings.blockVisibility` — breakpoints and schema stay tokens-owned.
- `theme.json` cannot hold PHP: if a bake refuses because of local absolute
  URLs in JSON, move that media/link into block markup (templates patternize
  automatically; theme.json does not).
- Media Library files stay in the Media Library (attachment IDs preserved).
  Baked `src` rewrites use runtime PHP expressions (`get_stylesheet_directory_uri()`,
  `wp_get_upload_dir()['baseurl']`, `home_url()`) — nothing else PHP-shaped is
  acceptable in baked files.

## Boundaries

- Synced patterns are **not** migrated (upstream boundary). Distribution
  packaging of baked output is not this tool's job.
- Classic-theme work (`themeType: classic`) never uses this workflow — the
  classic lifecycle has no Site Editor artifacts.
- The tool is a **Node port** (`bin/wp-theme-control/index.js` + `lib/`, no
  bash/jq). Requirements: Node 18+, WP-CLI 3.0+, writable active block theme.
  Windows works natively.

## Reference

- Upstream contract + WP Rig decisions: `.ai/plans/SPEC-015-rig-bake-integration.md`
- Overlay design: `.ai/plans/SPEC-016-user-styles-overlay.md`
- Node port entry point: `bin/wp-theme-control/index.js` (scopes: plan, fonts,
  templates, styles, patterns, clean, all).
