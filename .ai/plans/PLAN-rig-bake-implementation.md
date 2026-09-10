# PLAN — `rig:bake` implementation (SPEC-015 + SPEC-016)

> **Status:** Approved, ready to execute (2026-09-08)
> **Branch:** `feature/3.5-rig-bake` (off `develop`)
> **Paradigm tag:** `block-based`
> **Execution rule:** each task ends green before the next starts:
> `npm run test:scripts` + targeted lint for JS-touching tasks; harness run for
> Task 6. Full `ai:check` at Task 6 and Task 7.

---

## Task 0 — License confirmation (BLOCKER)

Upstream repo has **no LICENSE file**. Before any vendoring:

- [ ] Obtain written (issue/comment/email) confirmation from Brian Coords that
      the code is GPL-compatible (GPLv2-or-later or MIT accepted into a GPLv2+
      project) and that vendoring with attribution is permitted.
- [ ] Record the confirmation (link + quote) in `bin/wp-theme-control/VENDORED.md`.

Nothing in Tasks 1–7 starts until this closes. (Reading/forking a public repo
for evaluation is fine; distribution is not.)

## Task 1 — Vendor + forks

**Files:**

- `bin/wp-theme-control/wp-theme-control` (upstream `scripts/wp-theme-control` dispatcher)
- `bin/wp-theme-control/lib/{common,plan,patterns,templates,fonts,styles,clean}-rig.sh` naming:
  upstream files copied verbatim as `lib/*.sh`; the two forks are
  `lib/fonts-rig.sh` + `lib/styles-rig.sh` (see SPEC-016 §4)
- `bin/wp-theme-control/tests/{run.sh,fake-bin/wp}` (upstream suite, verbatim)
- `bin/wp-theme-control/VENDORED.md`

**Steps:**

1. Clone upstream at the pinned SHA; copy `skills/wp-theme-control/scripts/**`
   into `bin/wp-theme-control/` (drop the `skills/` wrapper; WP Rig's own skill
   lives in `.ai/skills/bake-sync/`).
2. Create `VENDORED.md`: upstream repo URL, pinned SHA, copy date, license
   confirmation (Task 0), and a **patch log table** — one row per deviation
   from upstream (`styles-rig.sh`, `fonts-rig.sh`, any hotfix), each with
   rationale + upstream PR link when filed.
3. Implement the two forks (SPEC-016 §4). Diff discipline: `diff` against
   upstream originals must show ONLY the overlay-write changes.
4. `.gitignore`: add `.wp-theme-control/`.
5. Run upstream's own suite against the vendored copy:
   `bash bin/wp-theme-control/tests/run.sh` — green.

**Verification:** upstream suite green; fork diffs minimal; VENDORED.md complete.

## Task 2 — `rig:bake` subcommand + npm scripts

**Files:**

- `scripts/tasks/bakeSync.js` (new)
- `scripts/rig.js` (add `bake` subcommand wiring)
- `package.json` (scripts: `rig:bake`, `rig:bake:plan`, `rig:bake:clean`)
- `scripts/tests/bake-sync.test.js` (new)

**bakeSync.js contract:**

```js
// bakeSync( scope, options ) — scope: 'all'|'plan'|'patterns'|'templates'|
// 'fonts'|'styles'|'clean'; options: passthrough flags + { manifest } for clean.
```

1. Gate: `isFeatureEnabled( 'block-based' )` — else print the classic guidance
   message (SPEC-015 §6) and exit 1 (exit 0 with notice when `--dry-run`? No —
   exit 1 always; the message is the DX).
2. WP-root resolve (D6): walk up from `process.cwd()` checking for
   `wp-settings.php`; explicit `--path=` wins; no root found → actionable error
   ("run inside a WordPress install or pass --path=…").
3. Spawn `bash bin/wp-theme-control/<script> <args…>` with inherited stdio;
   scope→script mapping: `all→wp-theme-control`, `plan→plan.sh`, …,
   `styles→styles-rig.sh`, `fonts→fonts-rig.sh`, `clean→clean.sh <manifest>`.
4. Post-bake layer on `patterns`/`templates`/`all` success:
   inject ` * Baked: yes` header into `patterns/*.php` files written this run
   (parse the run manifest TSV for targets; idempotent — skip files already
   marked).
5. Never run on `--dry-run` (upstream prints instead).

**rig.js wiring:** `program.command( 'bake [scope]' )` + option pass-through
(`allowUnknownOption`), forwarding argv slices after `--`.

**npm scripts:**

```json
"rig:bake": "node scripts/rig.js bake",
"rig:bake:plan": "node scripts/rig.js bake plan",
"rig:bake:clean": "node scripts/rig.js bake clean"
```

**jest (bake-sync.test.js):**

- Gate: classic → refuses with guidance; block-based/universal → proceeds.
- WP-root detection: fake tree fixtures (found / not found / explicit wins).
- Scope→script mapping table (pure `resolveBakeScript( scope )`).
- Header injection: adds `Baked: yes` once, skips already-marked files,
  preserves existing docblock content.
- Manifest parsing: 5-column TSV, kind filter (`wp_block`, `runtime_pattern`).

**Verification:** jest green; manual smoke with `--dry-run` on the harness
(classic flip → refusal message; block-based flip → upstream plan output).

## Task 3 — Overlay (SPEC-016)

