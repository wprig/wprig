# Design Tokens & CSS Custom Properties

This is the theme-developer contract for WP Rig's design-token system
(SPEC-017). It covers where tokens live, how they are named, how dark mode and
color math work, and how to add/rename/import tokens.

## Mental model

```
config/tokens.json  ──(npm run rig:tokens)──▶  _tokens.generated.css   (gitignored, generated)
        │                                              │
        │                                              ▼
        │                                      _custom-properties.css   (thin wrapper, imports both)
        │                                              ▲
        └────────── hand edits ─────────────────▶  _tokens.custom.css    (hand-authored)
        │
        ├──▶ theme.json          (via config/theme.custom.json overlay)
        └──▶ tailwind.config.js  (via config/tailwind.tokens.js + tailwind.custom.js)
```

- **`config/tokens.json` is the seed, not a style store.** It describes the
  default color/type/space system and the editor palette only. Component styles
  stay in CSS. There is **no CSS-as-JSON**.
- **CSS custom properties are the interface.** Components read `var(--…)`.
- **Pure-CSS authors are first-class.** `_tokens.custom.css` is hand-editable;
  a theme can ignore `tokens.json` entirely.

## Files

| Path | Role | Edit? |
| --- | --- | --- |
| `config/tokens.json` | Layered token source (v2) | yes (or use `rig:tokens:import`) |
| `config/tokens.schema.json` | JSON Schema for editor IntelliSense | no |
| `assets/css/src/_tokens.generated.css` | Generated custom properties (gitignored) | **never** — run `npm run rig:tokens` |
| `assets/css/src/_tokens.custom.css` | Hand-authored vars/overrides | yes |
| `assets/css/src/_custom-properties.css` | Wrapper importing both | no (transitional) |
| `config/theme.custom.json` | Hand-authored `theme.json` fragments | yes |
| `config/tailwind.custom.js` | Hand-authored Tailwind extensions | yes |
| `config/tailwind.tokens.js` | Generated Tailwind values (gitignored) | **never** |
| `tailwind.config.js` | Generated shell importing the two above (gitignored) | **never** |

Generated files are gitignored (like `theme.json`) because their content depends
on `theme.designTokens.colorBinding` / the active paradigm. Regenerate with
`npm run build` or `npm run rig:tokens`. `build:css`, `dev:css`, and `lint:css`
run `rig:tokens` automatically (pre-hooks), so a fresh checkout builds without a
manual step.

`theme.json` generation is a **pure function of committed inputs**: when
`config/theme.custom.json` exists it is the sole hand-authored source and the
previous generated `theme.json` is not read back in (so deletions and edits
propagate correctly).

## Token taxonomy (three tiers)

1. **Primitives** — raw values, no meaning: `primitives.color.brand.500`,
   `primitives.space.base`, `primitives.font.size.base`.
2. **Semantic** — roles, with a `light` + `dark` value each:
   `semantic.surface`, `semantic.text`, `semantic.state.danger`.
3. **Component** (optional) — component-scoped aliases: `component.button.bg`.

Rules: references use `{dotted.path}`; primitives may only be referenced by
semantic; semantic may never reference another semantic; semantic colors must
declare both `light` and `dark` (unless `meta.darkMode: "none"`).

### Naming conventions

| Tier | Pattern | Example |
| --- | --- | --- |
| Primitive color | `--color-{hue}-{step}` | `--color-brand-500` |
| Semantic color | `--color-{role}` | `--color-surface`, `--color-state-danger` |
| Space | `--space-{step}` | `--space-base` |
| Layout | `--layout-{slug}` | `--layout-content` |
| Font family / size / leading | `--font-family-{slug}` / `--font-size-{slug}` / `--line-height-{slug}` | `--font-family-highlight` |
| Breakpoint | `--breakpoint-{slug}` | `--breakpoint-tablet` |
| Radius / hue / alpha | `--radius-{slug}` / `--hue-{slug}` / `--alpha-{slug}` | `--alpha-weak` |

## Color model: math-first, minimal names

Encode **intent**, not computation. A name exists for a role or an axis, never
for an intersection. Derive shades, tints, opacities, and on-colors with CSS
math instead of naming every combination.

```css
/* Alpha from one color token — no --color-accent-50 */
border-color: rgb(from var(--color-accent) r g b / var(--alpha-weak));

/* Tint toward the surface (correct in light AND dark) */
background: color-mix(in oklab, var(--color-accent) 12%, var(--color-surface));

/* Shade for hover/active — derived, not declared */
background: oklch(from var(--color-accent) calc(l - 0.06) c h);

/* Complement without a new token */
color: oklch(from var(--color-accent) l c calc(h + 180));
```

- `alpha(from var(--x) / 50%)` is **planned, not yet wired** (`platform.alphaFunction:
  "progressive"` in SPEC-017 §4.5.8) — it is at-risk in the spec and ~58%
  supported; the baseline to use today is relative color syntax (~87%).
- The `derive` block and `theme.designTokens.derive.strategy` are **planned
  (SPEC-017 §4.5.4, §12.1), not yet implemented**. Today, write the CSS math
  inline as above; `theme.json` / Tailwind consumers get concrete values from
  the primitives/semantic tokens themselves.

## Dark mode

- `semantic.*.dark` values generate an `@media (prefers-color-scheme: dark)`
  block in `_tokens.generated.css`. Do **not** hand-write dark overrides for
  semantic tokens.
- With `colorBinding: "wp-preset"`, the generated dark block is omitted for
  preset-bound colors (WordPress presets are single-valued); the Site Editor /
  Global Styles own dark.
