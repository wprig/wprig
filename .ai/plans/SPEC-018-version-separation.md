# SPEC-018: Framework vs. Theme Version Separation

- **Status:** Implemented
- **Tag:** `all`
- **Branch:** `feature/3.5-icon-block-registration`
- **Depends on:** —

## 1. Problem

WP Rig conflated the **framework version** (WP Rig itself) with the **theme
version** (the theme being built with it): both were the same `3.5.0` in
`package.json`, `style.css`, `readme.txt`, and `CHANGELOG.md`, bumped together by
`promoteVersion`. Worse, the production build's `nameFieldDefaults.version`
sentinel was stale (`3.0.1`), so the `style.css` replacement never matched and
the framework version leaked into the bundled theme.

## 2. Design

Two independent version streams:

| Stream | SSOT | Bundled? |
| --- | --- | --- |
| Framework | `config/framework.json` (mirror: `package.json`) | No — source-only, stripped on `childify` |
| Theme | `config/config.default.json` → `theme.version` (override: `config/config.json`) | Yes — stamped into `style.css`/`readme.txt` |

### 2.1 Framework version
- `config/framework.json` = `{ "name": "wp-rig", "version": "3.5.0" }`.
- `config/` is not in `export.filesToCopy`, so it is never bundled.
- `childify` calls `stripFrameworkVersion()` to delete the file from built themes.
- `Versioning_Trait::get_wp_rig_version()` reads it; `null` when absent.
  Exposed via `wp_rig()->get_wp_rig_version()` (Base_Support).

### 2.2 Theme version
- `config.default.json`/`config.json` `theme.version` is authoritative.
- Source `style.css`/`readme.txt` align to it (`1.0.0`).
- `prodStringReplace` explicitly stamps `Version:` / `Stable tag:` from
  `config.theme.version`; `readme.txt` added to `stringReplaceSrc`.
- `nameFieldDefaults.version` removed.

### 2.3 CLI
- `rig version <v>` → theme (config + style.css + readme + CHANGELOG).
- `rig version:framework <v>` → framework (framework.json + package.json + CHANGELOG).
- `rig version` (no arg) → prints both.

## 3. Files

- New: `config/framework.json`, `scripts/lib/versions.js`,
  `scripts/tasks/promoteFrameworkVersion.js`, `scripts/tests/versions.test.js`,
  `scripts/tests/promote-version.test.js`.
- Changed: `scripts/tasks/promoteVersion.js`, `scripts/rig.js`,
  `scripts/lib/constants.js`, `scripts/tasks/prodStringReplace.js`,
  `inc/Versioning_Trait.php`, `inc/Base_Support/Component.php`,
  `node/childify.js`, `style.css`, `readme.txt`, `package.json`,
  `scripts/tests/childify.test.js`,
  `tests/phpunit/unit/Base_Support/Component_Tests.php`, docs.

## 4. Acceptance criteria

- [x] `rig version` prints theme + framework versions independently.
- [x] `rig version <v>` changes only the theme version.
- [x] `rig version:framework <v>` changes only the framework version.
- [x] Built theme contains no framework version (`childify` strips the file).
- [x] Build stamps theme version into `style.css`/`readme.txt`.
- [x] `get_wp_rig_version()` → version in source, `null` when absent.
- [x] PHPUnit + jest + PHPCS/PHPStan clean.

## 5. Risks

- Existing tooling assuming `package.json.version === theme version` must switch
  to `config.theme.version` (documented in the version-management skill).
- Translators' `.po` files are untouched by version stamping (no churn).
