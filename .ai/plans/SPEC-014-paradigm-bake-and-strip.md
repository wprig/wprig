# Spec: Paradigm Bake-and-Strip for Production Bundles (SPEC-014)

- **Paradigm tag:** `all`
- **Type:** To the framework (build pipeline / zero-bloat architecture)
- **Status:** Approved (Option A — bake at build time; stripping applies to both `bundle` and `bundle:wporg`; `Paradigm.php` ships as a baked stub class)

## 1. Problem

`inc/Paradigm.php` is the PHP half of the paradigm resolver (JS half: `scripts/lib/paradigm.js`). At runtime it reads `config/paradigms.json` and the merged theme config to gate components via `Paradigm_Component_Trait` / `is_active()`.

The production bundle is currently **broken** by this design:

1. The PHP prod task copies all `inc/**/*.php`, including `Paradigm.php`, `Paradigm_Component_Trait.php`, and `Classic_Component_Trait.php`.
2. No bundle task copies `config/*.json` (nor should it — dev machinery must not ship).
3. On first request, `Theme::get_default_components()` → `Sidebars\Component::is_active()` → `Paradigm::is_enabled()` → `file_get_contents()` on a missing `config/paradigms.json` → uncaught `RuntimeException` → fatal.

Paradigm resolution is a **development-time** concern: once the theme type is chosen and the theme is built, the answer is fixed. The bundle should never carry the resolver machinery or re-read JSON on every request.

## 2. Solution Strategy

Bake the paradigm decision into the production PHP at build time:

1. **Resolve once:** the build already resolves the active theme type (`getActiveThemeType()` / `isFeatureEnabled()` in `scripts/lib/paradigm.js`, validated on every config load).
2. **Strip gated-out components:** for each `inc/<Component>/` directory, read its paradigm tag (`const PARADIGM = '<tag>';` in `Component.php`; default `all` when absent). If `!isFeatureEnabled(tag)`, skip copying **all** files in that directory.
   - No `Theme.php` rewrite is needed: `Theme::get_default_components()` registers components via directory scan (`inc/Theme.php:280-294`); stripped directories simply don't register. Template guards (`sidebar.php:12`, `Image_Sizes/Component.php:97`, `Styles/Component.php:364`) use `class_exists()` and stay correct.
   - This changes **plain `bundle` behavior** (approved): a `classic` themeType bundle now also drops `Block_Patterns` (block-based); a `block-based` bundle drops the four `classic` components. This matches the JS side, where `constants.js` already gates FSE assets via `isFeatureEnabled('block-based')` in both dev and prod.
   - Existing plugin-territory stripping in `prodCopyWporgSrc` (inc/Blocks, assets/blocks) is unchanged and still runs on top for wporg.
3. **Bake `inc/Paradigm.php` as a stub:** replace the class body with the resolved values inlined — `get_definitions()` returns the matrix as a PHP array literal, `get_active_theme_type()` returns the baked string constant, `is_enabled()` keeps its existing in-array logic against the baked values. Same class + API; no file reads, no `get_config()` dependency, no `config/` required. Child themes calling `Paradigm::is_enabled()` keep working.
   - Traits (`Paradigm_Component_Trait`, `Classic_Component_Trait`) ship **unchanged** — they only call `Paradigm::is_enabled()`, which works against the baked stub. Their remaining users are all gated-in, so `is_active()` resolves `true` at runtime with zero JSON I/O.
4. **`config/` continues not to ship.** Runtime `get_config('config.json')` callers that remain all degrade gracefully without it (verified: `Block_Patterns` uses `?? array()`, `Performance` uses `??` defaults, `Dev_Tools` is already excluded from bundles).

Out of scope: dev builds keep full runtime gating (the dev workflow — flip `themeType` in config, refresh — depends on it).

## 3. Detailed Technical Changes

### Step 1: New pure-logic module — `scripts/lib/bakeParadigm.js`

Pure, unit-testable functions (no fs):

