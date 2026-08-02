# SPEC-004: WordPress.org Theme Review Automation

## 1. Problem Statement

WP Rig aims to make themes as prepared as possible for WordPress.org Theme Directory review. Today that intent lives mostly as a long handbook skill (`.ai/skills/theme-review/SKILL.md`) plus fragmented tooling:

- WPCS / ESLint / Stylelint exist, but there is **no Theme Check gate**
- WP-CLI can install Theme Check and import unit test data, but nothing **audits the production bundle**
- E2E a11y/unit-test coverage is thin
- Known directory footguns remain (custom blocks, default `cleanup_meta_tags`, metadata drift)
- The theme-review skill is not an executable agent runbook and contains outdated guidance (WPThemeReview package name/status, CDN policy, incomplete Required handbook coverage)

**Goal:** Build a **submission readiness platform**: one command path that audits the artifact reviewers actually see, mirrors Theme Check + Required handbook automated proxies, encodes WP Rig–specific footguns, and equips AI agents with an executable skill.

---

## 2. Design Principles

1. **Audit the bundle, not the dev tree** — reviewers see a zip, not `scripts/`, `.ai/`, `vendor/`, tests.
2. **Theme Check + Required handbook are source of truth** — do not block the stack on unmaintained WPThemeReview as default.
3. **Severity model** — `REQUIRED` | `WARNING` | `RECOMMENDED` | `INFO`. Exit non-zero only on `REQUIRED` (and optionally `WARNING` via flag).
4. **Starter quality ≠ directory submission** — daily lint stays as-is; `bundle:wporg` / `audit:theme-review` is the submission path.
5. **Machine-readable reports** — agents and CI consume JSON; humans read Markdown summary.
6. **Incremental PRs** — each phase ships usable value without requiring the full dream state.

---

## 3. Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Default PHPCS ruleset | Keep **WPCS 3 + PHPCompatibility**; optional `audit:wpthemereview` later | WPThemeReview (`wpthemereview/wpthemereview`) is stale vs WPCS 3 |
| Theme Check integration | Prefer **WP-CLI + Theme Check plugin** against active/bundled theme; fallback: document admin-only if headless fails | Official gate used by TRT intake |
| Audit target | `--path` defaults to production theme dir when `NODE_ENV=production` / after bundle; else warn that dev-tree results are noisy | Avoid false positives |
| Custom blocks | **REQUIRED fail** if `register_block_type*` / blocks component present in audit path unless `--allow-blocks` | Handbook: custom blocks are plugin territory |
| Performance meta cleanup | Default config change to **`cleanup_meta_tags: false`** for new configs; audit **WARNING/REQUIRED** if non-presentational `remove_action` patterns detected | Handbook forbids removing non-presentational hooks |
| Google Fonts | Allowed per handbook exception; prefer local; remote non-GF CDNs = REQUIRED | Align skill with policy |
| Unit test data | Support **classic** (`themeunittestdata.wordpress.xml`) as primary + **pattern** data as optional secondary | Match TRT practice |
| Report format | `artifacts/theme-review/report.json` + `report.md` | Agent + human |
| CI | New job runs metadata + plugin-territory + banned-files on **checkout** (cheap); full Theme Check optional / manual until WP env available in CI | Pragmatic first CI |

---

## 4. Target Architecture

```
npm run audit:theme-review [--path=<themeDir>] [--format=json|md|both] [--fail-on=required|warning]
        │
        ├─ scripts/theme-review/run.js          (orchestrator)
        ├─ scripts/theme-review/reporters.js
        ├─ scripts/theme-review/checks/
        │     metadata.js
        │     banned-files.js
        │     plugin-territory.js
        │     security-patterns.js
        │     remote-resources.js
        │     i18n-basic.js
        │     license-resources.js      (Phase 2)
        │     theme-json.js             (Phase 3)
        │     phpcs.js                  (wrap existing)
        │     theme-check.js            (WP-CLI bridge)
        │
        └─ artifacts/theme-review/report.{json,md}

npm run bundle:wporg
        → production bundle
        → audit:theme-review --path=<prodTheme> --fail-on=required
        → zip only if audit passes (or zip + fail; see Open Questions)

wp rig review-setup
        → Theme Check, Query Monitor, log-deprecated-notices,
          accessibility-checker, classic unit test import, env options
```

