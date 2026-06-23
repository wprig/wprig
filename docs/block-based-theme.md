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
