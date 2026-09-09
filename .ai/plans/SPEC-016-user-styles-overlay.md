# SPEC-016 — User-Styles Overlay (`config/user-styles.json`) — the theme.json collision design

> **Status:** Approved, ready for implementation (2026-09-08)
> **Paradigm tag:** `block-based` (overlay is only ever written by the bake
> workflow, which is gated `block-based`; the merge code itself is inert when
> the file is absent)
> **Depends on:** SPEC-015 (D4). `scripts/tasks/tokens.js` remains the **sole
> theme.json writer** — this SPEC adds one input to it, never a second writer.

---

## 1. The collision

WP Rig 3.5 (G1/Track B) established:

- `config/tokens.json` → `buildThemeJson()` → `theme.json` (generated,
  gitignored). `rig:tokens` / `propagateTokens()` regenerates it.
- Upstream wp-theme-control writes baked Global Styles and Font Library
  activations **directly into theme.json**.

Without a design, the first `rig:tokens` run after a bake silently destroys
the baked work. Chosen resolution (**Option B**): capture the baked user data
in a git-tracked overlay file and make it a first-class input to the existing
generator — tokens stay canonical, user decisions win on top, regeneration is
deterministic.

## 2. The overlay file contract

**Path:** `config/user-styles.json` (git-tracked; part of the theme repo).
**Written by:** `rig:bake styles` / `rig:bake all` only (via the vendored
`styles-rig.sh` / `fonts-rig.sh` forks). **Read by:** `buildThemeJson()`.

### 2.1 Shape

```jsonc
{
  "$comment": "Baked by rig:bake from Site Editor Global Styles. Merged over tokens by buildThemeJson(). Do not hand-edit while the DB copy still exists — re-bake or edit in the editor.",
  "capturedAt": "2026-09-08T12:00:00Z",
  "globalStylesPostId": 1234,
  "settings": { /* user Global Styles settings — raw, WP-resolved */ },
  "styles":    { /* user Global Styles styles — raw, WP-resolved */ },
  "fonts": {
    "themeFamilies":  [ /* activated theme font families (full defs) */ ],
    "customFamilies": [ /* Font Library families, srcs rewritten to file:./assets/fonts/... */ ]
  }
}
```

- `settings`/`styles` hold the **raw user Global Styles data**
  (`WP_Theme_JSON_Resolver::get_user_data()->get_raw_data()`, font-family
  bookkeeping excluded) — **not** the merged-with-theme output upstream
  writes. Raw capture is what makes the merge order deterministic: the user
  layer is independent of what tokens generated at capture time.
- `fonts.themeFamilies` = the `fontFamilies.theme` activation list filtered to
  active slugs (upstream fonts.sh semantics: `fontFamilies.theme` is an
  activation list — empty `fontFace` never wipes full theme definitions).
- `fonts.customFamilies` = `fontFamilies.custom` entries with `preview`
  stripped and every `src` rewritten to `file:./assets/fonts/<slug>/<file>`
  (files themselves land in `assets/fonts/<slug>/` per upstream).
- `settings.viewport` is **never persisted** in the overlay even if the user
  changed editor viewport settings — breakpoints are tokens-owned (SSOT rule).

### 2.2 Empty-state rule

If a bake captures no style changes and no font changes, the overlay is
deleted (not left empty). Absence of the file = "no user layer", which keeps
`buildThemeJson()` trivially pure.

### 2.3 Clean semantics

`rig:bake:clean` on a styles/fonts manifest resets the Global Styles post
(upstream semantics) **and** deletes `config/user-styles.json`. Font asset
files under `assets/fonts/` are retained (upstream recoverability rule).

## 3. Merge semantics in `buildThemeJson()`

New signature (backward-compatible third parameter):

```js
buildThemeJson( tokens, existingThemeJson, userStylesOverlay )
```

`propagateTokens()` reads `config/user-styles.json` (when present) and passes
it. `node/editorSupport.js` continues to delegate — no new callers.