### Severity & exit codes

| Code | Meaning |
|------|---------|
| 0 | No REQUIRED (and no WARNING if `--fail-on=warning`) |
| 1 | Findings at fail threshold |
| 2 | Tooling error (Theme Check missing, path invalid, etc.) |

### Report item shape (JSON)

```json
{
  "generatedAt": "ISO-8601",
  "themePath": "/abs/path",
  "themeSlug": "example",
  "summary": { "required": 0, "warning": 0, "recommended": 0, "info": 0 },
  "findings": [
    {
      "id": "metadata.requires-at-least",
      "severity": "REQUIRED",
      "check": "metadata",
      "message": "style.css missing Requires at least header",
      "file": "style.css",
      "line": null,
      "handbook": "https://make.wordpress.org/themes/handbook/review/required/#9-files",
      "fixHint": "Add `Requires at least: X.X` matching readme.txt"
    }
  ]
}
```

---

## 5. Implementation Phases & PR Plan

### PR-1 — Skill truth + footgun documentation (docs only)

**Title:** `docs(theme-review): correct skill, tier severity, document WP Rig footguns`

**Depends on:** none

**Files:**
- `.ai/skills/theme-review/SKILL.md` — full rewrite structure (keep checklist as appendix)
- `.ai/skills/code-quality-standards/SKILL.md` — fix command names to match real scripts
- `.ai/SKILLS.md` — update blurb if needed
- `CHANGELOG.md` — note under Unreleased

**Work:**
1. Add YAML frontmatter (`description`, optional `globs`).
2. Restructure skill:
   - When to use
   - Severity model
   - Architecture branch (classic / hybrid / block)
   - **Executable runbook** (commands that exist today + “coming in PR-2+”)
   - WP Rig–specific gotchas (blocks, `cleanup_meta_tags`, audit bundle not src)
   - Appendix: checklist aligned to handbook sections 1–14
3. Corrections:
   - Package is `wpthemereview/wpthemereview` (optional/legacy), not default
   - Google Fonts exception
   - Custom blocks = plugin territory (REQUIRED)
   - Classic required: `wp_body_open`, `language_attributes`, `automatic-feed-links`
   - Unit test data: classic primary URL; pattern secondary
   - Privacy, naming, credits, settings/onboarding, banned files
4. Fix code-quality skill commands:
   - `composer run-phpcs` / `composer phpcs-dev`
   - `npm run lint:js` / `lint:css`
   - Remove nonexistent `npm run lint` / `composer check:phpcs` unless we add aliases later

**Acceptance:**
- [ ] Skill is agent-operable (ordered steps, real commands)
- [ ] No incorrect Composer package as required path
- [ ] Footguns explicitly listed

---

### PR-2 — Audit framework + cheap static checks

**Title:** `feat(theme-review): add audit runner with metadata, banned-files, plugin-territory`

**Depends on:** none (can parallel PR-1)

**Files (new):**
- `scripts/theme-review/run.js`
- `scripts/theme-review/reporters.js`
- `scripts/theme-review/lib/fs-walk.js`
- `scripts/theme-review/lib/severity.js`
- `scripts/theme-review/checks/metadata.js`
- `scripts/theme-review/checks/banned-files.js`
- `scripts/theme-review/checks/plugin-territory.js`
- `scripts/theme-review/checks/security-patterns.js`
- `scripts/theme-review/checks/remote-resources.js`
- `scripts/tests/theme-review/*.test.js` (Jest)
- `artifacts/theme-review/.gitkeep` (or gitignore reports, keep dir)

**Files (edit):**
- `package.json` — scripts:
  - `audit:metadata`
  - `audit:banned-files`
  - `audit:plugin-territory`
  - `audit:theme-review` (orchestrator; Phase 2 subset first)
- `.gitignore` — ignore `artifacts/theme-review/report.*` if desired

**Check details:**

