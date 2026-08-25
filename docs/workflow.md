# Build Process & Development Workflows

WP Rig uses a fast and efficient build process powered by modern tools like [Lightning CSS](https://lightningcss.dev/) and [esbuild](https://esbuild.github.io/).

## Core Principles

- All development is done in the `wp-rig` development theme.
- PHP files can be edited directly.
- Source assets should only be edited in their respective `src` locations:
	- **CSS**: `assets/css/src` (Processed by Lightning CSS).
	- **JS/TS**: `assets/js/src` (Processed by esbuild).
	- **Images**: `assets/images/src` (Optimized by sharp; JPEG/PNG additionally emit WebP + AVIF via `scripts/tasks/images.js`).

## Workflows

### Style Workflow

Source CSS files in `assets/css/src/` are compiled by **Lightning CSS** via `build-css.js` (native nesting, custom media, custom properties, `@layer`, container queries — no PostCSS/Sass step):

1. **Edit**: Modify source files (e.g., `_header.css`).
2. **Import**: `global.css` imports partials via `@import`.
3. **Build**: `build-css.js` compiles with Lightning CSS and the Browserslist targets.
4. **Enqueue**: `Styles/Component.php` enqueues compiled CSS.

**Conditional loading**: Some stylesheets are only loaded on specific pages. See `get_css_files()` in `Styles/Component.php`.

**CSS preloading & paradigm gating**: `config/dev.styles.preload` lists partials injected into every bundle (e.g., `_custom-media.css`). `dev.styles.preloadBlockBased` (`_blocks-based.css`) is appended **only** when the active theme type is block-capable (`theme.themeType` `universal` or `block-based` via `isFeatureEnabled('block-based')`) — it never ships in a classic theme.

**Style budget (enforced)**: `npm run lint:css` fails on nesting deeper than 3 levels, selector specificity above `(0,4,1)`, `!important`, custom properties read without `var()`, and descending-specificity. See the [Modern CSS Playbook skill](../.ai/skills/styles/SKILL.md).

### Script Workflow

TypeScript/JavaScript in `assets/js/src/` is bundled by esbuild via `build-js.js`:

1. **Edit**: Modify source files (e.g., `navigation.ts`).
2. **Build**: `build-js.js` compiles TypeScript, bundles, and minifies.
3. **Enqueue**: `Scripts/Component.php` enqueues with async/defer loading.

### Modern Dev Server (Opt-in)

For a faster, Vite-like development experience without BrowserSync, use the new modern dev server:

- Configure your local proxy in `config/config.json` under `dev.browserSync`:
	- `live`: true
	- `proxyURL`: "localwprigenv.test" (or include a port, e.g., "localwprigenv.test:8888")
	- `https`: false (set true if your local site is HTTPS)
	- `keyPath`/`certPath`: file paths to your SSL key/cert if https is true
	- `devPort`: 3000 (port for the local proxy server)
- Start it with: `npm run dev:modern`
- Visit: `http://localhost:3000` (or `https` if configured)

#### Debugging the modern dev server
- Run in verbose mode: `npm run dev:modern:debug` (or `bun run dev:modern:debug`), which enables extra logging and stack traces.
- Environment variable: set `WPRIG_DEBUG=1` to toggle debug logs.
- Common checks:
	- Ensure `config/config.json` has the correct `dev.browserSync.proxyURL`.
	- Verify ports are free: proxy `devPort` (default 3000) and LiveReload 35729.
	- If the process exits with code 1, re-run in debug to see detailed error logs.
	- Check Node version (>= 20) and that dev deps are installed: `npm i`.

### Translation Process

The translation process generates a `.pot` file in the `./languages/` directory.

- **Automatic**: Runs during production builds unless `export:generatePotFile` in `config.json` is `false`.
- **Manual**: Run `npm run rig:localize`.

### Production Bundle Process

`npm run bundle` generates a production-ready theme directory and optionally a `.zip` archive.

- **Optimizations**: Builds all source files, optimizes for production (images emit WebP + AVIF), performs string replacement, and runs translations.
- **Cleanup**: Non-essential files from the development theme are excluded from the production bundle.

### Paradigm configuration

WP Rig serves three theme-dev paradigms — **classic**, **universal** (hybrid), and **block-based** (FSE). The active type is a one-line change in `config/config.json` (`theme.themeType`; default in `config.default.json`) and gates every feature via the shared paradigm system (`config/paradigms.json` → JS `scripts/lib/paradigm.js` → PHP `inc/Paradigm.php`). Block-capable types (`universal`/`block-based`) automatically enable block compilation (`enableBlocks: true`) during `npm run rig-init`.

## Recommended code editor extensions

To take full advantage of the features in WP Rig, visit the [Recommended code editor extensions Wiki page](https://github.com/wprig/wprig/wiki/Recommended-code-editor-extensions).

## Browser Support

WP Rig supports browsers listed in `.browserslistrc`. It adds CSS prefixes and transpiles JavaScript but does **not** add polyfills for missing browser support.
