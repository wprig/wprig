# SPEC-017 — Design Token System v2 & Paradigm-Aware Token Binding

> **Status:** Proposed (2026-09-16) — planning doc, not yet implemented
> **Paradigm tags:** token core `all`; WP-preset binding + palette sync
> `block-based` (universal inherits, classic never sees it)
> **Depends on:** SPEC-016 (`config/user-styles.json` overlay). This SPEC keeps
> `scripts/tasks/tokens.js` as the **sole theme.json writer** and adds inputs to
> it, never a second writer.
> **Deliverables:** SPEC-017 (this file) + `docs/DESIGN.md` (Phase 5, theme-dev
> facing).
> **Owner:** Robruiz · **Tracking:** `../../FRAMEWORK_ROADMAP.md`

---

## 0. TL;DR

WP Rig today generates CSS custom properties from a flat `config/tokens.json`
by regex-surgery on a single `_custom-properties.css` that also holds
hand-authored variables and a hand-written dark-mode block. This SPEC replaces
that with:

1. a **layered token schema** (primitives → semantic → component) with
   light/dark pairs and OKLCH-authored color scales;
2. a **generator that owns a whole file** (no regex surgery) plus a separate
   hand-authored file for pure-CSS authors;
3. **config-driven binding** so a dev chooses, per project, whether semantic
   vars are *independent* values or *aliases of WordPress preset vars*
   (`--wp--preset--color--*`) — defaulting per paradigm;
4. a **one-time `rig:tokens:setup` migration** that upgrades the schema and
   rewrites legacy variable names (collapse-aware codemod);
5. **lint + build gates** (undefined-var, hardcoded-color, contrast, schema);
6. **`DESIGN.md`** as the theme-dev-facing contract;
7. a **math-first color model** that keeps names to roles and axes
   (hue/lightness/alpha) and derives shades, tints, opacities, and on-colors
   with CSS color math plus a build-time mirror (§4.5);
8. **modern-platform emission** — cascade layers, curated `@property` typed
   tokens, math functions, and a11y media queries (`prefers-contrast`,
   `forced-colors`) used where they shrink the token set or remove JS (§7.6).

The non-negotiable: **CSS stays CSS.** JSON is a seed for the *default* color
system and the Gutenberg palette, never a home for component styles. There is
no CSS-as-JSON layer. IDE autocomplete and `var()` references keep working
because every token is a real, committed CSS custom property.

---

## 1. Problem statement (current-state audit)

### 1.1 The generated block is entangled with hand-authored CSS

`assets/css/src/_custom-properties.css` is a single `:root {}` containing:

- a marker-delimited **generated** block (`/* Generated from tokens.json */` …
  `/* End of generated tokens */`), and
- **hand-authored** variables below it, including a hand-written
  `@media (prefers-color-scheme: dark)` block **inside** `:root`.

`scripts/tasks/tokens.js:440` rewrites the generated region with
`/:root\s*{([^}]*)}/s` + a marker regex. That is fragile: the regex cannot see
past the first `}`, the dark block is invisible to the generator, and the two
authoring models (generated vs. hand) live in one file.

### 1.2 Dark mode is not generated and is partially broken

`config/tokens.json` has **no dark values**. The dark block in
`_custom-properties.css:74-93` is hand-authored and only overrides ~10 legacy
names. Tokens such as `--color-text: #333` never flip — a real correctness gap,
not just an aesthetic one.

### 1.3 Legacy naming soup with silent duplication

| Legacy name | Duplicate of | Same value? |
| --- | --- | --- |
| `--global-font-color` | `--color-text` | yes (`#333`) |
| `--spacing-content-width` | `--content-width` | yes (`45rem`) |
| `--color-theme-primary` | `--color-primary` | yes (`#e36d60`) |
| `--color-theme-red` | `--color-red` | yes (`#c0392b`) |
| `--color-theme-{green,blue,yellow,black,grey,white}` | `--color-{...}` | yes |
| `--mobile-breakpoint` | — | **misnomer**: holds the *tablet* value (`782px`), documented as BC-kept in `tokens.js:431-438` |

Usage counts (src CSS, `var(--x)` occurrences): `--content-width` 19,
`--highlight-font-family` 15, `--global-font-color` 11, `--border-color-light`
11, plus a long tail of `--color-theme-*` / `--color-custom-*`. Every one of
these is a rename hazard with no tooling to rename it.

### 1.4 No semantic layer

`tokens.json` mixes primitives (`red`, `blue`, `grey`) with roles (`text`,
`background`, `primary`) in one flat map. There is no way to express
"surface" or "border" or "danger" independent of a literal hue, so dark mode,
theming, and rebrands cannot be expressed declaratively.

### 1.5 No enforceable contract

- Stylelint (`.stylelintrc`) has `custom-property-no-missing-var-function`
  (catches `--foo` read without `var()`), but **no rule against undefined
  `var(--foo)`** and **no rule against hardcoded token-able values**.
  `.ai/skills/styles/SKILL.md:118-120` calls hardcoding a "lint-adjacent smell"
  — nothing enforces it.
- No `DESIGN.md`. Token rules are scattered across
  `.ai/skills/styles/SKILL.md`, `.ai/skills/typography/SKILL.md`,
  `docs/css-architecture.md`, and `CHANGELOG.md`.

### 1.6 What already works and must be preserved

- `rig:tokens` (`scripts/propagate-tokens.js` → `propagateTokens()`) already
  propagates to four targets: `theme.json`, CSS vars, `_custom-media.css`,
  `tailwind.config.js`.
- `config/paradigms.json` is the SSOT for `classic` / `universal` /
  `block-based`; `scripts/lib/paradigm.js` exposes `getActiveThemeType()` /
  `isFeatureEnabled(tag)`. Theme type resolves from `theme.themeType` through
  `config.default.json → config.json → config.local.json`.
- `findCorePresetCollisions()` already warns when generated preset slugs
  collide with WP core defaults.
- SPEC-016's `config/user-styles.json` overlay already lets Site Editor
  decisions win over tokens without breaking determinism.
- `assets/css/src/**` is committed (`.gitignore` excludes `assets/css/*` except
  `src/`), so committed generated CSS is indexable by IDEs.

---

## 2. Design principles

These are the guardrails every decision below must satisfy. They encode the
explicit constraint: **control it with scripts, keep CSS as CSS, do not build a
CSS-as-JSON system.**

| # | Principle | Consequence |
| --- | --- | --- |
| P1 | **CSS custom properties are the public interface.** | Every token exists as a real, committed custom property. Components read `var(--…)`. |
| P2 | **JSON is a seed, not a style store.** | `tokens.json` only describes the *default* color/type/space system and the editor palette. No selectors, no component styles, no layout rules. |
| P3 | **Pure-CSS authors are first-class.** | `_tokens.custom.css` is hand-editable; a dev can ignore `tokens.json` entirely and still have a valid theme. |
| P4 | **IDE-first.** | Generated CSS is committed, unminified, and syntactically plain so editors index it for autocomplete/peek. |
| P5 | **One source of truth per value.** | A value is defined once; everything else references it. No duplicate literals. |
| P6 | **Config-driven, paradigm-aware.** | Behavior is chosen in `config.json`, defaulted by `theme.themeType`, never hardcoded per file. |
| P7 | **Scripts own mechanical work.** | Generation, migration, renaming, validation are scripts. Humans edit source, not generated output. |
| P8 | **No surprise breakage.** | Renames ship with a migration script and a documented slug-vs-var policy. |
| P9 | **Deterministic builds.** | Same inputs → byte-identical outputs (extends SPEC-016 §3.2). |
| P10 | **Platform-first.** | Prefer Baseline CSS (`@layer`, `@property`, color math, math functions) over JS or extra tokens when it removes code. |

### 2.1 Explicit non-goals

- **No CSS-in-JS, no CSS-as-JSON.** We are not moving selectors, media
  queries, or component styles into JSON. (Principle P2.)
- **No required build step between a dev and their CSS.** After
  `rig:tokens:setup`, day-to-day color edits are plain CSS edits.
- **No framework-specific token format lock-in.** The internal schema must be
  importable from / exportable to W3C DTCG (Design Tokens Community Group) JSON
  so Figma/Tokens Studio/Style Dictionary pipelines work.
- **No silent slug renames.** Gutenberg color *slugs* are content-addressed
  (`has-primary-color` in saved post markup). Slugs migrate only with an
  explicit, documented decision — never as a side effect of a CSS var rename.

---

## 3. Goals

| # | Goal | Success signal |
| --- | --- | --- |
| G1 | Layered, semantic token schema | `tokens.json` has `primitives`/`semantic`/`component`; dark pairs live in the schema |
| G2 | Generator owns whole files | `tokens.js` writes `_tokens.generated.css` with zero regex surgery; no markers needed |
| G3 | Pure-CSS authoring preserved | A theme with no `tokens.json` still builds; `_tokens.custom.css` is the only hand-edit surface |
| G4 | Config-selectable binding | `theme.designTokens.colorBinding` supports `independent` and `wp-preset`; classic cannot emit `--wp--preset--` refs |
| G5 | One-time migration | `npm run rig:tokens:setup` upgrades schema + collapses legacy names in one reviewed run |
| G6 | Enforceable contract | Stylelint + build gates fail/warn on undefined vars, hardcoded colors, contrast, schema |
| G7 | Interoperable | DTCG import/export round-trips; Figma-first workflow documented |
| G8 | Documented | `docs/DESIGN.md` covers all paradigms and workflows |

---

## 4. Token schema v2 (`config/tokens.json`)

### 4.1 Shape

