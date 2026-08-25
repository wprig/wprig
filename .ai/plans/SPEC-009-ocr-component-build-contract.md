# SPEC-009: OCR Component Build Contract (Wave 2 Phase 0)

- **Status:** ✅ Contract implemented + local round-trip verified (2026-08-25)
- **Wave:** 2 (3.6 "Component Studio")
- **Paradigm:** `block-based` (the components it governs are block-capable; the contract itself is `all` tooling)
- **Owner:** framework (OCR tooling + reference component)
- **Depends on:** Wave 1 (paradigm system, spatial QA, G6/G7)

---

## 1. Problem

Registry components (`rig:add`) are dropped into `inc/<Slug>/` with an
`asset_mapping` that copies CSS/JS into `assets/css/src/` and
`assets/js/src/`. Today that means:

- Component styles are compiled into the theme's **global** CSS bundle and load
  on every page — even when the component's feature isn't present.
- There is no formal guarantee a component is **paradigm-gated** (`block-based`
  components can silently ship in a classic theme).
- `rig:add`/`rig:remove` register `inc/components-manifest.json`, but the
  pre-flight validator (`testComponent.js`) does not check paradigm, and the
  scaffold (`create-rig-component`) generates a manifest with no paradigm or
  scoped-asset contract.
- There is no reference implementation proving the develop → prepare → submit →
  add loop end-to-end.

## 2. Goal

Define and enforce **how a registry component ships** so that:

1. **Scoped delivery** — component CSS/JS flow through the theme's
   Bun/Lightning pipeline (no separate HTTP requests) **and** are enqueued only
   when relevant (block-scoped styles for block components).
2. **Paradigm-gated** — block-based components declare `PARADIGM = 'block-based'`
   and use `Paradigm_Component_Trait`; they are inactive in classic cores by
   construction, and the pre-flight validator fails a mis-wired component.
3. **Droppable** — `rig:add` / `rig:remove` install/remove all component files
   (PHP, assets, patterns) plus the `components-manifest.json` entry with no
   orphans.
4. **Validated loop** — a reference component (SVG Icon Library) proves
   create → test → prepare → submit → add on a second theme.

## 3. Component anatomy (canonical)

```
inc/<Slug>/
├── Component.php        # implements Component_Interface (+ PARADIGM const + Paradigm_Component_Trait when gated)
├── manifest.json        # schema v2 (below)
├── SPEC.md              # agent planning doc
├── SKILL.md             # agent skill doc
├── patterns/            # optional: bundled block patterns (registered by inc/Block_Patterns, block-based)
├── src/                 # optional: component build sources (CSS/JS entry files)
└── (assets wired via manifest.asset_mapping into the theme pipeline)
```

## 4. Manifest schema v2

Schema v1 fields (`slug`, `version`, `title`, `description`,
`php_class_mapping`, `asset_mapping`, `dependencies`, `ai_context`) remain.
**Additions:**

```jsonc
{
  "paradigm": "block-based",          // NEW (required): all | classic | universal | block-based
  "asset_mapping": {
    "styles":  [{ "src": "...", "target": "...", "scoped": true }],   // NEW "scoped" flag
    "scripts": [{ "src": "...", "target": "...", "scoped": true }]
  }
}
```

- `paradigm` must match the component's `PARADIGM` const (validator check).
- `scoped: true` means the CSS/JS is **conditionally enqueued by the
  component's PHP** (e.g. `enqueue_block_style()` for block-scoped styles) —
  compiled into the theme pipeline but only requested when the feature renders.
- Assets without `scoped` default to theme-bundle inclusion (droppable via
  `rig:remove`, always loaded) — acceptable only for `all`-paradigm utilities.

## 5. Build & delivery contract

- **Compilation:** component CSS/JS enter the existing Bun/Lightning/esbuild
  pipeline via `asset_mapping` (no bespoke loaders, no extra HTTP requests).
- **Scoped enqueue:** block-based components MUST set `scoped: true` and
  enqueue via block-scoped mechanisms (`enqueue_block_style`,
  `wp_enqueue_block_script` / `viewScript`), so a component never adds
  global CSS to pages that don't use it.
- **Patterns:** bundled `patterns/` dirs are auto-registered by
  `inc/Block_Patterns` (already shipped in 3.5); the component just ships the
  directory.
- **Paradigm:** `is_active()` gating via `Paradigm_Component_Trait`; inactive
  components are skipped by `Theme` at discovery (no conditionals in core).

## 6. Tooling changes

| Tool | Change |
| --- | --- |
| `create-rig-component.mjs` | Generate `manifest.json` v2 with `paradigm` (from a `--paradigm` flag), `scoped` asset entries, and a `PARADIGM` const + trait usage in the template when `block-based`. |
| `testComponent.js` | Validate: `manifest.paradigm` present + matches `PARADIGM` const; block-based components use the trait; scoped assets exist. |
| `prepareComponent.js` | Already packages the component dir — no structural change; verify it carries `patterns/` and `src/` (add to `files` if needed). |
| `downloadComponent.js` | Already installs + registers the manifest — verify `paradigm` gating + scoped assets survive the round-trip. |
| Docs/skills | `create-component` skill stale claim ("register in inc/Theme.php") fixed; `component-registry` + `npm-scripts` already updated in 3.5 docs sync; add a `component-build-contract` note to the registry skill. |

## 7. Reference component: SVG Icon Library

Chosen to exercise the full contract: PHP (WP 7.1 SVG API — `wp_register_icon_collection()`,
`wp_register_icon()`, `wp_get_icon()` per G5), frontend JS, editor integration,
and a paradigm gate.

- **Scope:** register icon collections from a local `assets/svg/icons/` dir via
  the public SVG Icon API; keep core free of SVG helper bloat; generate an
  optimized sprite map.
- **Contract surface exercised:** `manifest.json` v2 (`paradigm: block-based`,
  `scoped` scripts/styles), `PARADIGM` const + trait, scoped enqueue,
  bundled `patterns/`, round-trip through `rig:test-component` →
  `rig:prepare` → local `rig:add`.

## 8. Acceptance criteria (Phase 0 + reference)

- [x] `testComponent.js` fails a component with a missing/mismatched `paradigm`.
- [x] `create-rig-component --paradigm block-based` produces a gated skeleton
      that passes pre-flight (stub assets included).
- [x] `rig:prepare` packages `Component.php` + `manifest.json` + `SPEC`/`SKILL`
      + `patterns/` + `src/` + scoped assets.
- [x] `rig:add` installs into a second theme with its `components-manifest.json`
      entry + scoped assets intact and the classic core unaffected
      (verified end-to-end via a local registry server round-trip).
- [x] `rig:remove` leaves no orphan files (verified).
- [x] Docs/skills updated; the `create-component` skill no longer references
      `inc/Theme.php` registration.
- [ ] SVG Icon Library reference component built against the contract
      (Phase 1 — next).

## 9. Out of scope (Wave 2, later phases)

- Menu Designer / Advanced Block CSS / Scrollytelling implementation.
- Track F QA (a11y suite, zero-flicker baselines, spatial Part B healer).
- Any push to the public `wprig/wprig-components` repo before the local
  round-trip passes review.
