# SPEC-015 — `rig:bake`: Site Editor Bake & Sync (wp-theme-control integration)

> **Status:** Approved, ready for implementation (2026-09-08)
> **Paradigm tag:** `block-based` (active for `universal` + `block-based`; classic core never sees it)
> **Companion docs:** `SPEC-016-user-styles-overlay.md` (theme.json collision design) ·
> `PLAN-rig-bake-implementation.md` (task sequencing + verification) ·
> `.ai/skills/bake-sync/SKILL.md` (agent workflow)
> **Upstream:** https://github.com/bacoords/wp-theme-control (Brian Coords)

---

## 1. Problem

Block-theme (universal/block-based) developers lose work two ways:

1. **Site Editor work is not version controlled.** Custom templates, template
   parts, user-created patterns, Global Styles, and Font Library activations
   live only in the database. There is no supported round-trip from the editor
   back into the theme's git history. (WP Rig's own harness hit this: the
   working-file `templates/index.html` had to be gitignored + DB-synced.)
2. **Even when the DB is the source, WP Rig's pipeline fights it.** WP Rig 3.5
   made `tokens.js` the **sole theme.json writer** and gitignores theme.json as
   a generated artifact — so any tool that writes baked styles directly into
   theme.json is clobbered on the next `rig:tokens` run.

## 2. Solution

