<img align="right" width="90" height="90"
     src="https://avatars1.githubusercontent.com/u/38340689"
     title="WP Rig logo by Morten Rand-Hendriksen">
# WP Rig: WordPress Theme Boilerplate
[![Build Status](https://travis-ci.com/wprig/wprig.svg?branch=master)](https://travis-ci.com/wprig/wprig)
[![License: GPL](https://img.shields.io/aur/license/yaourt.svg)](https://www.gnu.org/licenses/gpl-3.0.en.html)
![WP Rig version 2.0.0](https://img.shields.io/badge/version-2.0.0-blue.svg)

## Your Performance-Focused Development Rig
A progressive theme development rig for WordPress, WP Rig is built to promote the latest best practices for progressive web content and optimization. Building a theme from WP Rig means adopting this approach and the core principles it is built on:
- Accessibility
- [Lazy-loading of images ](https://developers.google.com/web/fundamentals/performance/lazy-loading-guidance/images-and-video/)
- Mobile-first
- Progressive enhancement
- [Resilient Web Design](https://resilientwebdesign.com/)
- Progressive Web App enabled
- AMP-ready

## Installation
WP Rig has been tested on Linux, Mac, and Windows.

### Requirements
WP Rig requires the following dependencies. Full installation instructions are provided at their respective websites.

- [PHP](http://php.net/) 7.0
- [npm](https://www.npmjs.com/)
- [Composer](https://getcomposer.org/) (installed globally)

### How to install WP Rig:
1. Clone or download this repository to the themes folder of a WordPress site on your development environment.
    - DO NOT change the name of the theme directory from the default `wprig`.
2. Configure theme settings, including the theme slug and name, in `./config/themeConfig.js`.
3. In command line, run `npm install` to install necessary node and Composer dependencies.
4. In command line, run `npm run dev` to process source files, build the development theme, and watch files for subsequent changes.
	- `npm run build` can be used to process the source files and build the development theme without watching files afterwards.
5. In WordPress admin, activate the WP Rig development theme.

## How to build WP Rig for production:
1. Follow the steps above to install WP Rig.
2. Run `npm run bundle` from inside the `wp-rig` development theme.
3. A new, production ready theme will be generated in `wp-content/themes`.
4. The production theme can be activated or uploaded to a production environment.

### Wiki: Recommended code editor extensions
To take full advantage of the features in WP Rig, visit the [Recommended code editor extensions Wiki page](https://github.com/wprig/wprig/wiki/Recommended-code-editor-extensions).

## Working with WP Rig
WP Rig can be used in any development environment. It does not require any specific platform or server setup. It also does not have an opinion about what local or virtual server solution the developer uses.

Before first run, visit the [BrowserSync wiki page](https://github.com/wprig/wprig/wiki/BrowserSync).

### Available Processes

#### `dev watch` process
`npm run dev` will run the default development task that processes source files. While this process is running, source files will be watched for changes and the BrowserSync server will run. This process is optimized for speed so you can iterate quickly.

#### `dev build` process
`npm run build` processes source files one-time. It does not watch for changes nor start the BrowserSync server.

#### `translate` process
`npm run translate` generates a `.pot` file for the theme to enable translation. The translation file will be stored in `./languages/`.

#### `production bundle` process
`npm run bundle` generates a production ready theme as a new theme directory and, optionally, a `.zip` archive. This builds all source files, optimizes the built files for production, does a string replacement and runs translations. Non-essential files from the `wp-rig` development theme are not copied to the production theme.
To bundle the theme without creating a zip archive, change the `export:compress` setting in `./config/themeConfig.js`:

```javascript
export: {
	compress: false
}
```

### Gulp process
WP Rig uses a [Gulp 4](https://gulpjs.com/) build process to generate and optimize the code for the theme. All development is done in the `wp-rig` development theme. Feel free to edit any `.php` files. Asset files (CSS, JavaScript and images) are processed by gulp. You should only edit the source asset files in the following locations:
- CSS: `assets/css/src`
- JavaScript: `assets/js/src`
- images: `assets/images/src`

For more information about the Gulp processes, what processes are available, and how to run them individually, visit the [Gulp Wiki page](https://github.com/wprig/wprig/wiki/Gulp).

## Advanced Features
WP Rig gives the developer an out of the box environment with support for modern technologies including ES2015, CSS grid, CSS custom properties (variables), and existing tools like Sass without making any configurations. Just write code and WP Rig handles the heavy lifting for you.

Configuring the behavior of WP Rig is done by editing `./config/themeConfig.js`. Here the developer can set the theme name and theme author name (for translation files), the browser list for AutoPrefixer, and local server settings for BrowserSync. Additionally, compression of JavaScript and CSS files can be turned off for debugging purposes.

WP Rig ships with advanced features including:
- Lazy-loading images
- Built-in support for the [official AMP plugin](https://wordpress.org/plugins/amp/)
- Progressive loading of CSS
- Modern CSS, custom properties (variables), autoprefixing, etc
- Modern layouts through CSS grid, flex, and float

For more information about the advanced features in WP Rig and how to use them, visit the [Advanced Features Wiki page](https://github.com/wprig/wprig/wiki/Advanced-Features-(and-how-to-use-them)).

## License
WP Rig is released under [GNU General Public License v3.0](https://github.com/wprig/wprig/blob/master/LICENSE).

# Changelog

## 2.0.0
- Full refactor of dev file structure. See [#133](https://github.com/wprig/wprig/pull/133). Props @ataylorme.
- Full refactor of Gulp process. See [#47](https://github.com/wprig/wprig/pull/47). Props @ataylorme.
- Full refactor of PHP codebase, leveraging PHP7 features. See [#185](https://github.com/wprig/wprig/pull/185). Props @felixarntz.
- Add support for SSL certificates. See [#92](https://github.com/wprig/wprig/pull/92). Props @ataylorme.
- Fix theme slug replacement process and use `wp-rig` instead of `wprig` throughout the codebase. See [#93](https://github.com/wprig/wprig/pull/93). Props @felixarntz.
- Watch for theme config changes and rebuild more efficiently. See [#123](https://github.com/wprig/wprig/pull/123). Props @ataylorme.
- Respect PHP 7.0 and WordPress 4.5 version requirements, use `functions.php` as plain 5.2-compatible entry file. See [#59](https://github.com/wprig/wprig/pull/59). Props @ataylorme, @felixarntz.
- Add unit and integration tests infrastructure. See [#114](https://github.com/wprig/wprig/pull/114). Props @felixarntz.
- Use `filemtime()` only in development for asset versions. See [#164](https://github.com/wprig/wprig/pull/164). Props @benoitchantre.
- Retrieve the theme version dynamically for asset versions in production. See [#176](https://github.com/wprig/wprig/pull/176), [#190](https://github.com/wprig/wprig/pull/190), [#200](https://github.com/wprig/wprig/pull/200). Props @benoitchantre.
- Allow disabling PHPCS in development workflow. See [#170](https://github.com/wprig/wprig/pull/170). Props @ataylorme.
- Add `500.php` and `offline.php` templates for PWA support. See [#212](https://github.com/wprig/wprig/pull/212). Props @felixarntz.
- Print the static `skip-link-focus-fix` script for IE11 inline instead of requiring an extra request. See [#139](https://github.com/wprig/wprig/pull/139). Props @westonruter.
- Add gif extension to processed image paths. See [#117](https://github.com/wprig/wprig/pull/117). Props @ataylorme.
- Add `stylelint`. See [#56](https://github.com/wprig/wprig/pull/56). Props @ataylorme.
- Fix numerous CSS bugs and Gutenberg compatibility issues. See [#127](https://github.com/wprig/wprig/pull/127), [#179](https://github.com/wprig/wprig/pull/179), [#188](https://github.com/wprig/wprig/pull/188), [#193](https://github.com/wprig/wprig/pull/193), [#196](https://github.com/wprig/wprig/pull/196), [#197](https://github.com/wprig/wprig/pull/197), [#202](https://github.com/wprig/wprig/pull/202), [#206](https://github.com/wprig/wprig/pull/206). Props @benoitchantre, @mor10, @jdelia.

## 1.0.5
- Do not initialize menus until DOM is loaded. See [#140](https://github.com/wprig/wprig/pull/140). Props @bamadesigner.
- Fix PHPCodeSniffer issues and violations. Props @mor10, @felixarntz.
- Fix incorrect grammar in comment. See [#151](https://github.com/wprig/wprig/pull/151). Props @ecotechie.

## 1.0.4
- Update CSS (front and editor styles) to meet current Gutenberg recommendations as of October 1, 2018. Props mor10.
- Enable default block styles by default in functions.php. Props mor10.
- Add readme.txt file as per [Theme Handbook](https://developer.wordpress.org/themes/release/writing-documentation/). Props mor10.

## 1.0.3
- Add Gutenberg editor-font-sizes. Props @atanas-angelov-dev
- Improve conditional logic in wprig_add_body_style(). Props @iliman
- Update WordPress Coding Standards to 1.0.0. Props @mor10

## 1.0.2
- Updated theme support for Gutenberg color palette with a single array attribute. Props @webmandesign
- `./verbose/` folder no longer holds PHP files. Resolves duplicate functionality as described in [#51](https://github.com/wprig/wprig/issues/51).
- Update Composer dependencies to latest versions (and to remove update nag).
- Use slug for naming language file and ZIP bundle. Props @felixarntz.
- Fixed bug with is_amp_endpoint() being called too soon. Props @iliman.

## 1.0.1
- PHP process updated to run conditionally on theme name and theme slug rename and on first run. Props @hellofromtonya.
- Introduce guard clause to simplify wprig_is_amp() condition around wprig_scripts(). Props @Tabrisrp.
- Remove extraneous variable $post_count from index.php. Props @Soean.

## Initial release
- cssnext replaced with postcss-preset-env. No change in functionality. Props @mor10
- Separate theme name and theme slug in `themeConfig.js`. Props @felixarntz.
