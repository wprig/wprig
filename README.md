<img align="right" width="90" height="90"
src="https://avatars1.githubusercontent.com/u/38340689"
title="WP Rig logo by Morten Rand-Hendriksen and Rob Ruiz">

# WP Rig: WordPress Theme Boilerplate

[![Build Status](https://github.com/wprig/wprig/workflows/CI/badge.svg)](https://github.com/wprig/wprig/actions)
[![License: GPL](https://img.shields.io/github/license/wprig/wprig)](/LICENSE)
[![GitHub release](https://img.shields.io/github/v/release/wprig/wprig?include_prereleases)](https://github.com/wprig/wprig/releases)

## Your Performance-Focused Development Rig

A progressive theme development rig for WordPress, WP Rig is built to promote the latest best practices for progressive
web content and optimization. Creating a theme from WP Rig means adopting this approach and the core principles it is
built on:

- Accessibility
- Mobile-first
- Progressive enhancement
- [Resilient Web Design](https://resilientwebdesign.com/)
- Progressive Web App enabled

We are trying to be the starter theme for design-focused devs. If you have any ideas, questions, or suggestions for this
project or are seeking to get involved in contributing or maintaining, please check out
our [discussion board on Github](https://github.com/wprig/wprig/discussions) and
read [our contribute page](https://wprig.io/contribute/) on our website.

## Documentation

We have a new Documentation area that can be found on the [WP Rig website](https://wprig.io/documentation/).
If you would like to contribute to our documentation efforts, please submit a request on
our [contribute page](https://wprig.io/contribute/) on our website.

## Installation

WP Rig has been tested on Linux, Mac, and Windows.

### Requirements

WP Rig requires the following dependencies. Full installation instructions are provided at their respective websites.

- [PHP](http://php.net/) 8.1 or higher (PHP 8.3 recommended)
- [npm](https://www.npmjs.com/) or [bun](https://bun.com/)
- [Composer](https://getcomposer.org/) (installed globally)

### WP Rig and child themes

WP Rig is built to lay a solid theme foundation, which makes it excellent for both parent themes and child themes. WP Rig now includes a dedicated childify script that optimizes the theme for use as a child theme while maintaining all the development benefits of the WP Rig workflow. This allows you to create lightweight child themes that inherit functionality from any parent theme while still leveraging WP Rig's build system.

### How to install WP Rig:

1. Clone or download this repository to the themes folder of a WordPress site on your development environment.
	- DO NOT give the WP Rig theme directory the same name as your eventual production theme. Suggested directory names
	  are `wprig` or `wprig-themeslug`. For instance, if your theme will eventually be named “Excalibur” your
	  development directory could be named `wprig-excalibur`. The `excalibur` directory will be automatically created
	  during the production process and should not exist beforehand.
2. Configure theme settings, including the theme slug and name.
	- View `./config/config.default.json` for the default settings.
	- Place custom theme settings in `./config/config.json` to override default settings.
		- You do not have to include all settings from config.default.json. Just the settings you want to override.
	- Place local-only theme settings in `./config/config.local.json`, e.g. potentially sensitive info like the path to
	  your BrowserSync certificate.
		- Again, only include the settings you want to override.
3. In the command line, run `npm run rig-init` to install necessary node and Composer dependencies.
4. In the command line, run `npm run dev` to process source files, build the development theme, and watch files for
   subsequent changes.
	- `npm run build` can be used to process the source files and build the development theme without watching files
	  afterwards.
	- `npm run childify` can be used to convert your WP Rig theme into a lightweight child theme that inherits from any parent theme.
5. In WordPress admin, activate the WP Rig development theme.

#### Recommended Git Workflow
When working with WP Rig, it is important to understand the appropriate Git workflow depending on what you are working on.
If you are using WP Rig as a starting point for a new theme, you should use the following workflow:

[Recommended Git Workflow](https://wprig.io/documentation/recommended-git-workflow/)

It is also important to note that the main branch now ignores the package-lock.json file.
While this is ideal for how we distribute WP Rig, it can cause issues when working with a local development environment or on a team using a forked WP Rig.
If you are using a local development environment, you should add the package-lock.json file to the .gitignore file
with a ! in front to prevent ignoring the file in your new theme's repo.

#### Defining custom settings for the project

Here is an example of creating a custom theme config file for the project. In this example, we want a custom slug, name,
and author.

Place the following in your `./config/config.json` file. This config will be versioned in your repo, so all developers
use the same settings.

```
{
  "theme": {
    "slug": "newthemeslug",
    "name": "New Theme Name",
    "author": "Name of the theme author"
  }
}
```

#### Defining custom settings for your local environment

Some theme settings should only be set for your local environment. For example, if you want to set local information for
BrowserSync.

Place the following in your `./config/config.local.json` file. This config will not be tracked in your repo and will
only be executed in your local development environment.

```
{
  "browserSync": {
    "live": true,
    "proxyURL": "localwprigenv.test",
    "https": true,
    "keyPath": "/path/to/my/browsersync/key",
    "certPath": "/path/to/my/browsersync/certificate"
  }
}
```

If your local environment uses a specific port number, for example, `8888`, add it to the `proxyURL` setting as follows:

```
"proxyURL": "localwprigenv.test:8888"
```

## How to build WP Rig for production:

1. Follow the steps above to install WP Rig.
2. Run `npm run bundle` from inside the `wp-rig` development theme.
3. A new, production-ready theme will be generated in `wp-content/themes`.
4. The production theme can be activated or uploaded to a production environment.

Build, watch, and bundle integration
- JS: `build-js.js` discovers `assets/blocks/**/src/index.(js|ts|tsx)` (and optional `view.*`) and outputs to `assets/blocks/<slug>/build/`.
- CSS: `build-css.js` compiles each block’s `style.css` -> `build/style.css` and `editor.css` -> `build/editor.css` (with sourcemaps in dev; none in build/bundle).
- Dev/watch: `npm run dev` or `bun run dev` runs the dev servers and rebuilds on changes to any block’s `src` or CSS, with live reload.
- Production: `npm run bundle` or `bun run bundle` includes the compiled block assets in the production bundle.

i18n
- Block JavaScript uses `@wordpress/i18n`. The CLI templates set the `textdomain` to your theme slug so WordPress can load translations automatically.

Notes and validation
- Namespacing: Use `<namespace>/<slug>`; namespace defaults to your theme’s slug if omitted.
- If a directory already exists for the slug, `block:new` fails with a friendly message.
- Dynamic vs static: Use `--dynamic` when you want server-side rendering via `render.php`. Otherwise, the block is static (no `render` in block.json).

We have a new Documentation area that can be found on the [WP Rig website](https://wprig.io/documentation/).
If you would like to contribute to our documentation efforts, please submit a request on
our [contribute page](https://wprig.io/contribute/) on our website.


### Wiki: Recommended code editor extensions

To take full advantage of the features in WP Rig, visit
the [Recommended code editor extensions Wiki page](https://github.com/wprig/wprig/wiki/Recommended-code-editor-extensions).

## Working with WP Rig

WP Rig can be used in any development environment. It does not require any specific platform or server setup. It also
does not have an opinion about what local or virtual server solution the developer uses.

Before the first run, visit the [BrowserSync wiki page](https://github.com/wprig/wprig/wiki/BrowserSync).

### Available Processes

#### `dev watch` process

`npm run dev` will run the default development task that processes source files. While this process is running, source
files will be watched for changes, and the BrowserSync server will run. This process is optimized for speed, so you can
iterate quickly.

#### `dev build` process

`npm run build` processes source files one-time. It does not watch for changes nor start the BrowserSync server.

### Modern Dev Server (Opt-in)

For a faster, Vite-like development experience without BrowserSync, use the new modern dev server:

- Configure your local proxy in config/config.json under dev.browserSync:
	- live: true
	- proxyURL: "localwprigenv.test" (or include a port, e.g., "localwprigenv.test:8888")
	- https: false (set true if your local site is HTTPS)
	- keyPath/certPath: file paths to your SSL key/cert if https is true
	- devPort: 3000 (port for the local proxy server)
- Start it with: npm run dev:modern
- Visit: http://localhost:3000 (or https if configured)

Notes
- This should be considered a beta dev/watch server. We have not done enough testing to fully replace BrowserSync yet.
However, the legacy system should be considered deprecated and will be fully replaced in later versions.
- Livereload is auto-injected only when browsing via the dev proxy. No code changes required.
- JS is rebuilt with esbuild on save. CSS is built via Lightning CSS and watched for changes.
- PHP/template edits trigger soft reloads.
- Legacy dev flow is untouched; set dev.browserSync.live=false to disable modern server and use npm run dev instead.

#### Debugging the modern dev server
- Run in verbose mode: `npm run dev:modern:debug` (or `bun run dev:modern:debug`), which enables extra logging and stack traces.
- Environment variable: set `WPRIG_DEBUG=1` to toggle debug logs.
- Common checks:
	- Ensure `config/config.json` has the correct `dev.browserSync.proxyURL` (and `https`, `keyPath`, `certPath` if needed).
	- Verify ports are free: proxy `devPort` (default 3000) and LiveReload 35729. Change `devPort` in config if needed.
	- If the process exits with code 1, re-run in debug to see detailed error logs.
	- Check Node version (>= 20) and that dev deps are installed: `npm i`.

#### `translate` process

The translation process generates a `.pot` file for the theme in the `./languages/` directory.

The translation process will run automatically during production builds unless the `export:generatePotFile`
configuration value in `./config/config.json` is set to `false`.

The translation process can also be run manually with `npm run translate`. However, unless `NODE_ENV` is defined
as `production`, the `.pot` file will be generated against the source files, not the production files.

#### `production bundle` process

`npm run bundle` generates a production-ready theme as a new theme directory and, optionally, a `.zip` archive. This
builds all source files, optimizes the built files for production, does a string replacement and runs translations.
Non-essential files from the `wp-rig` development theme are not copied to the production theme.

To bundle the theme without creating a zip archive, define the `export:compress` setting in `./config/config.json`
to `false`:

```
export:
{
	compress: false
}
```

### Build process

WP Rig uses a fast end efficient build process to generate and optimize the code
for the theme. Modern PHP, a curated set of Node/Bun and Composer scripts, [Lightning CSS](https://lightningcss.dev/), and [esbuid](https://esbuild.github.io/) are mainly used to provide the underlying functionality.
All development is done in the `wp-rig` development theme. Feel free to edit any `.php` files.
You should only edit the source asset files in the following
locations:

- CSS: `assets/css/src` (Processed by Lightning CSS)
- JavaScript/Typescript: `assets/js/src` (Processed by esbuild)
- images: `assets/images/src` (Processed by imagemin)

### CLI Commands / Scripts

WP Rig comes loaded with Node/Bun, Composer, and WP CLI scripts to dramatically improve the developer experience for WP theme devs.

#### NPM/Bun Scripts

- `dev`: Watch source files and rebuild on changes with BrowserSync
- `build`: One-time build of source files without watching
- `bundle`: Generate production-ready theme with optimizations
- `translate`: Generate POT translation file
- `block:new`: Create a new Gutenberg block
- `block:list`: List all theme blocks
- `block:remove`: Remove a block with confirmation
- `block:promote-plugin`: Export block as plugin
- `create-rig-component`: Scaffold new theme component

#### Composer Scripts

- `test:unit`: Run unit tests
- `test:integration`: Run integration tests
- `test:all`: Run all tests
- `phpcbf-dev`: Run PHP Code Beautifier
- `phpcs-dev`: Run PHP CodeSniffer
- `fix`: Run all code fixers (Rector, PHP-CS-Fixer, PHPCBF)
- `setup-wp-tests`: Setup WordPress test environment

### Convert to a strictly block-based theme

WP Rig includes a helper to strip classic-only code from the Base_Support component and align the theme with a Full Site Editing (block-based) setup.

- Command: `npm run block-based`
- Options:
	- `--dry-run` Print a summary of intended changes without writing any files.
	- `--prune-html5` Also remove the `add_theme_support( 'html5', ... )` block if present.
	- `--drop-title-tag` Also remove the `action_title_tag_support()` method and its `init` hook.

What it removes by default:
- initialize() hooks for: `action_add_pingback_header`, `filter_body_classes_add_hfeed`, `filter_embed_dimensions`, `filter_script_loader_tag`.
- Entire method definitions for: `action_add_pingback_header()`, `filter_body_classes_add_hfeed()`, `filter_embed_dimensions()`, `filter_script_loader_tag()`.
- `add_theme_support( 'automatic-feed-links' )` and `add_theme_support( 'customize-selective-refresh-widgets' )` inside `action_essential_theme_support()`.
- Optional with flags: the HTML5 support block and title-tag support as described above.

Notes:
- Only the Base_Support file is modified: `inc/Base_Support/Component.php`.
- The script is idempotent: running it multiple times after the first change will result in "unchanged".
- When writing changes, a one-time backup is created at `inc/Base_Support/Component.php.bak`.
- Example:
	- `npm run block-based`
	- `npm run block-based -- --dry-run`
	- `npm run block-based -- --prune-html5 --drop-title-tag`


#### WP CLI Commands

For [WP CLI](https://make.wordpress.org/cli/handbook/) commands documentation, visit the [WP Rig WP CLI Commands](https://github.com/wprig/wprig/tree/master/wp-cli)

For more information about commands and useful workflows like scripts and other sub-systems, please visit
the [WP Rig website](https://wprig.io/doc_cat/workflow/).

### Browser Support

As WP Rig processes CSS and JavaScript, it will support the browsers listed in `.browserslistrc`. Note that WP Rig will
**not** add polyfills for missing browser support. WP Rig **will** add CSS prefixes and transpile JavaScript.

## Advanced Features

WP Rig gives the developer an out of the box environment with support for modern technologies, including ES6 and extremely modern CSS, without making any configurations.
Just write code, and WP Rig handles the heavy lifting for you.

Configuring the behavior of WP Rig is done by editing `./config/config.json`. Here the developer can set the theme name
and theme author name (for translation files) and local server settings for BrowserSync. Additionally, compression of
JavaScript and CSS files can be turned off for debugging purposes.

Place your custom theme settings in `./config/config.json` to override default settings, located
in `./config/config.default.json`. Place local-only/untracked theme settings in `./config/config.local.json`. For
example, if you want to set local information for BrowserSync.

WP Rig ships with advanced features, including:
- Easily add custom Customizer settings using .json file
- Progressive loading of CSS
- Modern CSS features and layouts
- Component scaffolding system to easily create new theme components

### Component Scaffolding

WP Rig includes a component scaffolding system that makes it easy to create new PHP components under the `inc/` directory. This allows developers to quickly add new functionality to their theme following WP Rig's component architecture.

#### Usage

```bash
npm run create-rig-component "Component Name" [options]
```

#### Options

- `--templating`: Add Templating_Component_Interface and template_tags() method
- `--tests`: Create minimal PHPUnit test skeleton

#### Example

```bash
npm run create-rig-component "Related Posts" --templating --tests
```

This command will:
1. Create a new component at `inc/Related_Posts/Component.php`
2. Implement both Component_Interface and Templating_Component_Interface
3. Add an empty template_tags() method ready to be customized
4. Create a test file at tests/phpunit/unit/inc/Related_Posts/ComponentTest.php
5. Auto-register the component in Theme.php

### Theme-scoped Blocks (Gutenberg)
WP Rig includes a built-in system for creating and managing theme-scoped Gutenberg blocks, powered by `@wordpress/create-block` under the hood and fully integrated with the theme’s build and dev workflows (Node and Bun).

Key features:
- Scaffold blocks inside the theme (never as a plugin) using `assets/blocks/<slug>/`.
- Auto-registration: the theme automatically discovers and registers blocks on init.
- Build integration: JS and CSS for blocks are built and watched by existing commands.
- Supports both npm and bun for all commands.

Quick start
- Create a block (static):
	- npm: `npm run block:new -- hero --title="Hero"` (namespace defaults to your theme slug)
	- bun: `bun run block:new hero --title="Hero"`
- Create a dynamic block (server-rendered with render.php):
	- npm (simplest): `npm run block:new:dynamic testimonial` (title auto-generated from slug)
	- npm (explicit flags): `npm run block:new -- testimonial -d --title="Testimonial"`
	- bun: `bun run block:new testimonial -d --title="Testimonial"`
- List blocks: `npm run block:list` or `bun run block:list`
- Remove a block (prompts to confirm): `npm run block:remove wprig/hero`
- Promote to a plugin (exports minimal plugin skeleton): `npm run block:promote-plugin wprig/hero`

Command reference
- `block:new <namespace>/<slug>` or `<slug>`
	- If no namespace is provided, it defaults to your theme slug from config (e.g., `wprig`).
	- Options:
		- `--title <string>`: Human title for the block
		- `-d, --dynamic`: Generate a dynamic block with `render.php` and set `block.json.render` to `file:./render.php`
		- `--ts`: Use TypeScript template (`.tsx`)
		- `--category <string>`: Defaults to `widgets`
		- `--icon <dashicon|svg>`
		- `--description <string>`
		- `--keywords "word1,word2"`
		- `--no-style`: Do not create `style.css` or wire `file:./build/style.css`
		- `--no-editor-style`: Do not create `editor.css` or wire `file:./build/editor.css`
		- `--view`: Also generate an optional frontend-only script (`build/view.js`) and set `block.json.script`
	- npm note: when passing flags via `npm run`, include a `--` before script args (e.g., `npm run block:new -- hero -d`).
- `block:list` – prints discovered theme-scoped blocks.
- `block:remove <namespace>/<slug>` – safe delete with confirmation prompt.
- `block:promote-plugin <namespace>/<slug>` – exports the block to `optional/promoted-blocks/<slug>-block` with a minimal plugin wrapper.

Filesystem layout
Each block lives under `assets/blocks/<slug>/`:
- `block.json`
- `src/index.(js|ts|tsx)` – entry point (editorScript)
- `src/edit.(js|ts|tsx)` – edit component
- `style.css` – frontend styles (optional)
- `editor.css` – editor-only styles (optional)
- `render.php` – only for dynamic blocks
- `build/` – compiled assets output

block.json conventions
WP Rig rewrites block.json so assets reference built files via `file:` protocol:
- `editorScript: "file:./build/index.js"`
- Optional `script: "file:./build/view.js"` when `--view` is used
- `style: "file:./build/style.css"` (included by default; disable with `--no-style`)
- `editorStyle: "file:./build/editor.css"` (included by default; disable with `--no-editor-style`)
- For dynamic blocks (`--dynamic`), `render: "file:./render.php"` is added
- `textdomain` is set to the theme’s slug (from config)

Auto-registration in PHP
- The theme component at `inc/Blocks/Component.php` scans `assets/blocks/*/block.json` on `init`.
- If `render.php` exists, it is automatically included before `register_block_type($dir)`.
- No manual PHP changes are required after scaffolding a new block.


For more information about the advanced features in WP Rig and how to use them, visit
the [Advanced Features Wiki page](https://github.com/wprig/wprig/wiki/Advanced-Features-(and-how-to-use-them)).

## License

WP Rig is released
under [GNU General Public License v3.0 (or later)](https://github.com/wprig/wprig/blob/master/LICENSE).