```jsonc
{
  "$schema": "./tokens.schema.json",
  "meta": {
    "version": 2,
    "colorSpace": "hex",          // "hex" | "oklch" (see §10.3)
    "darkMode": "media",          // "media" | "none" | "class" (future)
    "generator": "wp-rig"
  },

  "primitives": {
    "color": {
      "brand":   { "500": "#e36d60" },
      "accent":  { "500": "#41848f" },
      "neutral": { "0": "#ffffff", "100": "#ecf0f1", "500": "#95a5a6",
                   "700": "#333333", "900": "#1c2833" },
      "red":     { "500": "#c0392b" },
      "green":   { "500": "#27ae60" },
      "blue":    { "500": "#2980b9" },
      "yellow":  { "500": "#f1c40f" }
    },
    "space":  { "3xs": "0.25rem", "2xs": "0.5rem", "xs": "0.75rem",
                "base": "1rem", "lg": "1.5rem", "xl": "2rem", "2xl": "3rem" },
    "font": {
      "family": { "base": "\"Open Sans\", \"Helvetica Neue\", \"Arial\", sans-serif",
                  "highlight": "\"Roboto Condensed\", \"Helvetica Neue\", \"Arial Narrow\", sans-serif" },
      "size":   { "small": "0.8rem", "base": "1rem", "large": "1.8rem", "xlarge": "2.4rem" },
      "leading": { "base": "1.4" }
    },
    "layout": { "content": "45rem", "wide": "64rem" },
    "breakpoint": { "mobile": "480px", "tablet": "782px" },
    "radius": { "sm": "0.25rem", "md": "0.5rem", "pill": "9999px" },
    "hue":   { "accent": 32, "accent-2": 208 },
    "alpha": { "weak": "15%", "medium": "40%", "strong": "70%" }
  },

  "semantic": {
    "surface":   { "light": "{primitives.color.neutral.0}",   "dark": "#121212" },
    "surface-subtle": { "light": "#f6f6f6",                   "dark": "#1e1e1e" },
    "text":      { "light": "{primitives.color.neutral.700}", "dark": "#f5f5f5" },
    "text-muted":{ "light": "#6c7781",                        "dark": "#a8a8a8" },
    "border":    { "light": "#cccccc",                        "dark": "#3a3a3a" },
    "accent":    { "light": "{primitives.color.brand.500}",   "dark": "#f08b80" },
    "link":      { "light": "#0073aa",                        "dark": "#4e9efd" },
    "link-hover":{ "light": "#00a0d2",                        "dark": "#bbdfff" },
    "focus-ring":{ "light": "#0073aa",                        "dark": "#7cc0ff" },
    "code-surface": { "light": "#eeeeee",                     "dark": "#2b2b2b" },
    "code-text":    { "light": "#333333",                     "dark": "#e6e6e6" },
    "state": {
      "danger":  { "light": "{primitives.color.red.500}",   "dark": "#ff8a80" },
      "success": { "light": "{primitives.color.green.500}", "dark": "#7ee2a8" },
      "warning": { "light": "{primitives.color.yellow.500}","dark": "#ffd95e" },
      "info":    { "light": "{primitives.color.blue.500}",  "dark": "#8abfff" }
    }
  },

  "component": {
    "button": { "bg": "{semantic.accent}", "fg": "{semantic.surface}",
                "radius": "{primitives.radius.sm}" }
  },

  "derive": {
    "semantic.accent-hover": { "op": "shade", "from": "semantic.accent", "amount": 0.06 },
    "semantic.accent-soft":  { "op": "mix", "from": "semantic.accent",
                               "with": "semantic.surface", "amount": 0.12 },
    "semantic.on-accent":    { "op": "contrast-on", "from": "semantic.accent" }
  }
}
```

The `derive` block is optional; most variation should be expressed with inline
color math in component CSS rather than named tokens (§4.5).

### 4.2 Rules

1. **Tiers are one-directional.** `primitives` may only be referenced by
   `semantic`; `semantic` by `component`. A primitive may never reference a
   semantic. References use `{dotted.path}` syntax.
2. **Every semantic color has `light` and `dark`** (or an explicit
   `{ "light": v, "dark": v }` if intentionally identical). A semantic color
   without a `dark` is a schema error when `meta.darkMode !== "none"`.
3. **Primitives are never read by component CSS.** Only semantic/component
   tokens become public vars (a primitive *may* be exposed as a var when it is
   part of a scale the theme wants to use directly — see §4.4).
4. **Flat legacy keys are migrated, not supported.** The v1 flat shape
   (`colors`, `typography`, `spacing`, `breakpoints`) is accepted by
   `rig:tokens:setup` only, which upgrades it to v2. `tokens.js` v2 rejects
   v1 shape with a message pointing at `rig:tokens:setup`.
5. **`meta.colorSpace`** selects output format (§10.3): `hex` (default) or
   `oklch` (opt-in, with hex fallback).
6. **Unknown keys are schema errors** (catches typos such as `semantic.surfaces`).
7. **Derived tokens are computed, not authored.** `derive` entries (§4.5.4) are
   evaluated by the generator and marked `derived` in the inventory; a derived
   path may not also be hand-authored, and component CSS should prefer inline
   color math over naming a derived token.

### 4.3 Reference resolution

- `{primitives.color.brand.500}` resolves to the literal value at generation
  time **for `independent` binding**, and to
  `var(--wp--preset--color--brand-500)` only where §5 says presets are the
  source.
- Unresolvable references are a hard error naming the token path.

### 4.4 CSS variable naming convention

| Tier | Pattern | Example |
| --- | --- | --- |
| Primitive color | `--color-{hue}-{step}` | `--color-brand-500` |
| Semantic color | `--color-{role}[-{variant}]` | `--color-surface`, `--color-state-danger` |
| Space | `--space-{step}` | `--space-base` |
| Font family | `--font-family-{slug}` | `--font-family-highlight` |
| Font size | `--font-size-{slug}` | `--font-size-large` |
| Line height | `--line-height-{slug}` | `--line-height-base` |
| Layout | `--layout-{slug}` | `--layout-content`, `--layout-wide` |
| Breakpoint | `--breakpoint-{slug}` | `--breakpoint-tablet` |
| Radius | `--radius-{slug}` | `--radius-md` |
| WP preset (block-based) | `--wp--preset--{type}--{slug}` | `--wp--preset--color--surface` |

**Deliberate renames** (executed once by the migration script, §8):

| Legacy | v2 |
| --- | --- |
| `--content-width` | `--layout-content` |
| `--spacing-content-width` | `--layout-content` |
| `--spacing-wide-width` | `--layout-wide` |
| `--global-font-color` | `--color-text` |
| `--background-color` | `--color-surface` |
| `--content-background-color` | `--color-surface` |
| `--sub-content-background-color` | `--color-surface-subtle` |
| `--header-background-color` / `--footer-background-color` | `--color-surface-subtle` |
| `--border-color-light` | `--color-border` |
| `--border-color-dark` | `--color-border-strong` |
| `--color-theme-primary` | `--color-accent` |
| `--color-theme-secondary` | `--color-accent-secondary` |
| `--color-theme-{red,green,blue,yellow}` | `--color-state-{danger,success,info,warning}` |
| `--color-theme-{black,grey,white}` | `--color-neutral-{900,500,0}` |
| `--color-custom-daylight` / `--color-custom-sun` | `--color-custom-{daylight,sun}` (kept; no semantic equivalent) |
| `--global-font-family` | `--font-family-base` |
| `--highlight-font-family` | `--font-family-highlight` |
| `--global-font-line-height` | `--line-height-base` |
| `--global-font-size` | `--font-size-root` (unitless numeric → document) |
| `--font-size-regular` / `--font-size-larger` | `--font-size-base` / `--font-size-xl` |
| `--mobile-breakpoint` | `--breakpoint-tablet` (**fixes the misnomer**) |
| `--spacing-base` | `--space-base` |
| `--dropdown-symbol-width` | `--dropdown-symbol-width` (kept; component token) |

The mapping table is data, not code: it lives in
`config/token-migrations.json` so `rig:tokens:setup` and the tests share one
source.

### 4.5 Derived color math — minimal names, maximal math

**Principle:** never name a combination. Store orthogonal scales (hue,
lightness, alpha) once and combine them with CSS color math at the point of
use; mirror the same math at build time to emit static values where CSS math
cannot reach (`theme.json`, Tailwind, older targets).

#### 4.5.1 The name-explosion problem

A naive system names every intersection: `--color-accent`,
`--color-accent-hover`, `--color-accent-active`, `--color-accent-50`,
`--color-accent-10`, `--color-accent-dark`, `--color-accent-complement`… For
H hues × L lightness steps × A alpha steps the count is **multiplicative**
(H × L × A). Every one is a rename hazard and a sync burden.

The fix: keep the scales **orthogonal and unnamed at their intersection**, and
compute the intersection.

#### 4.5.2 The four orthogonal primitives

| Axis | Stored as | Example | Combined with |
| --- | --- | --- | --- |
| Hue | number (deg) | `--hue-accent: 32` | `oklch(l c var(--hue-accent))` |
| Lightness | relative op | — | `oklch(from … calc(l ± δ) c h)` |
| Alpha | percentage | `--alpha-weak: 15%` | `rgb(from … / var(--alpha-weak))` |
| Mix base | existing color | `--color-surface` | `color-mix(in oklab, … )` |

Names required: **N hues + 3 alphas**. Combinations available: unlimited. That
is additive, not multiplicative — the entire point.

#### 4.5.3 Recipes (runtime, in component CSS)

```css
/* Alpha from one color token — no --color-accent-50 */
.rule { border-color: rgb(from var(--color-accent) r g b / var(--alpha-weak)); }

/* Tint toward the surface (soft background) */
.badge { background: color-mix(in oklab, var(--color-accent) 12%, var(--color-surface)); }

/* Shade for hover/active — derived, not declared */
.button:hover { background: oklch(from var(--color-accent) calc(l - 0.06) c h); }

/* Complement / analogous without new tokens */
.accent-2 { color: oklch(from var(--color-accent) l c calc(h + 180)); }

/* Shadow from the text color — no --shadow-color token */
.card { box-shadow: 0 1px 2px rgb(from var(--color-text) r g b / 25%); }

/* Disabled = mix toward surface; correct in light AND dark automatically */
.button:disabled {
	background: color-mix(in oklab, var(--color-accent) 40%, var(--color-surface));
}
```

For **alpha-only** changes, `alpha(from …)` is a more concise,
color-space-preserving alternative — see §4.5.8 for why it is opt-in rather
than the default.

**The dark-mode win:** `color-mix(… , var(--color-surface))` follows the
surface token, so a single recipe is correct in both themes — no
`--color-accent-soft-dark` pair to maintain.

#### 4.5.4 When to declare a derived token (the `derive` block)

CSS math cannot reach three consumers: `theme.json` (hex strings only),
Tailwind config, and the `@supports` fallback for targets without
`color-mix()` / relative colors. For those, declare the derivation once and let
the generator compute it (see the `derive` block in §4.1):

```jsonc
"derive": {
  "semantic.accent-hover": { "op": "shade", "from": "semantic.accent", "amount": 0.06 },
  "semantic.accent-soft":  { "op": "mix", "from": "semantic.accent",
                             "with": "semantic.surface", "amount": 0.12 },
  "semantic.on-accent":    { "op": "contrast-on", "from": "semantic.accent" }
}
```

| Op | Meaning | Runtime equivalent |
| --- | --- | --- |
| `shade` / `tint` | Adjust OKLCH lightness by `amount` | `oklch(from <from> calc(l ∓ amount) c h)` |
| `mix` | Blend toward `with` by `amount` | `color-mix(in oklab, <from> (amount*100)%, <with>)` |
| `alpha` | Re-emit `<from>` at `amount` alpha | `rgb(from <from> r g b / amount)` |
| `rotate-hue` | Rotate hue by `amount` degrees | `oklch(from <from> l c calc(h + amount))` |
| `contrast-on` | Pick a readable foreground (neutral 0/900) by WCAG luminance | (no CSS equivalent — build-time only) |

**Rule:** declare a derived token only when a non-CSS consumer needs it
(theme.json / Tailwind / fallback) or it is reused in many places. Otherwise
write the `color-mix()` / relative-color expression inline. Derived tokens are
flagged `derived: true` in the inventory so lint and the setup codemod treat
them as computed and never hand-authored.