- `meta.darkMode: "none"` disables the generated dark block (used by the v1→v2
  upgrade so existing hand-authored dark CSS keeps working).
- `light-dark()` and a `[data-theme]` toggle are **planned opt-ins** (SPEC-017
  §10.5, §17), not implemented.

## Configuration

`config/config.default.json` → `theme.designTokens`:

| Key | Values | Default | Meaning |
| --- | --- | --- | --- |
| `enabled` | boolean | `true` | Master switch |
| `source` | path | `config/tokens.json` | Token file |
| `colorBinding` | `auto` \| `independent` \| `wp-preset` | `auto` | How semantic vars bind |
| `legacyAliases` | boolean | `false` | Emit `--old: var(--new)` aliases (opt-in for un-migrated themes) |
| `contrast.level` | `AA` \| `AAA` \| `off` | `AA` | Contrast gate |
| `contrast.onFail` | `warn` \| `error` | `warn` | Gate severity |

`auto` resolves via the active paradigm: `classic`/`universal` → `independent`,
`block-based` → `wp-preset`. **Classic never emits `--wp--preset--` refs.**

## Workflows

### Pure CSS author
Edit `_tokens.custom.css`, use `var(--…)` in partials. `tokens.json` is optional.

### Token-driven
Edit `config/tokens.json` → `npm run rig:tokens` → commit the CSS you changed
(never the generated files).

### Figma-driven
```
Figma Variables → Tokens Studio → DTCG JSON
  → npm run rig:tokens:import -- --from design/figma.tokens.json [--apply]
  → npm run rig:tokens
```
Round-trip back with `npm run rig:tokens:export` (default
`design/tokens.dtcg.json`). Unmapped tokens are reported, never silently
dropped.

### Site Editor (block-based)
Edit Global Styles → `npm run rig:bake styles` → `config/user-styles.json`
(SPEC-016) → `rig:tokens`. The user layer wins on content; tokens keep SSOT
keys.

### Tailwind
Token values are generated into `config/tailwind.tokens.js`; add your own
extensions in `config/tailwind.custom.js` (per-key merge, custom wins).

## Precedence

`tokens < theme.custom.json < user-styles.json`, with SSOT keys
(`$schema`, `version`, `settings.viewport`, `settings.blockVisibility`) always
owned by tokens.

## Adding & renaming tokens

- **Add:** edit `tokens.json` (or `rig:tokens:import`), run `rig:tokens`.
- **Rename:** run `npm run rig:tokens:setup` (dry-run first) to rewrite legacy
  names across CSS/PHP/JS, then `--apply`, then `rig:tokens`. Never rename
  Gutenberg color **slugs** (`has-*-color`) automatically — they live in saved
  content.
- **Deprecate:** legacy aliases are emitted while `legacyAliases: true`; the
  codemod removes the layer when usages are rewritten.

## Upgrading an existing theme (v1 → v2)

Existing themes using the old flat `tokens.json` (top-level `colors`,
`typography`, `spacing`, `breakpoints`) migrate in one reviewed run:

```
npm run rig:tokens:setup            # dry-run: reports schema + the rename plan
npm run rig:tokens:setup -- --apply # writes tokens.json v2 + rewrites usages
npm run rig:tokens                  # regenerate
npm run lint:css                    # no-undefined-custom-properties = safety net
```

What it does:

1. **Schema:** `upgradeV1ToV2` maps the flat keys into `primitives` +
   `semantic`, and sets `meta.darkMode: "none"` so your existing hand-authored
   dark CSS keeps working (add `semantic.*.dark` pairs later to switch dark
   generation on).
2. **Names:** the collapse-aware codemod rewrites legacy custom-property names
   (`--content-width` → `--layout-content`, `--global-font-color` →
   `--color-text`, `--mobile-breakpoint` → `--breakpoint-tablet`, …) across
   `assets/css/src/**`, `**/*.php`, and `assets/js/src/**`. It does **not**
   touch generated files or Gutenberg color **slugs**.
3. **Backups:** every touched file is copied to
   `.rig-backup/<timestamp>/tokens-setup/` before writing. Nothing is deleted.
4. **Idempotent:** re-running on a v2 tree is a no-op.

`legacyAliases` defaults to `false`. If you need a staged rollout, set
`theme.designTokens.legacyAliases: true` to keep emitting `--old: var(--new)`
aliases while you migrate usages yourself, then flip it off.

## Lint & gates

- `wprig/no-undefined-custom-properties` — flags `var(--x)` not in the token
  inventory (warn; promote to error after burn-down).
- `wprig/no-hardcoded-colors` — flags literals that exactly match a token value.
- Build gates: schema validation, reference resolution, WCAG contrast, and the
  classic preset-ref assertion.

### Known contrast warnings (shipped palette)

The default palette has 6 WCAG AA diagnostics (the gate runs at `warn`): link
hover, accent, quote-citation (dark), and the success/warning/info state colors
on `surface` (light). These are **known** and tracked for a palette pass; flip
`contrast.onFail` to `error` once the palette is remediated. Brand themes with
their own palettes should treat the report as authoritative for their values.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run rig:tokens` | Regenerate CSS vars + theme.json + Tailwind |
| `npm run rig:tokens:setup` | One-time v1→v2 upgrade + legacy-name codemod |
| `npm run rig:tokens:import` | DTCG/Figma JSON → `tokens.json` |
| `npm run rig:tokens:export` | `tokens.json` → DTCG JSON |
| `npm run build` / `npm run dev` | Full build (regenerates tokens first) |

> `npm run build:css` alone does not regenerate tokens; run `rig:tokens` (or a
> full `build`) first on a fresh checkout, since `_tokens.generated.css` is
> gitignored.