#### `metadata.js`
- Parse `style.css` headers: Theme Name, Description, Version, Author, Requires at least, Tested up to, Requires PHP, License, License URI, Text Domain, Tags
- Parse `readme.txt` Stable tag / Requires / Tested / License
- Cross-check Version ↔ Stable tag, text domain ↔ directory slug (basename of path)
- Screenshot exists; dimensions ≤ 1200×900 and ~4:3 (use `sharp` already in deps)
- REQUIRED if critical headers missing; WARNING for Recommended-only drift

#### `banned-files.js`
Walk theme path; flag handbook-banned patterns:
`.git`, `.svn`, `__MACOSX`, `thumbs.db`, `desktop.ini`, `php.ini`, `error_log`, `web.config`, `*.sql`, `*.sh`, nested `*.zip`, `favicon.ico`, free-floating `.xml` (allow `phpcs.xml*`, `wpml-config.xml`, `loco.xml`)

#### `plugin-territory.js`
Scan `.php` (and built block PHP if present) for:
- `register_post_type` / `register_taxonomy`
- `add_shortcode`
- `register_block_type` / `register_block_type_from_metadata` / `wp_register_block_types_from_metadata_collection`
- TGMPA / `TGM_Plugin_Activation` / plugin installer patterns
- Severity: REQUIRED (blocks optional override via env `WPRIG_ALLOW_THEME_BLOCKS=1` or CLI flag)

#### `security-patterns.js`
- `eval(`, `base64_decode(`, `base64_encode(`, `gzuncompress(`, `str_rot13(`, create_function, shell_exec/system/passthru (context-aware; avoid vendor false positives by only scanning theme path)

#### `remote-resources.js`
- Detect common CDN hosts in php/css/js/html (cdnjs, jsdelivr, unpkg, bootstrapcdn, fontawesome kits, etc.)
- Allow `fonts.googleapis.com` / `fonts.gstatic.com` as WARNING or INFO (document local preference)
- Other remote script/style URLs = REQUIRED

**Acceptance:**
- [ ] `npm run audit:theme-review` works on theme root and prints summary
- [ ] Jest unit tests for each check with fixture mini-themes under `scripts/tests/theme-review/fixtures/`
- [ ] Exit code 1 when REQUIRED findings present
- [ ] Writes `artifacts/theme-review/report.json`

---

### PR-3 — WP-CLI review setup + Theme Check bridge

**Title:** `feat(theme-review): wp rig review-setup and theme-check audit bridge`

**Depends on:** PR-2 (report format)

**Files:**
- `wp-cli/wp-rig-commands.php` — add:
  - `review_setup` — install/activate: theme-check, query-monitor, log-deprecated-notices, accessibility-checker; import classic unit test data; set posts_per_page=5, thread_comments=1; optionally skip content import with `--skip-import`
  - `theme_check` — run Theme Check programmatically if API allows, or clear instructions + best-effort CLI
  - Align `import_test_data` / `test_setup` to shared private helpers (DRY); classic XML primary
- `scripts/theme-review/checks/theme-check.js` — invoke `wp rig theme_check --path=...` or `wp theme` equivalent; parse output into findings
- `wp-cli/readme.md` — document new commands
- `package.json` — `audit:theme-check`

**Theme Check approach (implementation order):**
1. Ensure plugin installed (`wp plugin is-installed theme-check`).
2. Research current Theme Check PHP API / WP-CLI support in installed version.
3. If no clean CLI: implement `wp rig theme_check` that bootstraps plugin check classes against stylesheet path and prints JSON lines.
4. Map REQUIRED/WARNING/INFO from Theme Check into report findings (`check: theme-check`).

**Acceptance:**
- [ ] `wp rig review-setup` idempotent on a Local/wp-env site
- [ ] `npm run audit:theme-check` produces structured findings or fails with exit 2 + clear “install Theme Check / WP-CLI” message
- [ ] Documented in skill runbook

**Risk:** Theme Check may be admin-UI-centric; budget time for a thin PHP WP-CLI wrapper inside `wp-cli/`.

---

### PR-4 — `bundle:wporg` gate + submission-safe defaults

**Title:** `feat(theme-review): bundle:wporg and safer directory defaults`

