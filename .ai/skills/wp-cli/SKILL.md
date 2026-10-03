---
name: wp-cli
description: Guide for using WP Rig custom WP-CLI commands to manage development environments.
globs: wp-cli/**/*.php
---

# WP Rig WP-CLI commands

WP Rig provides a set of custom WP-CLI commands to streamline development tasks. All commands are available under the `wp rig` namespace.

## Environment Setup

*   `wp rig dev_setup`: Automatically configures a new WordPress environment by installing curated plugins (like FakerPress and Theme Check) and setting up basic pages (Home and Blog).
*   `wp rig test-setup`: Prepares the environment for End-to-End testing by importing Theme Unit Test data and configuring optimal settings for tests.
*   `wp rig import-test-data`: Manually trigger the import of the official WordPress Theme Unit Test data.

## Menu Management

*   `wp rig fake_menu_items`: Generates a hierarchical dummy menu for testing navigation styles.
    *   **Options:** `--items=8`, `--depth=3`, `--prefix="Nav Item"`, `--assign-location=primary`
*   `wp rig menu list`: Lists all available navigation menus in the environment.
*   `wp rig menu export`: Exports a specific menu to a JSON file.
    *   **Options:** `wp rig menu export "Main Menu" --file=main-menu.json --pretty`
*   `wp rig menu import`: Imports a menu from a JSON file created by the export command.
    *   **Options:** `wp rig menu import main-menu.json --overwrite`

## Typography

*   `wp rig fonts_download`: Downloads Google Fonts defined in your theme and saves them locally in `assets/fonts/` for GDPR compliance and performance.
    *   **Options:** `--dir=assets/fonts`

## Best Practices for Agents

1.  **Use `wp rig dev_setup`** on a new WordPress site to quickly install essential development plugins.
2.  **Use `wp rig test-setup`** before running `npm run test:e2e` to ensure the environment matches the test data expectations.
3.  **Export your test menus** using `wp rig menu export` when sharing a theme configuration to ensure the exact menu structure is preserved.
4.  **Run `wp rig fonts_download`** periodically to ensure all theme fonts are properly cached and available offline.