#### 4.5.5 Build-time mirror & fallbacks

Author the formula once; the generator emits two forms so static and
progressive paths agree:

```css
:root {
	/* fallback: resolved from accent 12% + surface, in OKLCH → hex */
	--color-accent-soft: #f7e6e3;
}

@supports (color: color-mix(in oklab, red, blue)) {
	:root {
		--color-accent-soft: color-mix(in oklab, var(--color-accent) 12%, var(--color-surface));
	}
}
```

Why the mirror instead of relying on the transpiler: **verified in the spike
(§18.2)** — Lightning CSS 1.33 resolves color functions **only when every
operand is a literal**; with `var()` it passes them through unchanged. Literal
derived tokens (the mirror) are auto-transpiled into an sRGB fallback + modern
form (`color-mix(in oklab, red 12%, white)` → `#ffebe7` + `lab(…)`), so they
need no hand-written `@supports`. `var()`-based runtime math does. Build-time
math is therefore both the fallback and the `theme.json` / Tailwind source.

**Inline-math fallback:** component-level inline `color-mix()` has no generated
fallback; for a project that must support pre-2023 targets, set
`theme.designTokens.derive.strategy: "build"` (§12.1) to prefer declared
`derive` tokens everywhere and keep component CSS literal-free of math.

#### 4.5.6 Naming budget rule

> **Encode intent, not computation.** A name exists for a *role* or an *axis*,
> never for an *intersection*. If a formula can produce it, do not name it.

Corollaries:

- No `-hover` / `-active` / `-disabled` color tokens by default — derive from
  the base.
- No per-opacity color tokens; use `--alpha-*` + relative color.
- No per-shade color tokens unless the shade is a genuine design primitive
  (then it belongs in `primitives.color` as a generated ramp — §10.3).
- The alpha scale stays tiny (3 steps) and is reused across **all** hues.

#### 4.5.7 Contrast caveat

Derived composites can silently fail contrast. The contrast gate (§7.5)
resolves `mix` / `shade` / `contrast-on` math at build time and checks the
**resulting** color, not the base. `contrast-on` is the sanctioned way to get
readable text on an arbitrary accent without hand-picking a value per theme.

#### 4.5.8 Alpha-only derivation: `alpha()` vs relative color

CSS Color 5 §4.10 adds `alpha(from <color> / <alpha-value>)`, which changes
**only** the alpha channel and preserves the origin color space:

```css
alpha(from var(--color-accent) / 50%);
alpha(from var(--color-accent) / calc(alpha * 0.5)); /* relative to origin alpha */
```

It is more concise and color-space-agnostic than `rgb(from … r g b / …)`
(which forces an sRGB conversion and can clip wide-gamut colors). But as of
2026 it is **not** a safe default:

| | `rgb(from …)` / `oklch(from …)` | `alpha(from …)` |
| --- | --- | --- |
| Global support | ~87% (Chrome 131+, Safari 18+, Firefox 133+) | ~58% (Chrome/Edge 151+, Firefox 155+, Safari 27+) |
| Spec status | stable (CSS Color 5 §4) | **at-risk** (may be dropped in CR) |
| Color space | converts to the named space | preserves origin space |
| Channel knowledge | requires `r g b` / `l c h` | none |

**Stance:** the baseline is relative color syntax (`rgb(from …)`); `alpha()` is
a **progressive enhancement** emitted behind a feature query when
`theme.designTokens.platform.alphaFunction` is enabled:

```css
.rule {
	/* baseline — works ~87% */
	border-color: rgb(from var(--color-accent) r g b / 50%);
}

@supports (color: alpha(from red / 0.5)) {
	.rule {
		/* progressive — preserves origin color space (wide-gamut safe) */
		border-color: alpha(from var(--color-accent) / 50%);
	}
}
```

Because Lightning CSS cannot transpile `var()`-based color functions, the
`@supports` fallback is **mandatory**, not optional. The build-time mirror
(§4.5.5) still supplies the static value for theme.json / Tailwind. Spike note
(§18.1): Lightning CSS 1.33 **parses and computes literal**
`alpha(from red / 50%)` → `rgba(255,0,0,.5)` and passes the `var()` form
through with no error or warning — so emitting it is build-safe.

Config: `theme.designTokens.platform.alphaFunction` — `"off"` (default) |
`"progressive"`. `"off"` keeps output at the ~87% baseline; `"progressive"`
adds the `@supports` layer for wide-gamut projects.

---

## 5. Config-driven binding (the "either way" requirement)

### 5.1 The two modes

A semantic token can be **bound** to WordPress preset vars or hold
**independent** values. Both are first-class and selected in config.

**`independent`** — WP Rig's own namespace is canonical:

```css
:root {
	--color-surface: #ffffff;
	--color-text: #333333;
}
```

`theme.json` is generated from the same tokens (so presets exist), but the
semantic vars do **not** reference `--wp--preset--*`. CSS resolves everywhere,
with or without WordPress enqueueing preset styles.

**`wp-preset`** — WordPress is the source of truth; semantic vars alias presets:

```css
:root {
	--color-surface: var(--wp--preset--color--surface);
	--color-text: var(--wp--preset--color--text);
}
```

`theme.json`'s palette is the single writer; editing a color in the Site
Editor Global Styles changes `--wp--preset--color--surface` and every alias
follows. Requires the preset stylesheet to be enqueued (it always is on the
front end when a palette exists; in the editor iframe it is present by
definition).

### 5.2 Config key and paradigm defaults

```jsonc
// config/config.default.json
"theme": {
  "themeType": "classic",
  "enableBlocks": false,
  "designTokens": {
    "enabled": true,
    "source": "config/tokens.json",
    "colorBinding": "auto",     // "auto" | "independent" | "wp-preset"
    "darkMode": "auto",         // "auto" | "media" | "none"
    "colorSpace": "hex",        // "hex" | "oklch"
    "emit": {
      "customProperties": true,
      "themeJson": true,
      "customMedia": true,
      "tailwind": true
    },
    "legacyAliases": false      // true only during a staged migration
  }
}
```

`"auto"` resolves via `getActiveThemeType()`:

| Active type | `colorBinding: auto` → | Rationale |
| --- | --- | --- |
| `classic` | `independent` | No Site Editor; CSS must be self-sufficient. **Never** emit `--wp--preset--` refs. |
| `universal` | `independent` | Hybrid: CSS stays canonical; presets exist for block content. Dev may opt into `wp-preset`. |
| `block-based` | `wp-preset` | Site Editor is the design surface; preset vars are canonical. Dev may opt into `independent`. |

### 5.3 Hard rules

- **Classic never emits `--wp--preset--` references.** Enforced by a jest
  guard test (§14) and a build-time assertion. This satisfies the standing
  rule that block features are gated out of the classic core.
- **`wp-preset` requires a theme.json palette.** If
  `theme.designTokens.emit.themeJson === false` and binding is `wp-preset`,
  the build fails with a clear message.
- **Switching modes is a one-line config change + `rig:tokens`.** No file
  surgery, no manual CSS edits.
- **Drift warning:** with `independent` binding on a block-capable theme, the
  build warns that editing the palette in the Site Editor will not propagate to
  CSS (by design) — so the dev knows the tradeoff.
- **`wp-preset` is only *offered* interactively for block-capable themes**
  (same pattern as `rig-init`); classic users never see the prompt.

### 5.4 Optional third mode (future, not v1)

`dual` — independent values in CSS *and* a documented sync check comparing
them to presets, for teams that want both without live binding. Deferred; see
§16.

---

## 6. File architecture

### 6.1 CSS split (kills the regex)

```
assets/css/src/
├── _tokens.generated.css   ← generator-owned, GITIGNORED, "DO NOT EDIT"
├── _tokens.custom.css      ← hand-authored; the only hand-edit surface
└── _custom-properties.css  ← thin wrapper (transitional)
```

```css
/* _custom-properties.css — wrapper only. Do not add variables here. */
@import "_tokens.generated.css";
@import "_tokens.custom.css";
```

- The wrapper keeps the existing ~10 `@import "_custom-properties.css"`
  consumers working unchanged for one release. Long-term, tokens are imported
  once from the entry points (`global.css`, `content.css`,
  `editor/editor-styles.css`) and partials assume they exist. The canonical
  import order is documented in `DESIGN.md`.
- `_tokens.generated.css` is a **gitignored generated artifact** (like
  `theme.json` and `tailwind.config.js`), regenerated by `npm run build` /
  `npm run rig:tokens`. **Deviation from the original plan** (which committed
  it): its content depends on `theme.designTokens.colorBinding` / the active
  paradigm, so a single committed file cannot be canonical across configs — a
  `block-based` local override (e.g. `config.local.json`) legitimately produces
  `wp-preset` output. Header:
  `/* DO NOT EDIT — generated from config/tokens.json by npm run rig:tokens */`.
  (`build:css` alone therefore requires a prior `rig:tokens`/`build`.)
- The generator writes the **entire file**, so `:root` appears once in each
  file and no markers are needed. Source order guarantees custom overrides
  generated (custom is imported second).

### 6.2 theme.json source split

`theme.json` cannot be split, so its **sources** are:

```
config/tokens.json        (generated semantics: palette, fonts, sizes, layout)
config/theme.custom.json  (hand-authored theme.json fragments)   ← NEW
config/user-styles.json   (baked Site Editor layer, SPEC-016)
              │
              ▼  buildThemeJson()
          theme.json  (generated, sole writer = tokens.js)
```

Precedence: `tokens < theme.custom < user-styles`, with the SPEC-016 SSOT keys
(`$schema`, `version`, `settings.viewport`, `settings.blockVisibility`) always
owned by tokens. This gives hand-authored theme.json work a stable home that
survives regeneration.

**Implemented behavior (P5):** `buildThemeJson(tokens, existing, userStyles, {
extraPalette, themeCustom })` applies token sections, then merges
`theme.custom` (SSOT-stripped) over them, then merges `user-styles` last. For
backward compatibility the previous generated `theme.json` remains the *base*
when present; `theme.custom` sits above tokens but below the user layer, so it
wins on any overlapping non-SSOT key. An absent `theme.custom.json` leaves
output unchanged.

### 6.3 Tailwind source split

```
config/tailwind.tokens.js  (generated colors/fontSize/fontFamily)
config/tailwind.custom.js  (hand-authored extend block)
              │
              ▼
        tailwind.config.js  (generated shell: imports + per-key merge)
```

The generator writes `tailwind.tokens.js` **and** the `tailwind.config.js`
shell (both gitignored artifacts, like `theme.json`); `tailwind.custom.js` is
hand-authored and never touched. The shell merges per key
(`colors`/`fontSize`/`fontFamily`) so custom additions extend rather than wipe
the generated values. (Replaces the old regex-replace of `colors` / `fontSize`
/ `fontFamily` inside `tailwind.config.js` — same fragility as the CSS.)

### 6.4 Canonical import order (documented in `DESIGN.md`)