```js
// Extract the paradigm tag from a Component.php source string.
export function extractParadigmTag( componentPhpSource ) // → 'all'|'classic'|'universal'|'block-based'; throws on unknown tag value

// Decide whether a component directory ships for the active theme type.
export function shouldIncludeComponent( tag, activeThemeType, definitions ) // → boolean (mirrors Paradigm::is_enabled / JS isFeatureEnabled matrix)

// Produce the baked Paradigm.php stub for a theme type.
export function bakeParadigmClass( activeThemeType, definitions ) // → string (PHP source, no file_get_contents, no get_config)

// Per-file prod transform dispatcher used by the php task.
export function bakeProdPhp( srcFile, relToRoot, content, ctx ) // → { skip: true } | { content }
```

Rules encoded in `bakeProdPhp`:
- Path under `inc/<Name>/Component.php` → extract tag; when gated out, return `{ skip: true }` (caller skips the whole directory once the Component.php is skipped — simpler: the php task pre-filters the glob results by directory).
- `inc/Paradigm.php` → return baked stub content.
- Any other file → returned unchanged.
- Fail fast (throw) on malformed tag values, consistent with the dev-time `Paradigm` class.

### Step 2: Wire into `scripts/tasks/php.js`

In the prod branch:
1. After globbing, resolve `activeThemeType = getActiveThemeType()` (imported from `../lib/paradigm.js`) and load `config/paradigms.json` once.
2. Pre-filter the file list: any file under `inc/<Dir>/` whose `Component.php` tag is gated out is dropped from the copy set.
3. Pass surviving files through `bakeProdPhp()` before `writeFileEnsured`.

The `@dev-only` pragma stripping (`removeDevOnlyBlocks`) continues to run after the bake transform.

### Step 3: Regression tests

**Jest unit tests — `scripts/tests/bake-paradigm.test.js`:**
- Tag extraction: declared tag parsed; missing tag → `all`; unknown tag → throws.
- Include/skip matrix: all 4 theme types × 4 tags match `config/paradigms.json` exactly (same assertions as `scripts/tests/paradigm.test.js`, proving PHP stub + JS resolver can never diverge).
- Baked stub: contains the active theme type string; contains **no** `file_get_contents`, **no** `paradigms.json`, **no** `get_config`; output is valid PHP (`php -l` via child process, skipped when php binary unavailable).
- `bakeProdPhp` dispatcher: transforms only `inc/Paradigm.php`, returns skip for gated component paths, identity for everything else (Theme.php, templates, functions.php).

**Bundle e2e — extend `scripts/tests/bundle-wporg-e2e.test.js`:**
- `config/` directory does **not** exist in the prod output.
- `inc/Paradigm.php` exists, contains the baked theme type, and contains no `file_get_contents` / `paradigms.json` references.
- Components are present/absent exactly as the paradigm matrix predicts for the active theme type.
- Prod `inc/Theme.php` contains no class references to stripped components.
- Every prod `*.php` file passes `php -l` (skipped when php is unavailable on the runner).
- Traits exist and contain no JSON reads.

**PHPUnit:** no new tests required — the runtime `Paradigm` class is unchanged in dev and already covered by `tests/phpunit/unit/Paradigm/Paradigm_Test.php`. (The transform is build-time JS; PHP tests cannot execute build output.)

## 4. Verification

1. `npx jest scripts/tests/bake-paradigm.test.js scripts/tests/bundle-wporg-e2e.test.js scripts/tests/paradigm.test.js`
2. Full jest suite (`npm run test:scripts` or equivalent).
3. `npm run bundle` (classic default) → inspect prod dir: classic components present, `Block_Patterns` absent, stub baked, `config/` absent, `php -l` clean on all output.
4. Flip `config.local.json` `theme.themeType` to `block-based` → `npm run bundle` → inverted component set; restore local config.
5. `npm run ai:check` (PHPCS/PHPStan/ESLint/Stylelint clean; PHP behavior unchanged in dev so PHPUnit suite must stay green).