**Depends on:** PR-2; PR-3 preferred for full gate

**Files:**
- `package.json` — `bundle:wporg`
- `scripts/tasks/bundle.js` or new `scripts/tasks/bundleWporg.js`
- `scripts/cli.js` — wire command/flags
- `config/config.default.json` — `"cleanup_meta_tags": false`
- `inc/Performance/Component.php` — ensure default array matches (if hardcoded fallback)
- `scripts/theme-review/checks/performance-hooks.js` — detect removal of handbook-listed non-presentational hooks
- `.ai/skills/theme-review/SKILL.md` — document `bundle:wporg`
- `CHANGELOG.md`

**`bundle:wporg` behavior:**
1. `NODE_ENV=production` full bundle (existing pipeline).
2. Resolve production theme path (existing `prodThemePath` / sibling dir logic).
3. Run `audit:theme-review --path=<prod> --fail-on=required`.
4. If Theme Check available, include it; if not, WARNING in report (do not soft-pass REQUIRED static fails).
5. Print path to zip + report.
6. Optional: `--skip-audit` escape hatch for advanced users (prints loud warning).

**Performance check:**
Scan for `remove_action` targets in:
`wp_generator`, `feed_links`, `feed_links_extra`, `wp_resource_hints`, `rsd_link`, `rest_output_link_wp_head`, `wp_oembed_add_discovery_links`, `rel_canonical`, `wp_shortlink_wp_head`, adjacent posts rel, admin bar bump, etc.
- If found in theme PHP: severity **WARNING** initially (WP Rig ships this feature); document that directory submissions should disable `cleanup_meta_tags`.
- Consider elevating to REQUIRED under `bundle:wporg` only when config enables cleanup — implement as REQUIRED when `cleanup_meta_tags` true in effective config **or** when remove_action present in bundled PHP.

**Acceptance:**
- [ ] `npm run bundle:wporg` fails if metadata/plugin-territory REQUIRED issues in **bundle**
- [ ] Default config no longer enables meta tag cleanup
- [ ] Changelog documents breaking default change

---

### PR-5 — i18n + license/resources checks

**Title:** `feat(theme-review): i18n domain audit and readme resources checker`

**Depends on:** PR-2

**Files:**
- `scripts/theme-review/checks/i18n-basic.js`
- `scripts/theme-review/checks/license-resources.js`
- `package.json` — `audit:i18n`, fold into orchestrator
- Tests + fixtures

**i18n-basic:**
- Ensure `Text Domain` header matches slug
- Flag `__()` / `_e()` / `esc_html__` etc. with wrong or missing domain (heuristic regex; document limits)
- INFO if no `.pot` in bundle when `export.generatePotFile` expected

**license-resources:**
- Require `== Resources ==` (or Credits) section in readme.txt when third-party paths detected (`assets/js/vendor`, `assets/css/vendor`, bundled fonts)
- WARNING/REQUIRED based on confidence
- Verify License / License URI present (overlap with metadata)

**Acceptance:**
- [ ] Fixtures cover wrong text domain and missing Resources section
- [ ] Orchestrator includes these checks

---

### PR-6 — Runtime QA: Theme Unit Test E2E expansion

**Title:** `test(theme-review): expand Theme Unit Test and a11y Playwright coverage`

**Depends on:** none for tests; docs depend on PR-1

**Files:**
- `tests/e2e/specs/theme-unit-test.spec.ts` — expand matrix
- `tests/e2e/specs/accessibility.spec.ts` — home, single, search, skip-link, focus visible
- `tests/e2e/specs/theme-review-keyboard.spec.ts` (optional new)
- `.ai/skills/theme-review/SKILL.md` — map tests to checklist items
- `package.json` — optional `audit:accessibility` → playwright subset

