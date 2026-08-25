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