**Files:**

- `scripts/tasks/tokens.js`: `buildThemeJson( tokens, existingThemeJson, userStylesOverlay )`
  + overlay reader in `propagateTokens()` (`readUserStylesOverlay()`)
- `scripts/tests/tokens.test.js` (+ `scripts/tests/bake-overlay.test.js`)
- `config/.gitignore`-check: `config/user-styles.json` must be **tracked**
  (verify no ignore rule catches it)

**Steps:** implement merge rules SPEC-016 §3 exactly (deep-merge objects,
replace arrays, strip SSOT keys + `isGlobalStylesUserThemeJSON`, fonts
collapse, fail-fast on malformed overlay). Keep the function pure — file IO
stays in `propagateTokens()`.

**jest:** the 10 tests listed in SPEC-016 §5, including the determinism
contract (run twice → deep-equal) and the PHP-runtime overlay-blindness
negative check (PHPUnit: `tests/phpunit/unit/Paradigm/` gains an assertion
that no shipped PHP file references `user-styles.json`).

**Verification:** jest + PHPUnit green; `npm run rig:tokens` idempotent with
and without a fixture overlay.

## Task 4 — Validator tolerances

**Files:**

- `scripts/tasks/validatePatterns.js` (baked profile)
- `scripts/lib/validate-block-markup.js` (PHP-expression neutralization)
- `scripts/tests/validate-patterns.test.js` (+cases)
- `scripts/tests/validate-block-markup.test.js` (+cases)
- `.gitignore`: remove `templates/*.html` rule (D8)

**Baked profile:** `headers.baked === 'yes'` → placeholder-content check
becomes a notice (`console.warn`), unknown-category stays a warning with the
filter pointer, Title/Slug/Categories + markup validity unchanged (errors).
Non-baked files: byte-identical behavior.

**Markup tolerance:** before attribute JSON parsing, replace the three
runtime-URL expressions (both quote styles for the uploads one; flexible
whitespace) with `__WPRIG_RUNTIME_URL__` tokens; anything else matching
`<\?php` inside an opening comment still errors.

**jest:** baked file with real English copy + DB category → passes (warnings
only); unmarked file with same content → fails (no behavior change); opening
comment with each of the three expressions + one rogue PHP expression →
three pass, rogue fails.

**Verification:** `npm run lint:patterns` + `lint:blocks` green on the repo.

## Task 5 — Skill + docs

**Files:**

- `.ai/skills/bake-sync/SKILL.md` (authored this session — see file)
- `.ai/SKILLS.md` (directory entry)
- `docs/commands.md` (`rig:bake*` rows; `rig:tokens` overlay note)
- `docs/block-based-theme.md` ("Site Editor bake & sync" section)
- `docs/wordpress-7-1-*` no change. `readme.txt` no change (dev-facing tool).

## Task 6 — Harness end-to-end round-trip (the release gate)

On `wprig-dev.local` (Local WP 7.1), using the established flip-and-restore
discipline for `config/config.local.json`:

1. Verify WP-CLI ≥ 3.0 on the harness (`wp cli version` — `wp block template
   export` availability).
2. Flip harness to `block-based` (byte-exact restore at the end).
3. Seed DB state via wp-cli: one unsynced pattern post, one custom template
   edit, one Global Styles change, one Font Library activation (remote font).
4. `git status` clean → `npm run rig:bake:plan` → review output.
5. `npm run rig:bake` → assert: `patterns/<slug>.php` (+ `Baked: yes`,
   namespaced slug), template html, `templates/hidden-*.php` patternization
   (if runtime URLs present), `assets/fonts/<slug>/` files,
   `config/user-styles.json` shape per SPEC-016 §2.1.
6. `npm run lint:patterns && npm run lint:blocks && npm run lint:css` green.
7. `npm run rig:tokens` → `git diff theme.json` shows the baked styles
   **preserved** (overlay merge working end-to-end).
8. `npm run rig:bake:clean -- <manifest>` → DB records gone, patterns remain;
   zero orphans (attachments untouched).
9. Restore `config.local.json` byte-exact; remove seed content; document any
   harness quirks in the work log.

**Verification bar:** all of 4–8 green + `npm run ai:check` (the full matrix)
+ upstream `tests/run.sh`.

## Task 7 — Bookkeeping

- `wprig/CHANGELOG.md` — 3.5.0 bullets (bake command family, overlay, lint
  tolerances, templates/ tracking).
- `wprig-v3.5-roadmap.md` — Track G rows → ✅.
- `FRAMEWORK_ROADMAP.md` — work-log entry + in-flight pointer update.
- PR → `develop`; merge gate alongside the component branches.

---

## Sequencing & dependencies

```
Task 0 (license) ──► Task 1 (vendor) ──► Task 2 (rig:bake) ──► Task 6 (harness) ──► Task 7
                                    └─► Task 3 (overlay)  ──┘          ▲
Task 4 (lint tolerances) ─────────────────────────────────────────────┘
Task 5 (docs/skill) — any time after Task 2
```

Tasks 3 and 4 are independent of each other; both must precede Task 6.
Task 5 lands after Task 2 (commands exist to document).

## Out of scope (explicit)

Node port of the Bash tool; synced-pattern migration; Windows-native runner;
hooking bake into `ai:check` or build tasks; any automatic DB cleaning.