**Test matrix (minimum):**
| Test | Asserts |
|------|---------|
| Markup HTML tags page | Loads, h1, axe clean |
| Image alignment page | `.alignleft/right/center` visible without horizontal overflow on mobile viewport |
| Long title / no title | No overflow; permalink present for no-title |
| Sticky post on home | `.sticky` distinguished or present |
| Multipage post | `wp_link_pages` / post pagination links |
| Comments | comment form or list on singular with comments |
| Search empty | `/?s=unlikely-empty-term-xyz` graceful message |
| 404 | body.error404, search or home link, axe |
| Skip link | first focusable, visible on focus, targets main/content |
| Pagination | next/prev on blog with unit test data |

**Acceptance:**
- [ ] Specs skip gracefully with message if unit test content missing (detect missing page → `test.skip`)
- [ ] `wp rig review-setup` then `npm run test:e2e -- theme-unit-test` documented

---

### PR-7 — CI job + agent report polish

**Title:** `ci(theme-review): add theme-review job and fix PHPCS CI step`

**Depends on:** PR-2

**Files:**
- `.github/workflows/ci.yml`
  - Fix php job: run `composer run-phpcs` or `vendor/bin/phpcs` (not unit tests mislabeled)
  - Add `theme-review` job: `npm ci` (or lean install) + `npm run audit:theme-review` on repo theme path with allowlist for known starter WARNINGs **or** run only checks that must pass on starter (banned-files, security-patterns)
- `scripts/theme-review/reporters.js` — GitHub annotations optional (`::error file=`)
- Skill: CI section

**Starter theme policy in CI:**
WP Rig itself is not a finished directory theme. CI should:
- **Fail** on security-patterns + banned-files in paths that would ship in bundle
- **Not fail** the whole monorepo on “Tags incomplete” for the rig slug—or run audits in a **simulated prod slug fixture**

Prefer: unit-test the checks with fixtures (PR-2); CI runs `npm run test:scripts` including theme-review tests + `composer run-phpcs`.

**Acceptance:**
- [ ] CI PHPCS step actually runs PHPCS
- [ ] Theme-review unit tests run in CI
- [ ] No perpetual red job due to starter metadata

---

### PR-8 — Block/hybrid validators (stretch)

**Title:** `feat(theme-review): theme.json schema and HTML template checks`

**Depends on:** PR-2

**Files:**
- `scripts/theme-review/checks/theme-json.js` — JSON parse + optional schema fetch/cache from WP schemas
- `scripts/theme-review/checks/html-templates.js` — basic well-formedness for `templates/`, `parts/`, `patterns/`
- Only active when `theme.json` present or `config.theme.themeType === 'block'`

**Acceptance:**
- [ ] Invalid theme.json → REQUIRED
- [ ] Classic themes without theme.json → checks skipped (INFO)

---

## 6. File / Script Map (end state)

| Script | Purpose |
|--------|---------|
| `npm run audit:theme-review` | Full orchestrator |
| `npm run audit:metadata` | Headers, readme, screenshot |
| `npm run audit:banned-files` | Directory file policy |
| `npm run audit:plugin-territory` | CPT/tax/shortcode/blocks |
| `npm run audit:theme-check` | Official Theme Check bridge |
| `npm run audit:i18n` | Text domain / i18n heuristics |
| `npm run audit:accessibility` | Playwright a11y subset |
| `npm run bundle:wporg` | Bundle + audit gate |
| `wp rig review-setup` | Reviewer environment |
| `wp rig theme_check` | Headless Theme Check |

---

## 7. Skill Rewrite Outline (PR-1 deliverable)

```markdown
---
description: Run and interpret WordPress.org theme review checks for WP Rig themes.
globs: style.css, readme.txt, functions.php, inc/**/*.php, theme.json, templates/**/*, parts/**/*
---

# Theme Review (WP.org)

## When to use
## Severity model
## Architecture branch picker
## WP Rig footguns (read first)
## Runbook (copy-paste)
### A. Static gate
### B. Bundle gate
### C. Reviewer environment
### D. Runtime / E2E
## Interpreting results
## Fix patterns (escaping, prefixing, blocks promote, cleanup_meta_tags)
## Appendix A — Required handbook map
## Appendix B — Accessibility-ready (optional tag)
## Appendix C — Legacy WPThemeReview notes
## Verified against handbook as of: YYYY-MM-DD
```

---

## 8. Testing Strategy