```
1. _reset.css
2. _tokens.generated.css   (declares @layer order; imported layer(tokens))
3. _tokens.custom.css      (imported layer(tokens))
4. _custom-media.css        (must precede any @media (--alias) use)
5. _typography.css / _elements.css / _utility.css / _links.css / _accessibility.css
```

Token imports are **plain** `@import` (§7.6.2); `@import … layer()` must not be
used (nested-layer bug, §18.3). Layer order is declared exactly once, in
`_tokens.generated.css`.

---

## 7. Generator spec (`scripts/tasks/tokens.js` v2)

### 7.1 New/changed exports

```js
// Pure, testable, no file I/O:
export function loadTokens(raw)                       // parse + validate shape
export function resolveReferences(tokens)             // {a.b.c} → value
export function normalizeTokens(tokens, opts)         // flatten → public var map
export function buildCssCustomProperties(tokens, opts) // → _tokens.generated.css
export function buildThemeJson(tokens, existing, overlay) // (extended, see §6.2)
export function buildCustomMediaCss(breakpoints)      // unchanged
export function buildTailwindTokens(tokens)           // → tailwind.tokens.js
export function buildPropertyRegistrations(tokens, opts) // → @property block (§7.6.3)
export function buildA11yOverrides(tokens, opts)      // → prefers-contrast / forced-colors (§7.6.5)
export function validateContrast(tokens, opts)        // → diagnostics[]
export function assertClassicHasNoPresetRefs(css)     // paradigm guard
export function assertLayerOrderDeclaredOnce(css)     // platform guard (§7.6.2)
```

### 7.2 Output contract for `_tokens.generated.css`

```css
/**
 * Design tokens — GENERATED from config/tokens.json.
 * DO NOT EDIT. Run `npm run rig:tokens` after editing tokens.json.
 * Binding: independent · Color space: hex · Dark: media · Layers: on
 */

/* 1. Layer order — declared exactly once, as the first statement. */
@layer tokens, base, components, utilities;

/* 2. Typed registrations for the curated "animated" set (§7.6.3). */
@property --color-accent { syntax: "<color>"; inherits: true; initial-value: #e36d60; }
@property --color-surface { syntax: "<color>"; inherits: true; initial-value: #ffffff; }
@property --hue-accent   { syntax: "<number>"; inherits: true; initial-value: 32; }

@layer tokens {
	:root {
		color-scheme: light;                  /* dark branch flips to dark */
		accent-color: var(--color-accent);    /* native form controls */
		scrollbar-color: var(--color-border) var(--color-surface);

		/* Layout */
		--layout-content: 45rem;
		--layout-wide: 64rem;

		/* Space */
		--space-base: 1rem;

		/* Typography */
		--font-family-base: "Open Sans", …;
		--font-family-highlight: "Roboto Condensed", …;
		--line-height-base: 1.4;
		--font-size-base: clamp(0.75rem, 0.667rem + 0.417vw, 1rem);

		/* Color — primitives */
		--color-brand-500: #e36d60;

		/* Color — semantic (light) */
		--color-surface: #ffffff;
		--color-text: #333333;
		--color-border: #cccccc;
		--color-accent: #e36d60;

		/* Breakpoints */
		--breakpoint-mobile: 480px;
		--breakpoint-tablet: 782px;
	}

	@media (prefers-color-scheme: dark) {
		:root {
			color-scheme: dark;
			--color-surface: #121212;
			--color-text: #f5f5f5;
			--color-border: #3a3a3a;
			--color-accent: #f08b80;
		}
	}

	/* Accessibility overrides (§7.6.5) */
	@media (prefers-contrast: more) {
		:root { --color-text: #000; --color-border: #000; --color-link: #0000ee; }
	}
	@media (forced-colors: active) {
		:root { --color-surface: Canvas; --color-text: CanvasText; --color-accent: Highlight; }
	}
}
```

For `wp-preset` binding, semantic color declarations become:

```css
--color-surface: var(--wp--preset--color--surface);
```

and the dark `@media` block omits semantic colors that WP presets own
(WordPress resolves them), keeping only WP Rig-owned tokens (e.g. code
surfaces if not in the palette).

### 7.3 Behavior changes vs today

| Today | v2 |
| --- | --- |
| Regex surgery between markers in `_custom-properties.css` | Full-file generation of `_tokens.generated.css` |
| Dark mode hand-authored, invisible to generator | Generated from `semantic.*.dark` |
| Flat colors only | Primitives + semantic + component, reference resolution |
| No validation | JSON Schema + reference + contrast gates |
| Tailwind regex-replaced in place | `tailwind.tokens.js` generated whole |
| `--mobile-breakpoint` misnomer preserved | `--breakpoint-tablet`; migration maps old→new |
| theme.json hand sections preserved by re-reading output | `config/theme.custom.json` explicit overlay |

### 7.4 Build gates

1. **Schema validation** (`config/tokens.schema.json`, ajv-style or zod):
   unknown keys, missing dark pairs, bad tier direction, malformed references
   → hard fail with the token path.
2. **Reference resolution** → hard fail on unresolved `{path}`.
3. **Contrast check** (§7.5) → fail on semantic *text-on-surface* pairs below
   WCAG 2.2 AA (4.5:1 normal text, 3:1 large text / UI); warn on
   *non-text* pairings.
4. **Core preset collision** (existing `findCorePresetCollisions()`) → warn,
   updated to understand semantic slugs.
5. **Paradigm guard** → classic output containing `--wp--preset--` is a hard
   fail.
6. **Platform guards** → `@layer` order declared exactly once; every emitted
   `@property` carries `initial-value`; `prefers-contrast` / `forced-colors`
   overrides resolve to valid colors and pass the contrast gate (§7.6).

### 7.5 Contrast gate detail

- Input: every semantic color role paired with its expected background
  (`text`/`text-muted` on `surface`/`surface-subtle`; `state-*` on `surface`;
  `link` on `surface`).
- Compute relative luminance from the **resolved** value (sRGB hex), not from
  OKLCH lightness.
- Emit a table in the build log: `role · light ratio · dark ratio · verdict`.
- Thresholds configurable in `theme.designTokens.contrast` (defaults AA).
- Rationale for WCAG-over-APCA and the escape hatch are in §10.4.

### 7.6 Modern CSS platform features (adoption-aware emission)

WP Rig targets `> 1%` + `last 2 versions` (`.browserslistrc`). By 2026 the
features below are Baseline widely available and safe to emit. The generator
uses them where they **reduce token count, remove JS, or improve a11y** — each
gated so a conservative project can opt out.

#### 7.6.1 Adoption matrix

| Feature | Baseline | Generator use | Default |
| --- | --- | --- | --- |
| `@layer` (cascade layers) | 2022 | token layer (plain imports; §18.3) | **on** |
| `@property` (registered props) | 2024 | typed tokens (colors/lengths/numbers) | curated (`animated`) |
| `color-mix()` | 2023 | §4.5 derivation | on |
| Relative color syntax | 2024 | §4.5 alpha/shade/hue | on |
| `alpha()` (relative alpha) | 2026 (58%, at-risk) | alpha-only derivation | opt-in (`progressive`) |
| `oklch()` / `oklab()` | 2023 | color authoring | on |
| Media query range syntax | 2023 | custom-media bodies | on |
| `round()` / `mod()` / `abs()` / `sign()` | 2024 | grid snapping, direction math | on |
| `pow()` / `sqrt()` / `log()` / `exp()` / `hypot()` | 2023–24 | scale generation | on |
| `sin()` / `cos()` / `tan()` / `atan2()` | 2023 | procedural layout | watch |
| `lh` / `rlh` units | 2023 | vertical rhythm | opt-in |
| Container query units (`cqi`/`cqw`) | 2023 | container-relative fluid sizing | opt-in |
| `prefers-contrast` | 2022 | token overrides | on |
| `forced-colors` | 2022 | system-color token safety | on |
| `color-scheme` / `accent-color` / `scrollbar-color` | 2022–24 | native UI theming | on |
| `text-wrap: balance` / `pretty` | 2023–24 | base typography defaults | on (base layer) |
| `@scope` | 2024 | component scoping | watch |
| `light-dark()` | 2024 | dark mode | opt-in (§10.5) |
| `@starting-style` / view transitions | 2024–25 | theme-switch animation | future |
| `if()` / `@function` / `color-contrast()` / `text-box-trim` | 2025+ (emerging) | replace the derive mirror | future (§17) |

#### 7.6.2 Cascade layers — adopt now (supersedes the §10.9 deferral)

Tokens get their own layer immediately. This is **safe during migration
because unlayered CSS always beats layered CSS** — existing theme CSS keeps
winning until it is deliberately layered.

```css
/* _tokens.generated.css — first statement establishes order exactly once */
@layer tokens, base, components, utilities;

@layer tokens {
	:root { /* … */ }
	@media (prefers-color-scheme: dark) { :root { /* … */ } }
}
```

The wrapper uses **plain imports**. Do **not** use `@import … layer(tokens)`
here: when the imported file already declares/wraps `@layer tokens`, Lightning
CSS composes the names into nested layers (`tokens.tokens`, `tokens.base`, …),
silently putting the token rules in the wrong layer. Verified in the spike
(§18.3).

```css
/* _custom-properties.css — wrapper only */
@import "_tokens.generated.css"; /* declares order + wraps content in @layer tokens */
@import "_tokens.custom.css";    /* wraps content in @layer tokens */
```

Rules:

- Layer order is declared **once**, in the generated file's first statement;
  `assertLayerOrderDeclaredOnce()` enforces it.
- `_tokens.custom.css` content is wrapped in `@layer tokens` too, so custom
  overrides stay in the same layer as generated tokens (source order decides).
- **Only** the token layer is claimed here; full partial layering (base /
  components / utilities) remains Track C3. The layer *names* are reserved now
  so C3 does not have to renumber.
- `revert-layer` becomes available for token resets.
- Config: `theme.designTokens.layers.enabled` (default `true`).

#### 7.6.3 `@property` typed tokens (curated)

Register a small set so custom properties are typed, animatable, and
fallback-safe:

```css
@property --color-accent { syntax: "<color>"; inherits: true; initial-value: #e36d60; }
@property --hue-accent   { syntax: "<number>"; inherits: true; initial-value: 32; }
@property --space-base   { syntax: "<length>"; inherits: true; initial-value: 1rem; }
```

Wins:

- Theme/dark-mode switches can **transition** colors instead of jumping.
- Relative-color math on a registered `<color>` is robust across engines.
- Invalid values fall back to `initial-value` instead of the
  guaranteed-invalid value (which silently breaks `var()` chains).
- `<number>` registration makes `--hue-*` safe to use inside `calc()` /
  `oklch()`.

Cost: bytes, and every registered property **requires** `initial-value`.
Curate.

Config: `theme.designTokens.property.register` — `"none"` | `"animated"` |
`"all"` (default `"animated"`: tokens referenced in transitions plus the
hue/number anchors). The block is emitted before `:root` and only for
registered tokens.