### 3.1 Rules (in order)

1. Generate the token-derived theme.json exactly as today (§4 unchanged).
2. If an overlay is present:
   - **Deep-merge `overlay.settings` over generated `settings`** and
     `overlay.styles` over generated `styles`. Objects merge recursively;
     **arrays replace wholesale** (palette, fontFamilies, fontSizes, spacing
     scales). This matches WP's preset-replace behavior: the editor authors a
     complete palette list, not a delta — a partial-array union would invent
     colors the user deleted.
   - `overlay.fonts` collapses into
     `settings.typography.fontFamilies = [ ...themeFamilies, ...customFamilies ]`
     **replacing** the token-derived list (same replace semantics; font
     activation is a user decision about the whole family list).
3. **SSOT keys never merge from the overlay** (stripped before merging):
   `$schema`, `version`, `settings.viewport`, `settings.blockVisibility`.
   These stay tokens/config-owned unconditionally (Track B D9, G2, G8).
4. Guard keys never written from the overlay:
   `isGlobalStylesUserThemeJSON` (strip if present in captured data).
5. Merge result must validate against the WP 7.1 schema (existing ajv check).

### 3.2 Determinism guarantee

`rig:tokens` after a bake ⇒ byte-identical theme.json (given unchanged
tokens.json + user-styles.json). This is the jest-verified contract; it is the
entire point of Option B.

### 3.3 Precedence summary

```
tokens.json  <  config/user-styles.json        (content)
tokens SSOT keys (viewport, version, $schema,
blockVisibility)  >  overlay                    (always)
```

## 4. Vendored fork surface (minimal)

- `styles-rig.sh`: identical to upstream `styles.sh` except the final
  `wp eval` step captures raw user data → writes `config/user-styles.json`
  (manifest records the overlay path) instead of merging into theme.json.
  Keeps the local-absolute-URL refusal check by running the captured user
  data through the same `wpctl_rewrite_runtime_urls` gate (report-only).
- `fonts-rig.sh`: identical to upstream `fonts.sh` except (a) font files land
  in the theme `assets/fonts/` (unchanged), and (b) the fontFamilies payload
  is written into the overlay's `fonts` block instead of theme.json.
- `all` ordering stays `fonts → templates → styles → patterns` so the styles
  run sees font bookkeeping already persisted (upstream invariant).

## 5. Test plan (jest, `scripts/tests/`)

In `tokens.test.js` (+ new `bake-overlay.test.js` where separation helps):

1. Overlay absent → output byte-identical to current behavior (regression).
2. Overlay palette replaces token palette (arrays replace, not union).
3. Overlay `styles.blocks.core/paragraph...` merges over generated styles.
4. SSOT keys survive overlay collision attempts (`settings.viewport`,
   `version`, `$schema`, `blockVisibility`).
5. Fonts collapse: activation-filtered theme families + custom families with
   `file:./` srcs replace the token-derived list.
6. Determinism: two `buildThemeJson()` runs with same inputs → deep-equal.
7. Overlay-schema validation: malformed overlay (missing `settings`/`styles`,
   non-object) → fail-fast with a message naming `config/user-styles.json`.
8. Empty-capture rule: bake-with-no-changes deletes overlay (task-level test).
9. WP 7.1 schema validation of merged output (existing ajv harness).
10. PHPUnit parity guard: `Theme::get_config`/runtime never reads the overlay
    (it is build-time only) — negative test that PHP runtime is overlay-blind.

## 6. Docs & DX

- `docs/commands.md`: `rig:bake*` rows + overlay mention under `rig:tokens`.
- `docs/block-based-theme.md`: new "Site Editor bake & sync" section — the
  round-trip, the overlay, what is tracked vs generated.
- `.ai/skills/bake-sync/SKILL.md`: agent workflow (separate file).
- CHANGELOG 3.5.0 bullets under both the paradigm and component sections.
