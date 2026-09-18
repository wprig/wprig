# `rig:bake` — Site Editor Bake & Sync

> **Status:** Shipped in WP Rig 3.5 (Track G). Paradigm tag: `block-based`
> (active for `universal` and `block-based` themes; classic themes refuse
> with guidance).
> **Origin:** Node port of [`bacoords/wp-theme-control`](https://github.com/bacoords/wp-theme-control)
> (Brian Coords), pinned upstream SHA `0820d96567a912320df7b1cdc102605376a69edf`.
> Design docs: [`SPEC-015`](../.ai/plans/SPEC-015-rig-bake-integration.md),
> [`SPEC-016`](../.ai/plans/SPEC-016-user-styles-overlay.md),
> [`implementation plan`](../.ai/plans/PLAN-rig-bake-implementation.md).

## The problem it solves

Site Editor work — custom templates, template parts, user-created patterns,
Global Styles, Font Library activations — lives in the **WordPress
database**, not in your repo. Without a round-trip, that work is invisible
to git, unreviewable, and lost when the site dies. WP Rig 3.5 also made
`rig:tokens` the **sole `theme.json` writer** (generated, gitignored), so
tools that write baked styles directly into `theme.json` get clobbered on
the next token regeneration.

`rig:bake` solves both:

1. **Bakes DB state into theme files** that can be diffed, reviewed, and
   committed — then scrubs the DB records with manifest-verified cleanup.
2. **Redirects baked Global Styles/fonts into a git-tracked overlay**
   (`config/user-styles.json`) that the tokens generator merges *last*, so
   `rig:tokens` never clobbers baked work.

## Commands

```bash
npm run rig:bake            # all scopes: fonts → templates → styles → patterns
npm run rig:bake:plan       # read-only inventory + collision report
npm run rig:bake:clean -- .wp-theme-control/runs/<run>/manifest.tsv
npm run rig:bake -- <scope> [flags]   # one scope + upstream flags passthrough
```

| Scope | Writes |
| :--- | :--- |
| `plan` | nothing (inventory, collisions, "nothing to bake" report) |
| `patterns` | `patterns/<slug>.php` from published unsynced `wp_block` posts |
| `templates` | `templates/*.html`, `parts/*.html` (runtime-URL content patternizes to `patterns/hidden-*.php`, `Inserter: no`) |
| `fonts` | `assets/fonts/<slug>/` + the overlay's `fonts` block |
| `styles` | the overlay's `settings`/`styles` blocks (raw user Global Styles) |
| `clean` | deletes only DB records whose exported files still match the manifest sha256; also removes the overlay |

Passthrough flags: `--path=`, `--url=`, `--user=`, `--state-dir=`,
`--dry-run`, `--clean`, `--force`. Requirements: Node 18+, WP-CLI 2.12+
(see the template export note below), writable active block theme.

## How it works

```
npm run rig:bake
  └─ scripts/rig.js bake [scope]        (Commander wiring, raw arg passthrough)
       └─ scripts/tasks/bakeSync.js     (the WP Rig wrapper)
            1. Paradigm gate: isFeatureEnabled('block-based') — classic refuses
               with guidance, exit 1 (SPEC-015 D5).
            2. WP root: walks up from cwd for wp-settings.php; an explicit
               --path= passthrough wins (D6).
            3. Spawns `node bin/wp-theme-control/index.js <scope> [args]`
               with inherited stdio (upstream contract, pinned SHA).
            4. Post-bake layer (WP Rig-owned):
               - idempotent `Baked: yes` header injection from manifest
                 targets (D7; the header is already part of the staged file —
                 this is a safety net for foreign manifests);
               - empty-state rule: an overlay with no settings/styles/fonts
                 content is deleted, not left empty (SPEC-016 §2.2).
```

**Inside the Node tool** (`bin/wp-theme-control/`, ESM):

- `lib/context.js` — common arg parsing, `wp` spawn helpers (`wp` fatal,
  `wpTry` non-fatal), context load (`wp_is_block_theme()` gate, theme
  slug/dir), per-run staging + backups, TSV manifest with sha256, safe-slug
  guards, atomic theme-target installs, shared `wp eval` PHP payloads.
- `lib/runtime-urls.js` — rewrites local absolute URLs to the three runtime
  PHP expressions (theme assets → uploads → home order, host-independent
  for theme paths); refuses content containing PHP syntax. Runs in PHP via
  `wp eval` for byte-identical `parse_blocks()` semantics.
- `lib/patterns.js`, `lib/templates.js`, `lib/fonts.js`, `lib/styles.js`,
  `lib/plan.js`, `lib/clean.js` — one module per scope; `lib/overlay.js`
  holds the overlay assembly primitives; `index.js` is the CLI dispatcher.
- **WP Rig forks (vs upstream):** fonts/styles write
  `config/user-styles.json` instead of `theme.json`; `clean` handles the
  `user_styles_overlay` kind (path-checked, never hash-checked — the
  overlay is cumulative state both forks write) and retains font assets.

**Safety model:** every write appends `kind / record_id / slug / target /
sha256` to a per-run manifest under `.wp-theme-control/runs/` (gitignored),
with backups per run. `clean` deletes only records whose exported files
still match the manifest hash, only for the expected post type, and only
while the pattern is still unsynced / the Global Styles post unchanged;
`--force` bypasses the hash check only. The `Baked: yes` header is part of
the staged pattern file, so manifest hashes match the committed content.

**The overlay contract (SPEC-016):** `config/user-styles.json` holds the
RAW user Global Styles data (SSOT keys stripped at capture) plus the
collapsed fonts block. `buildThemeJson( tokens, existing, overlay, { extraPalette, themeCustom } )`
merges it last: objects deep-merge, arrays replace wholesale, fonts
collapse (custom definitions win duplicate slugs), SSOT keys
(`version`, `$schema`, `settings.viewport`, `settings.blockVisibility`) and
`isGlobalStylesUserThemeJSON` never merge. Regeneration is deterministic —
two `rig:tokens` runs after a bake are byte-identical. The PHP runtime is
overlay-blind (build-time-only input; PHPUnit parity guard).

**Template export fallback:** the templates scope prefers
`wp block template export` (WP-CLI 3.0 / `wp-cli/block-command`) and uses
it whenever available. On WP-CLI 2.x it automatically falls back to reading
the underlying template post's `post_content` — the same data the 3.0
command prints — with a visible notice. Any other export failure is fatal.

**Lint integration:** patterns marked ` * Baked: yes` keep the
Title/Slug/Categories and markup-validity checks but get a tolerance
profile (scaffold-placeholder content → warning; hidden runtime patterns
get a Categories warning). `validate-block-markup` neutralizes the three
sanctioned runtime-URL PHP expressions in block-comment attributes — any
other PHP still fails.

## What ships where

| Artifact | Path | Git |
| :--- | :--- | :--- |
| Baked patterns | `patterns/*.php`, `patterns/hidden-*.php` | tracked |
| Baked templates/parts | `templates/*.html`, `parts/*.html` | tracked |
| Baked font files | `assets/fonts/<slug>/**` | tracked |
| Global Styles overlay | `config/user-styles.json` | tracked |
| Generated theme.json | `theme.json` | gitignored (tokens.js remains the sole writer) |
| Run manifests/backups | `.wp-theme-control/**` | gitignored |

## Usage loop

```bash
git status                        # must be clean — a bake is reviewed as a diff
npm run rig:bake:plan             # inventory + collisions (writes nothing)
npm run rig:bake                  # writes files; does NOT clean the DB
npm run lint:patterns && npm run lint:blocks && npm run lint:css
git add -p && git commit          # review the diff
npm run rig:bake:clean -- .wp-theme-control/runs/<run>/manifest.tsv
```

The agent workflow lives in [`.ai/skills/bake-sync/SKILL.md`](../.ai/skills/bake-sync/SKILL.md).

## For developers: extending / modifying the tool

- **Paradigm gate** lives in `scripts/tasks/bakeSync.js`
  (`isFeatureEnabled('block-based')`) — changing gating requires updating
  `config/paradigms.json`, never hardcoding.
- **Adding a scope:** new module in `bin/wp-theme-control/lib/`, register it
  in `index.js` `SCOPES` + in `scripts/tasks/bakeSync.js`
  (`resolveBakeScope` + post-bake scoping) + docs. Tag the feature's
  paradigm.
- **Manifest kinds** are the clean contract: DB-mutating kinds
  (`wp_block`, `wp_template`, `wp_template_part`, `wp_global_styles`,
  `wp_global_styles_fonts`) verify + mutate; artifact kinds
  (`font_asset`, `runtime_pattern`) verify only; `user_styles_overlay`
  removes the file (no hash check — cumulative state).
- **Tests:** `scripts/tests/bake-tool.e2e.test.js` (ported from upstream's
  suite, runs against the fake WP-CLI fixture in
  `bin/wp-theme-control/tests/fake-bin/wp` — supports
  `FAKE_PATTERN_PHP`, `FAKE_LOCAL_URL`, `FAKE_NO_BLOCK_COMMAND` modes),
  `bake-tool.test.js` (pure helpers), `bake-sync.test.js` (wrapper:
  gate, WP-root detection, manifest parsing, header injection,
  empty-overlay pruning), `bake-overlay.test.js` (overlay merge matrix
  incl. determinism).
- **WP-CLI eval payloads** live as constants in `lib/context.js` and
  `runtime-urls.js` — they run in PHP so WordPress core APIs
  (`WP_Theme_JSON_Resolver`, `parse_blocks`) stay authoritative. Changing
  them changes runtime behavior; keep them minimal and quoted carefully
  (single-quoted PHP strings survive WP-CLI arg passing).

## Known boundaries (accepted)

- Synced patterns are not migrated; distribution packaging, localization,
  Media Library moves, remote SSH targets — upstream boundaries, inherited.
- The overlay must never carry PHP expressions: local absolute URLs in
  captured styles are flagged (report-only) and the media belongs in block
  markup instead.
- Baked font families replace the token `fontFamilies` list in the editor
  presets (user layer wins). See
  [Advanced Features → Theme Fonts vs Baked Fonts](./advanced-features.md).
- Font asset files survive `clean` (recoverability); the overlay is removed
  with the styles/fonts clean (SPEC-016 §2.3).