#### 7.6.4 Math functions that shrink the token set (extends §4.5)

- **Grid snapping** — no arbitrary `--space-N` ladder:
  `padding: calc(round(nearest, var(--gap), var(--space-base)));`
- **Modular type scale** — one ratio + base, no per-step token:
  `--font-size-2: calc(var(--font-size-base) * pow(var(--type-ratio), 2));`
- **Direction-aware math** — `sign()` / `abs()` for RTL/LTR without extra
  tokens.
- **Vertical rhythm** — `lh` / `rlh`: `padding-block: 1rlh;` couples spacing to
  type metrics.
- **Container-relative fluid sizing** — `clamp(a, cqi, b)` scales to the
  component, not the viewport (opt-in).
- **Procedural layout** — `sin()` / `cos()` for grids/waves; `watch`.

Rule: prefer a formula over a ladder; only materialize steps when a non-CSS
consumer (theme.json / Tailwind) needs them (§4.5.4).

#### 7.6.5 Accessibility media queries (token-level)

```css
@media (prefers-contrast: more) {
	:root { --color-text: #000; --color-border: #000; --color-link: #0000ee; }
}
@media (forced-colors: active) {
	/* Do not fight system colors — map semantics to system keywords. */
	:root { --color-surface: Canvas; --color-text: CanvasText; --color-accent: Highlight; }
}
```

- `prefers-contrast: more` overrides are validated by the contrast gate (§7.5)
  and reported as a distinct theme in the build table.
- `forced-colors` maps semantic tokens to CSS system color keywords so Windows
  High Contrast does not break UI. `forced-color-adjust` guidance lives in
  `DESIGN.md`.
- `prefers-reduced-motion` is handled in the base layer, not tokens.
- Config: `theme.designTokens.platform.prefersContrast` and
  `.forcedColors` (both default `true`).

#### 7.6.6 Native UI theming (zero-code wins)

```css
:root {
	color-scheme: light;               /* dark branch sets dark (§7.2) */
	accent-color: var(--color-accent);
	scrollbar-color: var(--color-border) var(--color-surface);
}
```

Form controls, focus rings, and scrollbars inherit the theme with no extra
rules. Config: `theme.designTokens.platform.nativeUi` (default `true`).

#### 7.6.7 Watch-list (not emitted in v1)

`@scope` (component scoping), `light-dark()` (opt-in, §10.5),
`@starting-style` + view transitions (theme-switch animation), `if()`,
`@function`, `color-contrast()`, `text-box-trim`, `interpolate-size` /
`calc-size()`. Tracked in §17.

---

## 8. One-time setup & migration (`rig:tokens:setup`)

### 8.1 Command

```bash
npm run rig:tokens:setup          # interactive, dry-run summary at the end
npm run rig:tokens:setup -- --yes # non-interactive, accept defaults
npm run rig:tokens:setup -- --dry-run
```

New script: `"rig:tokens:setup": "node scripts/tasks/tokensSetup.js"`.

### 8.2 Steps

```
1. Detect paradigm            → getActiveThemeType()
2. Detect schema version      → v1 flat | v2 layered | absent
3. Prompt (block-capable only) → colorBinding: independent | wp-preset
   Prompt (all)                → darkMode: media | none; colorSpace: hex | oklch
4. Upgrade tokens.json        → v1 → v2 (values mapped into primitives/semantic)
5. Split files                → create _tokens.generated.css / _tokens.custom.css,
                                rewrite _custom-properties.css to wrapper
6. Create overlays            → config/theme.custom.json (if theme.json has
                                hand-authored keys), config/tailwind.custom.js
7. Collapse-aware codemod     → rewrite legacy var names across sources (§8.4)
8. Regenerate                 → rig:tokens
9. Verify                     → stylelint + jest tokens suite + contrast report
10. Summary                   → files changed, vars renamed, warnings, next steps
```

### 8.3 Codemod: collapse-aware, not 1:1

The legacy set is **N:1** (`--global-font-color` + `--color-text` → one
`--color-text`), so a plain find-replace is wrong. The migrator:

1. Loads `config/token-migrations.json` (the mapping table in §4.4).
2. Builds a `oldName → newName` map and **collapses** duplicates (multiple old
   names pointing at the same new name is expected and fine).
3. Rewrites, in order:
   - `_tokens.custom.css` (definitions and reads),
   - `assets/css/src/**/*.css` **excluding** generated files,
   - `**/*.php` inline styles (`style="…var(--old)…"`, `wp_add_inline_style`,
     `esc_attr`/`printf` style attributes) in `template-parts/`, `patterns/`,
     `inc/`,
   - `config/theme.custom.json`, `config/tailwind.custom.js`,
   - `assets/js/**` (dev-toolbar allowlist, token verification lists),
   - `docs/**` and `.ai/skills/**` examples that name variables.
4. Handles all read forms: `var(--old)`, `var(--old, fallback)`,
   `--old:` definitions, `@custom-media --old`, Tailwind arbitrary
   `[var(--old)]`.
5. Never touches `_tokens.generated.css` or generated theme.json sections —
   those change by editing `tokens.json` and regenerating.
6. Prints a unified diff; `--apply` writes. Default is dry-run.

### 8.4 Slug-vs-var policy (must be explicit)

- **CSS variable renames are safe** and automated.
- **Gutenberg color/typography slugs** (`has-primary-color`,
  `has-text-color`, `wp-block-…`) are referenced by *saved post content*. The
  migrator **does not** rename slugs. If a project wants new slugs, it is a
  separate, documented decision with a content migration step, recorded in
  `DESIGN.md` and called out in the setup summary.
- The setup script prints a notice listing slugs that would be affected if the
  dev later chooses to rename them.

### 8.5 Rollback

`rig:tokens:setup` writes a timestamped backup of every touched source file to
`.rig-backup/<timestamp>/tokens-setup/` (never deletes). Re-running is
idempotent (v2 input is a no-op).

---

## 9. Workflows & scenarios

### 9.1 Pure-CSS author (the default classic path)

> "I write CSS. I don't want a token pipeline."

1. `rig:tokens:setup` (or nothing at all — a fresh clone already has
   `_tokens.generated.css` + `_tokens.custom.css`).
2. Add or override variables in `_tokens.custom.css`:
   ```css
   :root {
   	--color-accent: rebeccapurple;
   	--space-lg: 2.25rem;
   }
   ```
3. Use them in partials: `color: var(--color-accent);`.
4. Never open `tokens.json`. IDE autocomplete works because both files are
   committed, plain CSS.
5. If the editor palette matters, run `rig:tokens` once to sync theme.json.

**Guarantee:** `tokens.json` is optional. If absent, `rig:tokens` no-ops and
the hand-authored files are the system.

### 9.2 Figma-driven designer (the primary new workflow)

> "Design lives in Figma; I want it in the theme."

```
Figma Variables / Styles
        │  Tokens Studio (or Figma REST + a converter)
        ▼
DTCG JSON  (W3C Design Tokens Community Group format)
        │  npm run rig:tokens:import -- --from design/figma.tokens.json
        ▼
config/tokens.json (v2, mapped)
        │  npm run rig:tokens
        ▼
_tokens.generated.css + theme.json + tailwind.tokens.js
```

- `rig:tokens:import` maps DTCG `$value`/`$type` to the v2 schema, supports
  `--mode merge|replace`, and reports unmapped tokens (never silently drops).
- `rig:tokens:export -- --format dtcg` produces DTCG JSON for round-trip back
  into Tokens Studio.
- Figma **modes** (Light/Dark, brand modes) map to `semantic.*.light` /
  `semantic.*.dark` and (future) multi-brand sets (§9.8).
- A `design/` folder convention is documented for the exported JSON, and the
  import is git-tracked so the mapping is reproducible.

### 9.3 Site Editor designer (block-based)

> "I design in the WordPress Site Editor."

1. Edit Global Styles → palette, typography, spacing.
2. `npm run rig:bake styles` → `config/user-styles.json` (SPEC-016).
3. `rig:tokens` regenerates `theme.json`; the user layer wins on content,
   tokens keep SSOT keys.
4. With `colorBinding: wp-preset`, semantic CSS vars follow the editor's
   palette automatically (live binding).
5. `rig:bake:clean` resets both the Global Styles post and the overlay.

**Design decision:** the Site Editor is a *design surface*, not a token
source. Baked decisions are captured as an overlay so they are versioned and
reproducible; tokens remain the canonical seed for defaults.

### 9.4 Tailwind user

- Generated `config/tailwind.tokens.js` exposes the same primitives/semantics
  as Tailwind theme values.
- Hand-authored `config/tailwind.custom.js` extends/overrides.
- Hex output keeps Tailwind v3 opacity modifiers (`bg-accent/50`) working
  (§10.3). OKLCH output is opt-in and documented as breaking opacity modifiers.

### 9.5 Legacy WP Rig theme migration

1. `rig:tokens:setup --dry-run` → review rename diff.
2. `--apply` → schema upgraded, files split, names collapsed.
3. `rig:tokens` → regenerate; `npm run lint:css`; jest tokens suite.
4. Visual light/dark pass (vision-loop).
5. Slugs untouched by default (§8.4).

### 9.6 Child theme / brand override

- Child theme overrides by declaring vars in its own `_tokens.custom.css`
  imported after the parent's, or by setting
  `theme.designTokens.source` to its own `tokens.json`.
- Documented precedence: parent generated → parent custom → child custom.

### 9.7 No-build / agency handoff

- Generated files are committed; the theme builds with no Node toolchain.
- `DESIGN.md` + the generated-file header explain the contract to a
  maintainer who has never run the scripts.

### 9.8 Multi-brand / white-label (future, not v1)

- Multiple semantic sets (`semantic.brand-a`, `semantic.brand-b`) selected by
  a `data-brand` attribute or build-time `--brand` flag. Deferred; the schema
  is designed to accommodate it (semantic sets are already grouped).

### 9.9 WordPress.org submission

- `theme.json` palette remains sRGB hex (core requirement) — see §10.3.
- No remote resources; import/export operate on local files.

---

## 10. Design opinions considered (and WP Rig's stance)

This section exists because token systems attract strong, conflicting
opinions. Each row records the opinion and the decision, so future sessions
don't relitigate.

### 10.1 Semantic vs. primitive tokens

- **Opinion (dominant):** two- or three-tier token architecture (primitive →
  semantic → component) is the industry standard (Design Tokens community,
  Brad Frost, Salesforce Lightning, Radix Themes).
- **Stance:** adopt it. Tiers are enforced (§4.2) because without enforcement
  teams collapse back to a flat palette within a sprint.

### 10.2 Naming: numeric scales vs. t-shirt sizes

- **Opinion A:** numeric ramps (`50–950`) for primitives (Tailwind, Radix).
- **Opinion B:** t-shirt sizes (`sm/md/lg`) read better for roles.
- **Stance:** numeric for **primitive color scales**, role names for
  **semantic** (`surface`, `danger`), t-shirt for **size/spacing/radius**.
  Rationale: numbers communicate position in a ramp; roles communicate intent;
  t-shirt communicates relative magnitude for sizes.

