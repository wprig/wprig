# Advanced Features in WP Rig

WP Rig provides an out-of-the-box environment with support for modern technologies, including ES6 and extremely modern CSS, without needing additional configuration. Just write code, and WP Rig handles the heavy lifting for you.

## Configuration

Behavior in WP Rig can be customized by editing `./config/config.json`. Here, developers can set the theme name, author name (for translation files), and local server settings for BrowserSync. Additionally, compression of JavaScript and CSS files can be disabled for debugging purposes.

- **Custom Settings**: Override default settings (found in `./config/config.default.json`) by placing them in `./config/config.json`.
- **Local Settings**: Place local-only, untracked theme settings (such as a local path to a BrowserSync certificate) in `./config/config.local.json`.

## Key Advanced Features

- **Customizer Settings**: Easily add custom Customizer settings using a simple `.json` file.
- **Progressive Loading**: Optimized CSS loading for better performance.
- **Modern CSS**: Support for modern CSS features and layouts (compiled natively by **Lightning CSS** — nesting, custom media, `@layer`, container queries).
- **Component Scaffolding**: System to quickly create new theme components following architectural standards.
- **Paradigm system**: Choose **classic**, **universal**, or **block-based** via `theme.themeType`; features gate themselves through `config/paradigms.json`.

### Critical Asset Loading (Cookie-Based Inlining)

WP Rig includes a modular system for handling "Above the Fold" critical assets. This system uses a cookie-based strategy to provide the best of both worlds:

1. **First Visit**: CSS is inlined directly into the HTML `<head>` for the fastest possible First Contentful Paint (FCP).
2. **Subsequent Visits**: Once the assets are cached by the browser, a cookie (`wprig_critical_cached`) is set. On subsequent page loads, the theme detects this cookie and enqueues the assets as standard external files, reducing the HTML payload size.

#### How to use it
To opt-in an asset to this system, implement the `Asset_Provider` interface in your component and add the `strategy` key to your asset manifest:

```php
public function get_asset_manifest(): array {
    return [
        'styles' => [
            'my-critical-section' => [
                'file'     => 'section.critical.min.css',
                'strategy' => 'cookie-critical',
            ],
        ],
    ];
}
```

The `cookie-critical` strategy is registered by default in the `Performance\Component`. You can also create and register your own custom strategies by implementing the `Critical_Strategy_Interface`.

### Font Performance & Flash Prevention

WP Rig includes built-in optimizations to eliminate Flash of Unstyled Text (FOUT):

1. **Automatic Preloading**: When Google Fonts are localized to the `assets/fonts/` directory, the theme automatically detects and preloads them via `<link rel="preload">` to ensure they are available before the browser starts rendering.
2. **Optimized Display**: The theme defaults to `font-display: block` for localized fonts, instructing the browser to wait for the font before rendering text, which prevents the visual "flash" when switching from a fallback font.
3. **Asset Inlining**: Localized font CSS is automatically integrated into the `Asset_Provider` system, allowing it to be inlined for faster delivery.

### Theme-scoped Blocks (Gutenberg)

WP Rig includes a built-in system for creating and managing theme-scoped Gutenberg blocks, powered by `@wordpress/create-block` and fully integrated with the theme’s build and dev workflows (Node and Bun).

#### Key Features
- Scaffold blocks inside the theme (never as a plugin) using `assets/blocks/<slug>/`.
- **Auto-registration**: The theme automatically discovers and registers blocks on `init`.
- **Build Integration**: JS and CSS for blocks are built and watched by existing commands.
- Supports both `npm` and `bun` for all commands.

#### Quick Start
- **Create a block (static)**:
	- `npm run block:new hero --title="Hero"`
- **Create a dynamic block (server-rendered)**:
	- `npm run block:new:dynamic testimonial`
	- `npm run block:new testimonial -d --title="Testimonial"`
- **Create a PHP-only block (auto-registered, no build)**:
	- `npm run block:new newsletter --php`
- **List blocks**: `npm run block:list`
- **Remove a block**: `npm run block:remove wprig/hero`
- **Promote to a plugin**: `npm run block:promote-plugin wprig/hero`
- **Inspect/compile against the live site**: `npm run block:schema` and `npm run block:compile <ir.json>` (WP-CLI Gutenberg bridge).

#### Command Reference
- `block:new <namespace>/<slug>` or `<slug>`
	- Options:
		- `--title <string>`: Human title for the block
		- `-d, --dynamic`: Generate a dynamic block with `render.php`
		- `--ts`: Use TypeScript template (`.tsx`)
		- `--php` / `--architecture php`: PHP-only block — no `src/` build, registered via `supports.autoRegister` (Gutenberg 23.8)
		- `--category <string>`: Defaults to `widgets`
		- `--icon <dashicon|svg>`
		- `--description <string>`
		- `--keywords "word1,word2"`
		- `--no-style`: Do not create `style.css`
		- `--no-editor-style`: Do not create `editor.css`
		- `--view`: Also generate an optional frontend-only script (`view.js`)

All scaffolds target `apiVersion: 3` (the Gutenberg 23.8 / WP 7.1 default).

#### Filesystem Layout
Each block lives under `assets/blocks/<slug>/`:
- `block.json`
- `src/index.(js|ts|tsx)` – entry point (editorScript)
- `src/edit.(js|ts|tsx)` – edit component
- `style.css` – frontend styles (optional)
- `editor.css` – editor-only styles (optional)
- `render.php` – only for dynamic blocks
- `build/` – compiled assets output

#### Auto-registration in PHP
The theme component at `inc/Blocks/Component.php` scans `assets/blocks/*/block.json` on `init`. No manual PHP changes are required after scaffolding a new block.
