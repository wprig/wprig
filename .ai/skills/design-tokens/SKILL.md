---
description: Design tokens in WP Rig — the layered config/tokens.json source, generated CSS custom properties + theme.json + Tailwind, dark mode, paradigm-aware binding, and the migration/import/export commands. Use whenever editing colors, spacing, typography tokens, dark mode, or the editor palette.
globs: config/tokens.json, config/tokens.schema.json, config/theme.custom.json, assets/css/src/_tokens.custom.css, assets/css/src/_custom-properties.css, theme.json
---

# WP Rig Design Tokens

The full theme-developer contract lives in [`docs/DESIGN.md`](../../../docs/DESIGN.md).
This skill is the agent-facing quick reference.

## Mental model

`config/tokens.json` is the **seed** (default color/type/space system + editor
palette), not a style store. It generates CSS custom properties, `theme.json`,
and (opt-in) Tailwind values. Component styles stay in CSS — there is **no CSS-as-JSON**.
CSS custom properties are the interface; `_tokens.custom.css` is first-class for
pure-CSS authors.

## Files

| Path | Role | Edit? |
| --- | --- | --- |
| `config/tokens.json` | Layered source: `primitives` → `semantic` (light/dark) → `component` | yes |
| `config/tokens.schema.json` | JSON Schema (editor IntelliSense) | no |
| `assets/css/src/_tokens.generated.css` | Generated custom properties (gitignored) | **never** — run `rig:tokens` |
| `assets/css/src/_tokens.custom.css` | Hand-authored vars/overrides | yes |
| `assets/css/src/_custom-properties.css` | Wrapper importing both | no (transitional) |
| `config/theme.custom.json` | Hand-authored `theme.json` fragments | yes |
| `config/tailwind.custom.js` | Hand-authored Tailwind extensions (opt-in only) | yes |

Generated files are gitignored (content depends on the active paradigm /
`colorBinding`). `build:css` / `dev:css` / `lint:css` regenerate them via
pre-hooks; `npm run build` and `npm run rig:tokens` also do.

## Taxonomy & naming

- **primitives** — raw values, no meaning (`primitives.color.brand.500`).
- **semantic** — roles with `light` + `dark` (`semantic.surface`,
  `semantic.state.danger`).
- **component** — optional component aliases.
- References use `{dotted.path}`; primitives may only be referenced by
  semantic; semantic may not reference semantic.

Var names: `--color-{hue}-{step}` (primitive), `--color-{role}` (semantic),
`--space-*`, `--layout-*`, `--font-family-*`, `--font-size-*`,
`--line-height-*`, `--breakpoint-*`, `--radius-*`, `--hue-*`, `--alpha-*`.

## Color: minimal names, math

Prefer deriving over naming: `rgb(from var(--color-accent) r g b / var(--alpha-weak))`,
`color-mix(in oklab, var(--color-accent) 12%, var(--color-surface))`,
`oklch(from var(--color-accent) calc(l - 0.06) c h)`. No `-hover`/`-50`/
per-opacity tokens. (`alpha()`, the `derive` block, and `derive.strategy` are
planned, not yet implemented.)

## Dark mode

`semantic.*.dark` generates the `@media (prefers-color-scheme: dark)` block.
Do not hand-write dark overrides for semantic tokens. With
`colorBinding: "wp-preset"` the dark block is omitted for preset-bound colors.

## Config (`theme.designTokens`)

`enabled`, `source`, `colorBinding` (`auto` | `independent` | `wp-preset`;
`auto` → `wp-preset` for block-based, else `independent`), `legacyAliases`
(default `false`), `contrast.{level,onFail}`. **Classic never emits
`--wp--preset--` refs.**

## Commands

| Command | Purpose |
| --- | --- |
| `npm run rig:tokens` | Regenerate CSS vars + theme.json (+ Tailwind when enabled) |
| `npm run rig:tokens:setup [-- --apply]` | v1→v2 upgrade + legacy-name codemod (dry-run default; backups in `.rig-backup/`) |
| `npm run rig:tokens:import -- --from <dtcg.json> [--mode merge\|replace] [--apply]` | Import DTCG / Figma JSON |
| `npm run rig:tokens:export [--out <file>]` | Export to DTCG (default `design/tokens.dtcg.json`) |

## Gotchas

- Never edit `_tokens.generated.css` — regenerate instead. Tailwind files
  (`config/tailwind.tokens.js`, `tailwind.config.js`) are generated **only when
  `theme.designTokens.emit.tailwind` is enabled**; WP Rig ships without Tailwind.
- Never rename Gutenberg color **slugs** (`has-*-color`) automatically; they
  live in saved content.
- After editing `tokens.json`, run `rig:tokens` (or a build) so the editor
  palette and CSS stay in sync (plus Tailwind when enabled).
- Contrast gate runs at `warn` (6 known AA diagnostics on the default palette).
- Lint: `wprig/no-undefined-custom-properties` and `wprig/no-hardcoded-colors`
  (warnings) catch dangling/duplicated values.