### 10.3 OKLCH vs. hex

- **Opinion A:** author in OKLCH/OKLab for perceptual uniformity and
  predictable ramps (Björn Ottosson's work; modern CSS).
- **Opinion B:** hex/sRGB is universally safe; wide-gamut is not yet a
  requirement.
- **Stance:** **author and interpolate in OKLCH; emit hex by default.**
  - `meta.colorSpace: "oklch"` is opt-in and emits a hex fallback plus an
    `@supports (color: oklch(0% 0 0))` progressive layer.
  - Rationale: `theme.json` palette consumers, Gutenberg's color picker /
    contrast checker / duotone, KSES sanitization in patterns, and Tailwind v3
    opacity modifiers all assume sRGB values. Shipping `oklch()` into
    `theme.json` breaks editor tooling.
  - v1 does **not** ship 11-step scales for every hue; it generates them only
    for the primitives the theme actually uses.
  - Runtime derivation (shades, tints, alpha, hue rotation) is done with CSS
    color math on top of the OKLCH base rather than extra named tokens — see
    §4.5.

### 10.4 Contrast: WCAG vs. APCA

- **Opinion A:** WCAG 2.2 AA (4.5:1 / 3:1) is the legal/QA baseline.
- **Opinion B:** APCA (WCAG 3 draft) models perceived contrast better.
- **Stance:** gate on **WCAG AA** (configurable), report **APCA as
  informational**. Rationale: WCAG is what audits and WordPress.org expect
  today; APCA is not yet a conformance target.

### 10.5 Dark mode: `prefers-color-scheme` vs. class toggle vs. `light-dark()`

- **Opinion A:** `@media (prefers-color-scheme)` — zero-JS, respects OS.
- **Opinion B:** `[data-theme]` class toggle — user control, needs JS + a
  stored preference.
- **Opinion C:** `light-dark()` — one declaration, modern.
- **Stance:** **generated `@media (prefers-color-scheme: dark)` block is the
  v1 default**, because:
  - `theme.json` and PHP inline styles cannot consume `light-dark()` — they
    need discrete values, so an explicit dark map is required regardless;
  - `light-dark()`'s transpiled fallback duplicates declarations and is hard
    to grep; `color-scheme: light dark` also flips UA form controls and
    scrollbars (must be intentional);
  - the media block is greppable, works everywhere CSS vars work, and keeps
    the WP 7.1 editor iframe preview consistent with the front end.
  - `darkMode: "class"` and `light-dark()` are documented as future opt-ins.
- `color-scheme` is emitted explicitly in both branches (light/dark).

### 10.6 "Don't over-abstract — CSS is fine"

- **Opinion:** token pipelines become bureaucracy; plain CSS custom properties
  are enough.
- **Stance:** agree, and that is why P2/P3 exist. The JSON layer is optional,
  the hand-authored CSS file is first-class, and there is no CSS-as-JSON. The
  pipeline exists to serve the *default* system and editor sync, not to own
  every style.

### 10.7 DTCG standard adoption

- **Opinion:** the W3C Design Tokens Community Group format (`$value`/`$type`)
  is becoming the interchange standard.
- **Stance:** internal schema is a superset; DTCG is the **import/export**
  boundary, not the native format. Rationale: DTCG does not model WP Rig's
  light/dark pairs, paradigm binding, or preset slugs cleanly; adapting at the
  boundary keeps Figma interoperability without contorting the core schema.

### 10.8 Typed custom properties (`@property`)

- **Opinion:** `@property` enables type-safe tokens and animatable colors.
- **Stance:** adopt a **curated** set in v1 (§7.6.3) — not every token.
  Registering all tokens bloats output; registering the animated set plus the
  hue/number anchors buys transitions, robust relative-color math, and
  `initial-value` fallbacks at low cost.

### 10.9 Cascade layers

- **Opinion:** tokens belong in an early `@layer tokens`.
- **Stance:** **adopt the token layer now** (§7.6.2), superseding the earlier
  deferral. It is safe during migration because unlayered CSS beats layered
  CSS, so existing theme CSS keeps winning. Only the token layer is claimed;
  full partial layering (base / components / utilities) remains Track C3, with
  the layer names reserved now so C3 does not renumber.

### 10.10 Fluid typography

- **Opinion:** fluid `clamp()` scales are expected; fixed `rem` steps are
  rigid.
- **Stance:** keep the existing fluid engine (`calculateFluidSize()`), moved
  into the v2 generator. `theme.json` `settings.typography.fluid` +
  `fontSizes[].fluid` are emitted alongside the CSS `clamp()` so editor and
  front end match.

---

## 11. Paradigm matrix

| Concern | classic | universal | block-based |
| --- | --- | --- | --- |
| Token core (`all`) | ✅ | ✅ | ✅ |
| Own `--color-*` namespace | ✅ only source | ✅ canonical | ✅ aliases presets (default) |
| `--wp--preset--*` referenced | ❌ forbidden | opt-in | ✅ default |
| theme.json palette | minimal | generated + synced | generated + synced (source) |
| `colorBinding` default | `independent` | `independent` | `wp-preset` |
| Dark `@media` block | ✅ | ✅ | ✅ (WP-owned colors omitted) |
| Site Editor bake overlay | n/a | optional | ✅ primary |
| `_blocks-based.css` | dropped | kept | kept |
| DTCG import/export | ✅ | ✅ | ✅ |
| Cascade layers (`@layer tokens`) | ✅ | ✅ | ✅ |
| `@property` typed tokens | ✅ | ✅ | ✅ |
| `prefers-contrast` / `forced-colors` overrides | ✅ | ✅ | ✅ |
| Setup prompt for preset binding | never shown | shown | shown |

Paradigm resolution is **never** hardcoded per file: it flows through
`config/paradigms.json` → `scripts/lib/paradigm.js` / `inc/Paradigm.php`.

---

## 12. Config reference

### 12.1 `config/config.default.json` (new keys)

| Key | Type | Default | Meaning |
| --- | --- | --- | --- |
| `theme.designTokens.enabled` | boolean | `true` | Master switch for generation |
| `theme.designTokens.source` | string | `config/tokens.json` | Token file path |
| `theme.designTokens.colorBinding` | `"auto"\|"independent"\|"wp-preset"` | `"auto"` | §5.1 |
| `theme.designTokens.darkMode` | `"auto"\|"media"\|"none"` | `"auto"` | `auto` → `media` when schema has dark pairs |
| `theme.designTokens.colorSpace` | `"hex"\|"oklch"` | `"hex"` | Output format |
| `theme.designTokens.derive.strategy` | `"runtime"\|"build"\|"both"` | `"both"` | Where derived color math is emitted: runtime `color-mix()`/relative color, build-time resolved hex, or both (§4.5.5) |
| `theme.designTokens.layers.enabled` | boolean | `true` | Wrap tokens in `@layer tokens` + declare layer order (§7.6.2) |
| `theme.designTokens.property.register` | `"none"\|"animated"\|"all"` | `"animated"` | `@property` typed-token registration scope (§7.6.3) |
| `theme.designTokens.platform.nativeUi` | boolean | `true` | Emit `color-scheme` / `accent-color` / `scrollbar-color` (§7.6.6) |
| `theme.designTokens.platform.prefersContrast` | boolean | `true` | Emit `prefers-contrast: more` token overrides (§7.6.5) |
| `theme.designTokens.platform.forcedColors` | boolean | `true` | Emit `forced-colors` system-color mapping (§7.6.5) |
| `theme.designTokens.platform.alphaFunction` | `"off"\|"progressive"` | `"off"` | Emit `alpha(from …)` behind `@supports` for wide-gamut alpha (§4.5.8) |
| `theme.designTokens.emit.customProperties` | boolean | `true` | Write `_tokens.generated.css` |
| `theme.designTokens.emit.themeJson` | boolean | `true` | Write `theme.json` |
| `theme.designTokens.emit.customMedia` | boolean | `true` | Write `_custom-media.css` |
| `theme.designTokens.emit.tailwind` | boolean | `true` | Write `config/tailwind.tokens.js` |
| `theme.designTokens.legacyAliases` | boolean | `false` | Emit deprecated aliases (staged migration only) |
| `theme.designTokens.contrast.level` | `"AA"\|"AAA"\|"off"` | `"AA"` | Contrast gate threshold |
| `theme.designTokens.contrast.onFail` | `"warn"\|"error"` | `"error"` | Gate severity |

### 12.2 New/changed npm scripts

| Script | Command | Purpose |
| --- | --- | --- |
| `rig:tokens` | `node scripts/propagate-tokens.js` | Regenerate (existing; v2 internals) |
| `rig:tokens:setup` | `node scripts/tasks/tokensSetup.js` | One-time schema upgrade + migration |
| `rig:tokens:import` | `node scripts/tasks/tokensImport.js` | DTCG/Figma JSON → tokens.json |
| `rig:tokens:export` | `node scripts/tasks/tokensExport.js` | tokens.json → DTCG JSON |
| `rig:tokens:check` | `node scripts/tasks/tokensCheck.js` | Validate + contrast report (no writes) |

### 12.3 New config files

| Path | Role |
| --- | --- |
| `config/tokens.schema.json` | JSON Schema for the v2 token shape |
| `config/token-migrations.json` | Legacy-name → v2-name mapping (data, §8.3) |
| `config/theme.custom.json` | Hand-authored theme.json fragments (§6.2) |
| `config/tailwind.custom.js` | Hand-authored Tailwind extensions (§6.3) |

---

## 13. Lint & guards

### 13.1 Stylelint (`.stylelintrc`)

| Rule | Level | Notes |
| --- | --- | --- |
| `wprig/no-undefined-custom-properties` | **warn → error** | New plugin. Reads a generated token inventory (`artifacts/token-inventory.json`) so conditionally-defined vars and `@property` registrations don't false-positive. Promote to error after migration. |
| `wprig/no-hardcoded-colors` | **warn → error** | Flags literal colors that match a token value. Allowlist: `transparent`, `currentColor`, `inherit`, `none`, third-party overrides (`**/vendor/**`), `@supports` fallbacks. |
| `custom-property-no-missing-var-function` | error | Existing; keep. |
| `color-hex-length` | error | Existing; keep (short hex). |

Rationale for warn-first: strict bans on day one are extremely noisy across
~30 files; warnings give a migration burn-down list, then promote.

### 13.2 Build gates

- Schema validation (§7.4.1)
- Reference resolution (§7.4.2)
- Contrast (§7.4.3)
- Classic preset-ref assertion (§7.4.5)

### 13.3 Runtime / dev-toolbar

- The dev toolbar's token verification (docs/design-wp-rig-dev-toolbar.md:74)
  is updated to read `artifacts/token-inventory.json` instead of parsing
  `_custom-properties.css` markers.

---

## 14. Test plan (jest, `scripts/tests/`)

Extend `tokens.test.js`; add `tokens-setup.test.js` and
`tokens-import.test.js`.

1. **Schema:** valid v2 passes; unknown key, missing dark pair, bad tier
   direction, unresolved reference each fail with the offending path.
2. **v1 rejection:** `tokens.js` v2 rejects the flat shape and names
   `rig:tokens:setup`.
3. **Determinism:** two runs, same inputs → byte-identical
   `_tokens.generated.css`, `theme.json`, `tailwind.tokens.js`.
4. **Dark emission:** `darkMode: media` emits the `@media` block with every
   semantic dark pair; `darkMode: none` omits it.
5. **Binding: independent** → no `--wp--preset--` in generated CSS.
6. **Binding: wp-preset** → semantic colors are preset aliases; dark block
   omits WP-owned colors.
7. **Classic guard:** classic + any binding never emits `--wp--preset--`
   (hard assertion).
8. **Paradigm defaults:** `auto` resolves to `independent` for classic and
   `wp-preset` for block-based (uses the existing paradigm test harness).
9. **Contrast gate:** known-failing pair → `error`; `off` → no diagnostics.
10. **Collapse codemod:** `--global-font-color` + `--color-text` both → one
    `--color-text`; `--content-width` + `--spacing-content-width` → one
    `--layout-content`; `var(--old, fallback)` rewritten; PHP inline styles
    rewritten; generated files untouched; slugs untouched.
11. **Idempotency:** running setup on v2 is a no-op; backup written once.
12. **DTCG import/export:** round-trip a fixture; unmapped tokens reported.
13. **File split:** wrapper imports in correct order; custom overrides
    generated (cascade test on compiled output).
14. **SPEC-016 regression:** overlay absent → byte-identical to current
    behavior; overlay still wins on content; SSOT keys survive.
15. **theme.custom precedence:** `tokens < theme.custom < user-styles`.
16. **WP 7.1 schema validation** of generated theme.json (existing ajv harness).
17. **Stylelint plugin:** undefined var flagged; defined var not flagged;
    allowlisted color not flagged.
18. **Derivation math:** `shade` / `tint` / `mix` / `contrast-on` ops resolve to
    the same value in the static fallback and the progressive expression; a
    derived path that is also hand-authored is a schema error.
19. **Alpha/hue axes:** changing `primitives.hue.accent` rotates every
    hue-derived token without adding names; alpha tokens combine with any color
    and **no** per-color alpha vars are emitted.
20. **Platform emission:** layer order declared exactly once; token content
    wrapped in `@layer tokens`; wrapper imports use `layer(tokens)`;
    `@property` emitted only for registered tokens and always with
    `initial-value`.
21. **A11y overrides:** `prefers-contrast: more` overrides pass the contrast
    gate; `forced-colors` maps to system color keywords; `color-scheme` /
    `accent-color` / `scrollbar-color` emitted when `platform.nativeUi` is on.
22. **Math functions:** grid-snap and modular-scale formulas emitted; changing
    the base/ratio updates derived values without adding names.
23. **Alpha function:** `platform.alphaFunction: "progressive"` emits the
    `@supports (color: alpha(from …))` layer with the relative-color baseline
    before it; `"off"` emits only the baseline.

---

## 15. Phased implementation plan

Each phase is independently shippable and verifiable.

| Phase | Scope | Files (approx) | Verification |
| --- | --- | --- | --- |
| **P1** | CSS file split + wrapper; generator writes whole generated file (still v1 flat input) | `tokens.js`, `_custom-properties.css`, new `_tokens.generated.css`, `_tokens.custom.css` | jest determinism; build; visual |
| **P2** | Schema v2 + `tokens.schema.json` + reference resolution + dark emission + contrast gate | `tokens.json`, `tokens.schema.json`, `tokens.js`, tests | schema/contrast/dark tests |
| **P3** | Config binding modes + paradigm defaults + classic guard | `config.default.json`, `tokens.js`, `paradigm.js` (read-only), tests | binding + paradigm tests |
| **P4** | `rig:tokens:setup` migration + collapse codemod + backups | `tokensSetup.js`, `token-migrations.json`, `package.json`, tests | codemod/idempotency tests; dry-run on a fixture theme |
| **P5** | theme.custom / tailwind split | `theme.custom.json`, `tailwind.custom.js`, `tokens.js` | precedence tests |
| **P6** | Stylelint plugins + token inventory | `.stylelintrc`, new plugin, `artifacts/` | plugin tests; warn burn-down |
| **P7** | `rig:tokens:import/export` (DTCG/Figma) | `tokensImport.js`, `tokensExport.js`, `design/` convention | round-trip tests |
| **P8** | `docs/DESIGN.md` + skill/doc updates | `docs/DESIGN.md`, `.ai/skills/styles`, `.ai/skills/typography`, `docs/css-architecture.md`, `CHANGELOG.md` | doc review |
| **P9** | OKLCH scales opt-in + `light-dark()`/class dark (future) | `tokens.js` | opt-in tests |

Suggested order: P1 → P2 → P3 → P8 (docs early for feedback) → P4 → P5 → P6 → P7 → P9.

**Progress (branch `design-tokens-v2`):**

- **P1 ✅ done 2026-09-16** — `_custom-properties.css` is now a thin wrapper;
  `_tokens.generated.css` (whole-file generator, no markers) + `_tokens.custom.css`
  (hand-authored, dark `@media` hoisted out of `:root`) added;
  `buildCssCustomProperties()` exported pure; 5 new jest cases incl. a
  regeneration-sync guard; 254/254 scripts tests green; `lint:css` clean;
  `theme.json`/`tailwind`/`_custom-media` regenerated byte-identical.
  `docs/css-architecture.md` inventory updated. `.ai/skills` doc updates
  deferred to P8.
- **P2 ✅ done 2026-09-16** — `config/tokens.json` migrated to the layered v2
  schema (`meta`/`primitives`/`semantic` light+dark; hue/alpha axes; fluid under
  `meta.fluid`); `config/tokens.schema.json` added. Generator gains
  `validateTokens`/`loadTokens` (v1 rejection → `rig:tokens:setup`, unknown
  keys, missing dark pairs, tier direction, primitive refs), `resolveReferences`
  (unresolved/circular errors), `flattenSemantic`, `normalizeTokens`,
  `shortenHex`, `validateContrast`/`contrastRatio`, and `toLegacyFlat` (v1 view
  so `theme.json`/`tailwind.config.js`/`_custom-media.css` stay **byte-identical**
  — verified). `buildCssCustomProperties` now emits canonical v2 vars + legacy
  aliases + a **generated dark `@media` block** (fixes the dark-mode gap for
  every semantic token). Contrast gate runs **warn-only** (Q7 still open).
  `_tokens.custom.css` trimmed to genuinely hand-authored vars.
  `--color-theme-*` alias to static primitives (not `--color-state-*`) to
  preserve dark-mode appearance. 33 tokens tests + 274/274 scripts green;
  `lint:css` clean. `bake-overlay.test.js` updated to the v2→flat adapter.

**P2 notes / deviations:**

- v2 is now the only accepted input; the v1→v2 upgrade for other themes lands
  with `rig:tokens:setup` in P4.
- Legacy aliases are emitted unconditionally in P2 (default `legacyAliases:
  true`); P3 wires the config flag and P4's codemod removes the layer.
- `--mobile-breakpoint` is emitted as a literal (not a `var()` alias) because
  the mobile-nav JS reads it via `getComputedStyle`.
- Contrast gate surfaced 6 warnings on the shipped palette (link-hover, accent,
  quote-citation dark, state.success/warning/info) — expected; Q7 decides
  whether to fix the palette or start at `warn`.
- **P3 ✅ done 2026-09-16** — config-driven binding. `theme.designTokens` added
  to `config.default.json` (`enabled`, `source`, `colorBinding`, `legacyAliases`,
  `contrast`). New pure helpers `resolveColorBinding` (auto → `wp-preset` for
  block-based, `independent` otherwise), `assertClassicBinding` (classic +
  wp-preset throws — §5.3 hard rule), and `buildSemanticPalette`.
  `normalizeTokens` honors `binding`; `wp-preset` emits
  `--color-{role}: var(--wp--preset--color--{role})` and suppresses the dark
  block; `independent` (classic/universal default) is byte-identical to before.
  `buildThemeJson` accepts `{ extraPalette }` so `wp-preset` themes gain the
  semantic palette slugs the aliases need. `propagateTokens` reads config,
  resolves the paradigm-aware binding, enforces the classic guard, and passes
  `legacyAliases`/`contrast` through. 9 new tests (42 tokens total,
  **283/283 scripts green**); eslint + `lint:css` clean;
  `theme.json`/`tailwind`/`_custom-media` unchanged under the default classic
  path.
- **P4 ✅ machinery done 2026-09-16 (apply pending sign-off)** — `rig:tokens:setup`
  (`scripts/tasks/tokensSetup.js`) added with pure, tested helpers:
  `detectSchemaVersion`, `upgradeV1ToV2` (flat → layered; `darkMode: "none"` so
  existing hand-authored dark CSS is preserved), `buildRenameMap` (LEGACY_ALIASES
  + the `--mobile-breakpoint` misnomer), `rewriteVarReferences` (collapse-aware;
  `var(--old)`, `var(--old, fallback)`, declarations, `@custom-media`, JS string
  literals; negative lookahead prevents partial matches), `listCodemodTargets`,
  `planCodemod` (dry-run), `applyCodemod` (timestamped backup under
  `.rig-backup/`). 16 new tests (**299/299 scripts green**); eslint clean.
  Dry-run on the shipped theme reports **98 legacy references across 17 files**
  (incl. `global.ts` / `navigation.ts` for `--mobile-breakpoint`).
  **`--apply` has NOT been run** — it is a 17-file rewrite that should be a
  deliberate, visually-verified step, after which `legacyAliases` flips to
  `false`.
  - Deviation from §8.2: the first cut is **non-interactive** (`--apply`
    flag; dry-run by default) rather than prompting for binding/dark/colorSpace.
    Prompts (inquirer, paradigm-gated) are a follow-up; the pure helpers they
    would call already exist.
- **P5 ✅ done 2026-09-16** — source splits for theme.json + Tailwind.
  `buildThemeJson` accepts `opts.themeCustom` (merged over tokens, under
  user-styles; SSOT-stripped) and `opts.extraPalette`; `propagateTokens` reads
  `config/theme.custom.json` when present. New `buildTailwindTokens()` +
  `buildTailwindConfig()`; `updateTailwindConfig` now writes generated
  `config/tailwind.tokens.js` **and** the gitignored `tailwind.config.js` shell,
  while hand extensions live in `config/tailwind.custom.js`. New committed
  hand-source files: `config/theme.custom.json`, `config/tailwind.custom.js`.
  5 new tests (**303/303 scripts green**); eslint + `lint:css` clean.
  - **Deviation (design issue found):** `_tokens.generated.css` is
    config-dependent (its content changes with `colorBinding`/paradigm), so it
    is now **gitignored** (like `theme.json`/`tailwind.config.js`) rather than
    committed; `config/tailwind.tokens.js` likewise. `.gitignore` updated; the
    old "matches committed file" test was removed (it cannot be canonical across
    configs). `npm run build` / `rig:tokens` regenerate them.
  - Local note: this checkout's `config.local.json` sets `themeType:
    block-based`, so the generated CSS currently uses `wp-preset` aliases —
    a live validation that binding works, and exactly why the artifact is not
    committed.
- **P6 ✅ done 2026-09-16** — lint guards + token inventory.
  `scripts/lib/token-inventory.js` (`parseDeclaredCustomProperties`,
  `buildTokenInventory`, `loadTokenInventory`, `writeTokenInventory`); two
  stylelint plugins (`scripts/stylelint/plugins/no-undefined-custom-properties.js`,
  `no-hardcoded-colors.js`) registered in `.stylelintrc` at **warning** severity
  (warn-first per §13.1). The undefined-vars rule reads the live inventory
  (generated + `_tokens.custom.css` names) and allowlists `--wp--` /
  `--lightningcss-` / `--tw-` prefixes; the hardcoded-color rule flags literals
  that exactly match a token value. Generated `_tokens.generated.css` is
  stylelint-ignored; `artifacts/token-inventory.json` is written by
  `propagate-tokens.js` (gitignored). 6 new tests (**309/309 scripts green**);
  eslint clean. Current burn-down: **2 warnings** (`widgets.css` `#333`/`#fff`).
- **P7 ✅ done 2026-09-16** — DTCG / Figma interchange. `scripts/lib/dtcg.js`
  (`exportDtcg` resolves references so the document carries concrete values;
  `importDtcg` returns `{ primitives, semantic, unmapped }`). Conventions:
  `primitives.color.<hue>.<step>` ↔ nested groups; simple groups
  (`layout`/`space`/`radius`/`breakpoint`/`hue`/`alpha`); `font.family/size/
  leading`; semantic roles carry the dark value in `$extensions["com.wprig.dark"]`.
  CLIs `rig:tokens:export` (`--out`, default `design/tokens.dtcg.json`) and
  `rig:tokens:import` (`--from`, `--mode merge|replace`, `--apply`; validates via
  `loadTokens`). `design/tokens.dtcg.json` is gitignored. 7 new tests incl. an
  export→import round-trip (**316/316 scripts green**); eslint clean;
  end-to-end export + import dry-run verified on the shipped tokens.
- **P8 ✅ done 2026-09-16** — docs. New `docs/DESIGN.md` (theme-dev contract:
  taxonomy, naming, math-first color, dark policy, config, workflows,
  precedence, add/rename, lint, commands). Updated
  `.ai/skills/{architecture,styles,typography}/SKILL.md`,
  `.ai/PROJECT_RULES.md`, `docs/css-architecture.md`,
  `docs/advanced-features.md`, `docs/top-10-reasons-to-use-wp-rig.md`,
  `docs/wp-rig-vs-roots-sage.md`, and added a `CHANGELOG.md` 3.5.0 entry.
- **Post-review finalization ✅ 2026-09-16 (advisor review → fixes):**
  - Ran `rig:tokens:setup --apply` on the framework source (98 refs / 17 files);
    JS `--mobile-breakpoint` → `--breakpoint-tablet`; zero legacy refs remain in
    `src/`. Flipped `theme.designTokens.legacyAliases` to **`false`**; regenerated
    — the alias layer is gone (build dropped 114.4 kB → 106.0 kB) and
    `wprig/no-undefined-custom-properties` confirms no dangling references.
  - Build bootstrap: added `prebuild:css` / `predev:css` / `prelint:css` hooks so
    a fresh checkout never hits missing (gitignored) generated files.
  - Reproducibility: `buildThemeJson` no longer reads the previous generated
    `theme.json` as input when `config/theme.custom.json` exists — generation is
    now a pure function of committed files (stray local drift no longer merges
    forward).
  - Bug fix: `wp-preset` semantic palette de-duplicates by slug (the legacy
    `text` slug collided with the semantic `text` role → duplicate slugs).
  - Config-aware token inventory; updated `tokens-setup` idempotency test.
  - **319/319 scripts tests green**; `lint:css` + eslint clean; `build:css` clean.

---

## 16. Open questions / decisions log

| # | Question | Status |
| --- | --- | --- |
| Q1 | Dark emission: `light-dark()` vs `@media` | **Decided:** `@media` (media) for v1; `light-dark()` future opt-in (§10.5) |
| Q2 | Color format: OKLCH vs hex | **Decided:** author OKLCH, emit hex default; `oklch` opt-in (§10.3) |
| Q3 | Legacy names: alias vs codemod | **Decided:** collapse-aware codemod now; no permanent aliases (§8.3) |
| Q4 | Binding: bound vs independent | **Decided:** config-selectable, both first-class; paradigm-aware defaults (§5) |
| Q5 | Does this become CSS-as-JSON? | **Decided:** no; JSON is a seed, CSS is the interface (§2.1) |
| Q6 | Multi-brand sets in v1? | Open — deferred to §9.8 unless a project needs it |
| Q7 | Contrast default severity | Proposed `error`; confirm it won't block existing themes (may start `warn`) |
| Q8 | DTCG as native format? | **Decided:** boundary only (§10.7) |
| Q9 | `@layer tokens` | Deferred to Track C3 (§10.9) |
| Q10 | Slug renames | Never automatic; documented decision only (§8.4) |
| Q11 | Derived-color output strategy | Proposed `both` (static fallback + progressive math); confirm whether a modern-only project may set `runtime`-only (§4.5.5) |

---

## 17. Future work (explicitly out of v1)

- OKLCH progressive output (`@supports`) + Display-P3 primitives.
- `darkMode: "class"` toggle with persisted preference + `color-scheme`.
- `light-dark()` opt-in.
- Promote `alpha()` to the default alpha path once it reaches Baseline and
  leaves at-risk status (§4.5.8).
- `dual` binding mode with drift detection (§5.4).
- Multi-brand semantic sets (§9.8).
- Full partial layering (base / components / utilities) — Track C3; the token
  layer and layer names are already reserved (§7.6.2).
- `@scope` for component scoping (reduces specificity hacks).
- `@starting-style` + view transitions for theme-switch animation.
- `if()` and `@function` to replace the build-time derive mirror with true
  runtime functions.
- `color-contrast()` once broadly supported, to replace the `contrast-on`
  build-time computation.
- `text-box-trim` / `text-box-edge` for optical typography.
- `interpolate-size` / `calc-size()` for intrinsic-size animation.
- Trig-driven procedural layouts (`sin()`/`cos()`) and full container-unit
  adoption.
- Style Dictionary adapter (in addition to native DTCG import/export).
- Token usage report (`rig:tokens:audit`) listing unused/overridden tokens.

---

## 18. Spike findings (Lightning CSS 1.33.0, project targets, 2026-09-16)

Time-boxed spike run through `lightningcss.transform()` / `bundleAsync()` with
the project's exact build options (`drafts: { customMedia: true }`, targets from
`.browserslistrc` = `> 1%` + `last 2 versions`). Resolved targets include
Chrome 148+, Safari 26.x, Firefox 151+ **plus legacy IE 11, Opera Mini, KaiOS,
UC/QQ/Baidu**.