| Layer | What |
|-------|------|
| Jest (`scripts/tests/theme-review/`) | Fixtures: good theme, missing headers, banned file, CPT, CDN, blocks |
| Manual WP | `wp rig review-setup` on Local site `wprig-dev` |
| Playwright | Expanded unit test specs; skip if content absent |
| CI | PHPCS fixed + theme-review unit tests |
| Smoke | `npm run bundle:wporg` on a clean config with blocks disabled |

---

## 9. Rollout & Compatibility

- **Non-breaking:** new scripts and skill (PR-1–3, 5–8)
- **Potentially breaking:** `cleanup_meta_tags` default `false` (PR-4) — call out in CHANGELOG; existing `config.json` overrides keep old behavior
- **Does not** require WPThemeReview Composer dependency
- Theme Check remains a **runtime WordPress** dependency for full parity; static checks work without WP

---

## 10. Open Questions (resolve before / during execute)

1. **`bundle:wporg` on failure:** still write zip for inspection, or refuse zip?  
   **Recommendation:** write zip + report, exit 1 (easier debugging).
2. **CI scope:** fail only unit tests of auditors, or also audit the rig itself with a severity allowlist?  
   **Recommendation:** unit tests + security/banned on `inc/` + root PHP templates; metadata WARNING-only for slug `wp-rig`.
3. **Blocks in commercial/non-directory use:** keep `--allow-blocks` / env flag forever?  
   **Recommendation:** yes — Rig is dual-purpose.
4. **Elevate performance hook removal to REQUIRED for wporg bundle?**  
   **Recommendation:** yes when cleanup enabled in effective config.

---

## 11. Execution Order (when implementing)

```text
Wave A (parallel):  PR-1 docs/skill    |  PR-2 audit framework
Wave B:             PR-3 Theme Check + WP-CLI
Wave C:             PR-4 bundle:wporg + defaults
Wave D (parallel):  PR-5 i18n/license  |  PR-6 E2E expansion
Wave E:             PR-7 CI polish
Wave F (optional):  PR-8 theme.json/HTML
```

**First execution slice (recommended start):**  
**PR-2 core framework + PR-1 skill rewrite in the same working branch if preferred**, or PR-1 first for quick merge then PR-2.

Minimum lovable milestone: **PR-1 + PR-2 + PR-4** → agents can run real audits and gated bundles without Theme Check.  
Full TRT mimic: add **PR-3 + PR-6**.

---

## 12. Success Metrics

- Agent can run one command and get pass/fail + fix hints without reading the whole handbook
- Production zip for a configured theme passes Theme Check with 0 REQUIRED after following runbook
- No silent shipping of custom blocks or meta-hook stripping under `bundle:wporg`
- Skill commands match `package.json` / WP-CLI 100%
- CI catches security/banned-file regressions

---

## 13. Out of Scope (explicit)

- Submitting WP Rig itself to the directory under the name “WP Rig”
- Fully automating human design/trademark judgment
- Maintaining a full fork of WPThemeReview unless upstream dies and sniffs are clearly needed
- Replacing Playwright visual review for every aesthetic issue
- Auto-filing themes.trac tickets

---

## PR Plan Summary (DAG)

```text
PR-1 (docs/skill) ──────────────────────────────┐
PR-2 (audit framework) ──┬── PR-3 (theme-check) ┼── PR-4 (bundle:wporg)
                         ├── PR-5 (i18n/license)┤
                         ├── PR-7 (CI)          │
                         └── PR-8 (theme.json)  │
PR-6 (E2E) ─────────────────────────────────────┘ (docs link only)
```

| PR | Title | Deps |
|----|-------|------|
| PR-1 | Skill truth + footguns | — |
| PR-2 | Audit runner + static checks | — |
| PR-3 | review-setup + Theme Check | PR-2 |
| PR-4 | bundle:wporg + safe defaults | PR-2 (PR-3 ideal) |
| PR-5 | i18n + resources | PR-2 |
| PR-6 | E2E unit test matrix | — |
| PR-7 | CI fix + theme-review tests | PR-2 |
| PR-8 | theme.json / HTML (stretch) | PR-2 |
