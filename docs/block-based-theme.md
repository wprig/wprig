# Convert to a Strictly Block-Based Theme

WP Rig includes a helper script to strip classic-only code and align the theme with a Full Site Editing (block-based) setup.

## Usage

```bash
npm run block-based [options]
```

### Options

- `--dry-run`: Print a summary of intended changes without writing any files.
- `--prune-html5`: Remove the `add_theme_support( 'html5', ... )` block.
- `--drop-title-tag`: Remove the `action_title_tag_support()` method and its `init` hook.

## What it removes by default

The script modifies `inc/Base_Support/Component.php` and removes:

- **Hooks**: `action_add_pingback_header`, `filter_body_classes_add_hfeed`, `filter_embed_dimensions`, `filter_script_loader_tag`.
- **Method definitions**: for the above hooks.
- **Theme support**: `automatic-feed-links` and `customize-selective-refresh-widgets`.

## Notes

- The script is idempotent: running it multiple times will not cause further changes.
- A one-time backup is created at `inc/Base_Support/Component.php.bak`.
- **Warning**: This process is largely irreversible without manual intervention or restoring from git.

---

## Responsive visibility & `blockVisibility` (WP 7.1)

WordPress 7.1 lets editors show/hide blocks per viewport through the block's
**Visibility** control. The editor writes `metadata.blockVisibility` on the block,
and core's `wp_render_block_visibility_support` emits `display: none !important`
via `wp-block-hidden-mobile` / `wp-block-hidden-tablet` / `wp-block-hidden-desktop`
classes inside media queries derived from `settings.viewport`.

WP Rig aligns its responsive system to the **same** viewport scale, so the editor
preview and the frontend agree:

| Boundary | Value | Source |
| --- | --- | --- |
| `settings.viewport.mobile` | `480px` | `config/tokens.json` → `theme.json` (G1) |
| `settings.viewport.tablet` | `782px` | `config/tokens.json` → `theme.json` (G1) |
| Nav hamburger toggle hides | `481px` (`--wide-menu-query` = mobile + 1) | generated `@custom-media` (G2) |
| JS nav-collapse boundary (`--mobile-breakpoint`) | `782px` = tablet | generated `@custom-media` (G2) |

### What to use where (avoid double-toggling)

- **Content blocks** (groups, sections, hero, images): use the editor's block
  Visibility control for responsive hiding — it previews correctly because the
  editor and frontend share the same breakpoints.
- **Navigation block / theme parts**: keep these **theme-managed**. The nav system
  self-toggles (hamburger ≤ 480px, drawer collapse at 782px) and its markup is
  intentionally decoupled from block-visibility. Do **not** also hide the
  Navigation block (or a theme part containing it) via the Visibility control —
  the `display: none !important` wrapper rule can fight the nav's responsive
  container and produce a double-toggle or an unrecoverable hidden menu.
  Configure the nav's own responsive settings (`overlayMenu` / responsive
  navigation) instead.

## Preset slug collisions with core defaults (silent override risk)

WordPress ships default color and font-size presets. If a theme defines a
preset whose **slug** matches a core default (`black`, `white`, `small`,
`large`, `medium`, `x-large`, …), the theme's value **silently overrides** the
core preset — intended WP merge behavior, but easy to miss: the DOM class and
CSS variable name look correct while the resolved value differs.

WP Rig guards this at the tooling level:

- `npm run rig:tokens` prints a warning for every generated palette/font-size
  slug that collides with a core default.
- The theme-review validator (`theme-json` check) flags collisions in
  hand-authored `theme.json` files.

Fix options when a collision is unintended: rename the slug (e.g. `base`,
`xlarge`, `brand`), or disable core defaults explicitly in `theme.json`
settings — `color.defaultPalette`, `color.defaultGradients`,
`color.defaultDuotone`, `typography.defaultFontSizes` — set to `false`.

## Full-bleed template parts (`is-style-full-bleed`)

Baseline block-based styling (`assets/css/src/_blocks-based.css`) clamps header
and footer template parts (`.wp-block-template-part`, `.wp-site-header`,
`.wp-site-footer`) to `--content-width` with inline padding. To make a part
run edge-to-edge (full-bleed redesigns), add the **`is-style-full-bleed`**
class to the part (or its wrapping group) in the site editor — "Advanced →
Additional CSS class". The stylesheet ships the override rules; the Navigation
block inside a full-bleed part is released from its content-width clamp as
well.