### 18.1 Verified working (pass-through or correct downlevel)

| Feature | Result |
| --- | --- |
| `@layer` | Preserved; empty `@layer base;` / `@layer utilities;` order statements emitted to lock order |
| `@property` | Preserved intact (`syntax` / `inherits` / `initial-value`), moved after layer statements |
| `color-mix()` with `var()` | Passed through unchanged |
| Relative color `rgb(from var(…))` / `oklch(from var(…))` | Passed through unchanged |
| `alpha(from var(…))` | Passed through unchanged, **no error/warning** (bare or inside `@supports`) |
| `@supports (color: alpha(from red / 0.5))` | Preserved |
| `round()` / `pow()` / `sign()` | Passed through |
| `lh` / `rlh` / `cqi` | Passed through (`clamp()` normalized to `max/min`) |
| `prefers-contrast` / `forced-colors` + system colors | Preserved |
| Media range syntax `(width <= 782px)` | Downleveled to `(max-width: 782px)` |
| `text-wrap: balance` | Preserved |

### 18.2 Confirmed: literal math is transpiled, `var()` math is not

| Input | Output |
| --- | --- |
| `color-mix(in oklab, red 12%, white)` | `#ffebe7` (fallback) + `lab(94.55% …)` (modern) |
| `rgb(from red r g b / 50%)` | `rgba(255,0,0,.5)` (computed) |
| `oklch(from red calc(l - .06) c h)` | `#e20000` (fallback) + `lab(…)` |
| `alpha(from red / 50%)` | `rgba(255,0,0,.5)` (computed) |
| `color-mix(in oklab, var(--x) 12%, var(--y))` | unchanged (cannot compute) |