Adopt — not rebuild — [`wp-theme-control`](https://github.com/bacoords/wp-theme-control):
a Bash + WP-CLI 3.0 tool that bakes Site Editor DB changes into the active
block theme (fonts, templates, template parts, Global Styles, unsynced
patterns) with manifest-first, hash-verified safety. WP Rig wraps it as the
`rig:bake` command family and resolves conflict (2) with the **user-styles
overlay** (SPEC-016): baked Global Styles land in a git-tracked
`config/user-styles.json` that `buildThemeJson()` merges **last**, so tokens
stay canonical and `rig:tokens` regeneration preserves baked work.

This is the same "better together" judgment as the Menu Designer decision:
WP Rig does not ship a Create Block Theme clone; it adopts the purpose-built
tool and adds the paradigm, config, and QA layers around it.

## 3. Upstream contract (what we are adopting)

Verified by full source review (README, SKILL.md, all 7 scripts + tests,
2026-09-08). Upstream tree: ~1,240 lines Bash.

| Command | Writes | Safety properties |
| :--- | :--- | :--- |
| `plan` | nothing (read-only inventory + collision report) | — |
| `patterns` | `patterns/<slug>.php` from published unsynced `wp_block` posts | slug charset guard; collision refusal; `Inserter: yes`; namespaced `Slug: <theme-slug>/<slug>` |
| `templates` | `templates/*.html`, `parts/*.html` via `wp block template export` (WP-CLI 3.0) | patternizes runtime-URL templates into `patterns/hidden-*.php` (`Inserter: no`) |
| `fonts` | `assets/fonts/<slug>/` + fontFamilies into theme.json | magic-byte signature validation; `file:./` src rewrite; slug dedupe |
| `styles` | merged user Global Styles into theme.json | refuses local absolute URLs in JSON |
| `clean` | deletes only verified-exported DB records | TSV manifest + sha256 verification; refuses on hash drift, wrong post type, no-longer-unsynced; `--force` bypasses hash check only |

Key mechanics we rely on:

- **Runtime URL rewriting** (`lib/common.sh` `wpctl_rewrite_runtime_urls`):
  local absolute URLs → PHP expressions, matched **host-independently** for
  theme paths (Studio imported-domain case). Order: theme assets → uploads →
  site base. Refuses content containing `<?` (PHP-syntax gate).
- **Manifest-first writes**: every write appends
  `kind / record_id / slug / target / sha256` to a per-run TSV; backups kept
  per run under `--state-dir`.
- **Deliberate non-goals (upstream)**: synced patterns, distribution
  packaging, localization, Media Library moves, remote `--ssh` targets.

## 4. Decisions (locked 2026-09-08)

| # | Decision | Choice | Rationale |
| :--- | :--- | :--- | :--- |
| D1 | Distribution | **Vendor pinned copy** at `bin/wp-theme-control/` + `VENDORED.md` (upstream SHA + patch log) | offline-capable, patchable, re-vendor diffs clean; Node port stays post-3.5 |
| D2 | 3.5 scope | **Full system**: bake (patterns/templates) **and** fonts/styles via the overlay | one coherent release story: "the Site Editor git round-trip" |
| D3 | Naming | `rig:bake` / `rig:bake:plan` / `rig:bake:clean` | matches upstream vocabulary; discoverable next to `rig:tokens` |
| D4 | theme.json collision | **Option B — `config/user-styles.json` overlay**, merged last by `buildThemeJson()` | keeps tokens.js the sole writer; baked work survives regeneration; see SPEC-016 |
| D5 | Paradigm gating | `isFeatureEnabled('block-based')` check inside the task; **no** separate enable flag | config-driven per the standing rule; classic gets a graceful skip message, same pattern as the scrollytelling e2e suite |
| D6 | WP-root resolution | Auto-detect (walk up from theme dir to the dir containing `wp-settings.php`); explicit `--path=` passthrough wins | Local/Studio/Child layouts vary; upstream requires the WP root |
| D7 | Baked-file marking | Wrapper injects ` * Baked: yes` header into baked pattern files (idempotent) | lets `lint:patterns` apply the baked tolerance profile without heuristics |
| D8 | templates/ git tracking | Stop gitignoring `templates/*.html` | bake makes them legitimate, reviewable, version-controlled source files |

## 5. WP Rig integration surface

### 5.1 Command family

```
npm run rig:bake            # all scopes, review-first (no --clean)
npm run rig:bake:plan       # read-only inventory + collisions
npm run rig:bake:clean -- <manifest.tsv>
# scope passthrough: rig:bake [all|plan|patterns|templates|fonts|styles|clean] [-- upstream args]
```

Implemented as a `bake` subcommand in `scripts/rig.js` (Commander task-module
pattern) → `scripts/tasks/bakeSync.js`, which:

1. Validates the paradigm gate (`block-based`) and exits with guidance otherwise.
2. Resolves the WP root (D6) and the vendored script path.
3. Spawns `bash bin/wp-theme-control/<scope> …` with arg passthrough.
4. On `patterns`/`templates` success, runs the WP Rig post-bake layer (5.3).

Upstream common args (`--path/--url/--user/--state-dir/--dry-run/--clean/--force`)
pass through untouched. Note: the Local-by-WP harness wp-cli needs
`php -d mysqli.default_socket=…` — passthrough + harness docs cover it; no
special-casing in the task.

### 5.2 Config

No new config key is required for gating (D5). `--state-dir` defaults to
`.wp-theme-control/` in the working directory; that directory is **gitignored**
(runs, manifests, backups are machine-local and contain DB record IDs).

### 5.3 Post-bake layer (WP Rig-owned, in `scripts/tasks/bakeSync.js` + lib)

- **Baked marker (D7):** inject ` * Baked: yes` into each baked pattern file's
  docblock (idempotent — never duplicate).
- **`lint:patterns` baked profile** (`scripts/tasks/validatePatterns.js`):
  - files with `Baked: yes`: keep Title/Slug/Categories header checks and
    markup validity; relax placeholder-content to a notice; unknown-category
    becomes a warning with a pointer to the `wprig_block_pattern_categories`
    filter (DB term slugs are core categories, not the config seed — expected).
  - non-baked files: unchanged behavior.
- **`validate-block-markup` tolerance** (`scripts/lib/validate-block-markup.js`):
  neutralize the three known runtime-URL PHP expressions before attribute JSON
  parsing so baked `<!-- wp:… {"url":"<?php echo … ?>"} -->` markup validates:
  - `<?php echo esc_url( get_stylesheet_directory_uri() ); ?>`
  - `<?php echo esc_url( wp_get_upload_dir()['baseurl'] ); ?>` (both quote styles)
  - `<?php echo esc_url( home_url() ); ?>`
  Anything else PHP-shaped in block attributes still fails.
- **Scopes mapping (D2/D4):** the vendored copy ships two minimal forks,
  `fonts-rig.sh` and `styles-rig.sh`, which are byte-identical to upstream
  except the theme.json write is replaced by the overlay write (SPEC-016 §4).
  `rig:bake styles|fonts|all` route to the forks; everything else runs
  upstream-verbatim.

### 5.4 What ships where

| Artifact | Path | Git |
| :--- | :--- | :--- |
| Vendored tool | `bin/wp-theme-control/**` + `bin/wp-theme-control/VENDORED.md` | tracked |
| Baked patterns | `patterns/*.php` (+ `patterns/hidden-*.php`) | tracked |
| Baked templates/parts | `templates/*.html`, `parts/*.html` | tracked (D8) |
| Baked font files | `assets/fonts/<slug>/**` | tracked |
| Global Styles overlay | `config/user-styles.json` | tracked |
| Generated theme.json | `theme.json` | gitignored (unchanged — tokens.js remains sole writer) |
| Run state (manifests/backups) | `.wp-theme-control/**` | gitignored |

## 6. Paradigm behavior matrix

| themeType | `rig:bake` behavior |
| :--- | :--- |
| `classic` | Refuses before any write: "bake is a block-theme workflow (tag: block-based). Switch themeType to universal or block-based." |
| `universal` / `block-based` | Full workflow. Runtime `wp_is_block_theme()` (upstream check) is the second gate — a universal theme not yet converted to block markup still refuses upstream-side. |

## 7. Verification bar (per PLAN-rig-bake-implementation.md Task 6)

- jest: overlay merge matrix (SPEC-016 §5), baked-tolerance validators, gate +
  arg-parsing units.
- Harness round-trip on `wprig-dev.local` (config.local.json flipped to
  block-based, byte-exact restore): create a pattern + template edit + Global
  Style + font activation via wp-cli → `rig:bake` → assert files, headers
  (`Baked: yes`, namespaced slugs), `lint:patterns` + `lint:blocks` +
  `lint:css` green → `rig:bake:clean` → zero orphans → `rig:tokens`
  regeneration preserves the baked overlay (byte-stable theme.json diff).
- Upstream's own test suite (`tests/run.sh`, fake-`wp`) passes against the
  vendored copy.

## 8. Risks & mitigations

| Risk | Mitigation |
| :--- | :--- |
| Upstream has **no LICENSE file** | **Task 0 blocker**: written GPL-compat confirmation from Brian Coords before vendoring anything |
| Upstream is experimental | Pin exact SHA in `VENDORED.md`; run on dev sites only (upstream warning); manifest+hash safety inherited; `plan`/`--dry-run` are the documented defaults |
| WP-CLI 3.0 required (`wp block template export`) | Verify on harness during Task 6; document requirement in skill + docs |
| Windows devs (bash 3.2 + jq) | Documented WSL requirement in Phase 1; Node port is the post-3.5 fix (upstream-neutral) |
| Fork drift from upstream | Forks limited to the two files; every local patch logged in `VENDORED.md` with rationale; upstream PRs offered |
| Agents bake over uncommitted work | Skill rule: `git status` must be clean before `rig:bake` (bakes are meant to be reviewed as a diff) |
| theme.json runtime URLs | Inherited upstream refusal + overlay design keeps JSON PHP-free; skill instructs media stays in block markup |

## 9. Accepted non-goals (3.5)

- No synced-pattern migration; no distribution packaging of baked output;
  no localization workflow; no Windows-native runner (WSL documented);
  no remote WP-CLI targets. All inherited upstream boundaries.
- No automatic `ai:check` hook: bake is explicit, never a build step.