**Consequence:** the §4.5.5 build-time mirror is required **only** for
`var()`-based derivation (the runtime pattern). Literal derived tokens (the
mirror) are auto-transpiled by Lightning CSS into an sRGB fallback + modern
form — no hand-written `@supports` needed for those. Runtime inline math needs
the explicit `@supports` + static fallback.

### 18.3 Bug found and fixed in this spec: `@import … layer()` nests layers

With `@import "./gen.css" layer(tokens)` where `gen.css` declares
`@layer tokens, base, components, utilities;`, Lightning CSS composes the names:

```css
@layer tokens.tokens, tokens.base, tokens.components, tokens.utilities;
```

The token rules then land in `tokens.tokens`, not `tokens` — wrong cascade.
**Fix (§7.6.2): use plain `@import`; let `_tokens.generated.css` declare the
order and wrap its own content in `@layer tokens`.** Verified correct output:

```css
@layer tokens {
  :root { --color-accent: #e36d60; --color-custom: #41848f; }
}
@layer base, components, utilities;
```

### 18.4 Gotcha: `color-scheme` injects helper vars

Declaring `color-scheme` (even without `light-dark()`) makes Lightning CSS
inject `--lightningcss-light` / `--lightningcss-dark` into `:root` and the dark
`@media`. Harmless (2 extra custom properties, build-only — not present in
source) but unexpected; documented so it is not mistaken for a bug.

### 18.5 Legacy-target caveat

The resolved target set still includes **IE 11, Opera Mini, KaiOS, UC/QQ/Baidu**
(via `> 1%`). These do not support custom properties, so WP Rig theming is
already inert there — but note:

- `@layer` is **not** downleveled: non-supporting browsers drop layered rules
  entirely. Wrapping the *token* layer is therefore no additional regression
  (custom properties already fail), but **do not layer component CSS** until
  either the browserslist is narrowed or a fallback strategy exists.
- The §7.6.2 "unlayered CSS wins" safety argument holds for modern browsers
  only.

### 18.6 Recommendation

Proceed with §7.6 as specified, with the §7.6.2 plain-import correction. All
other modern-platform emissions in §7.6 are safe under the current toolchain.
