=== WP Rig ===
Contributors: mor10, bamadesigner, ataylorme, felixarntz, et.al
Tags:
Requires at least: 4.8
Tested up to: 4.9.8
Requires PHP: 7.0
Stable tag: 2.0.1
License: GNU General Public License v3.0 (or later)
License URI: https://www.gnu.org/licenses/gpl-3.0.html

A progressive theme development rig for WordPress, WP Rig is built to promote the latest best practices for progressive web content and optimization.

== Description ==
Building a theme from WP Rig means adopting this approach and the core principles it is built on:
* Accessibility
* [Lazy-loading of images ](https://developers.google.com/web/fundamentals/performance/lazy-loading-guidance/images-and-video/)
* Mobile-first
* Progressive enhancement
* [Resilient Web Design](https://resilientwebdesign.com/)
* Progressive Web App enabled
* AMP-ready

== Installation ==
WP Rig has been tested on Linux, Mac, and Windows.

=== Requirements ===
WP Rig requires the following dependencies. Full installation instructions are provided at their respective websites.

* [PHP](http://php.net/) 7.0
* [npm](https://www.npmjs.com/)
* [Composer](https://getcomposer.org/) (installed globally)

=== How to install WP Rig: ===
1. Clone or download this repository to the themes folder of a WordPress site on your development environment.
2. Configure theme settings, including the theme slug and name.
  * View `./config/config.default.json` for the default settings.
  * Place custom theme settings in `./config/config.json` to override default settings.
    * You do not have to include all settings from config.default.json. Just the settings you want to override.
  * Place local-only theme settings in `./config/config.local.json`, e.g. potentially sensitive info like the path to your BrowserSync certificate.
    * Again, only include the settings you want to override.
3. In command line, run `npm install` to install necessary node and Composer dependencies.
4. In command line, run `npm run build` to generate the theme.
5. In WordPress admin, activate the theme.

==== Defining custom settings for the project ====

Here is an example of creating a custom theme config file for the project. In this example, we want a custom slug, name, and author.

Place the following in your `./config/config.json` file. This config will be versioned in your repo so all developers use the same settings.

```{
  "theme": {
    "slug": "newthemeslug",
    "name": "New Theme Name",
    "author": "Name of the theme author"
  }
}```

==== Defining custom settings for your local environment ====

Some theme settings should only be set for your local environment. For example, if you want to set local information for BrowserSync.

Place the following in your `./config/config.local.json` file. This config will not be tracked in your repo and will only be executed in your local development environment.

```{
  "browserSync": {
    "live": true,
    "proxyURL": "localwprigenv.test",
    "https": true,
    "keyPath": "/path/to/my/browsersync/key",
    "certPath": "/path/to/my/browsersync/certificate"
  }
}```

=== Recommended code editor extensions ===
To take full advantage of the features in WP Rig, your code editor needs support for the following features:

* [EditorConfig](http://editorconfig.org/#download)
* [ESLint](https://eslint.org/docs/user-guide/integrations)
* [PHP CodeSniffer (phpCS)](https://github.com/WordPress-Coding-Standards/WordPress-Coding-Standards/wiki)

== Working with WP Rig ==
WP Rig can be used in any development environment. It does not require any specific platform or server setup. It also does not have an opinion about what local or virtual server solution the developer uses.

=== BrowserSync ===
WP Rig uses [BrowserSync](https://browsersync.io/) to enable synchronized browser testing.

Before first run, visit the [BrowserSync wiki page](https://github.com/wprig/wprig/wiki/BrowserSync).

=== Enabling HTTPS ===
In order to enable HTTPS with BrowserSync, you must supply a valid certificate and key with the Subject Alternative Name of `localhost`. If needed, WP Rig can generate a key and certificate valid for `localhost` for you with the command `npm run generateCert`.

For more information, and instructions, visit the [BrowserSync wiki page](https://github.com/wprig/wprig/wiki/BrowserSync).

=== Gulp ===
WP Rig uses a [Gulp 4](https://gulpjs.com/) build process to generate and optimize the code for the theme. All development is done in the `/dev` folder and Gulp preprocesses, transpiles, and compiles the files into the root folder. The root folder files become the active theme. WordPress ignores anything in the `/dev` folder.

**Note:** If you have previously used Gulp, you may encounter seemingly random errors that prevent the build process from running. To fix this issue, [upgrade to Gulp 4 following the steps outlined in the WP Rig Wiki](https://github.com/wprig/wprig/wiki/Updating-to-Gulp-4).

JavaScript files are automatically linted using [ESLint](https://eslint.org/) in accordance with [WordPress Coding Standards](https://make.wordpress.org/core/handbook/best-practices/coding-standards/).

PHP and CSS files are automatically linted using [PHP CodeSniffer](https://github.com/squizlabs/PHP_CodeSniffer) in accordance with [WordPress Coding Standards](https://make.wordpress.org/core/handbook/best-practices/coding-standards/). To take full advantage of this setup, configure your code editor / IDE to automatically test for the WordPress Coding Standards.

Details on how to enable PHPCS in VS Code can be found in the [WP Rig Wiki](https://github.com/wprig/wprig/wiki/Enabling-PHPCodeSniffer-(PHPCS)-in-VS-Code). More details on how to work with PHPCS and WordPress Coding Standards can be found at the [WordPress Coding Standards Wiki](https://github.com/WordPress-Coding-Standards/WordPress-Coding-Standards/wiki). `composer run-phpcs` runs PHPCS locally.

=== `build` process ===
`npm run build` is the regular development process. While this process is running, files in the `./dev/` folder will be automatically compiled to the live theme and BrowserSync will update if it is enabled.

=== `translate` process ===
`npm run translate` generates a `.pot` file for the theme to enable translation. The translation file will be stored in `./languages/`.

=== `bundle` process ===
`npm run bundle` generates a `[themename].zip` archive containing the finished theme. This runs all relevant tasks in series ending with the translation task and the bundle task and stores a new zip archive in the root theme folder.

To bundle the theme without creating a zip archive, define the `export:compress` setting in `./config/config.json` to `false`:

```javascript
export: {
	compress: false
}
```

== Advanced Features ==
WP Rig gives the developer an out of the box environment with support for modern technologies including ES2015, CSS grid, CSS custom properties (variables), CSS nesting and more, without making any configurations. Just write code and WP Rig handles the heavy lifting for you.

Configuring the behavior of WP Rig is done by editing `./config/config.json`. Here the developer can set the theme name and theme author name (for translation files), and local server settings for BrowserSync. Additionally, compression of JavaScript and CSS files can be turned off for debugging purposes.

Place your custom theme settings in `./config/config.json` to override default settings, located in `./config/config.default.json`. Place local-only/untracked theme settings in `./config/config.local.json`. For example, if you want to set local information for BrowserSync.

=== Lazy-loading images ===
WP Rig [lazy loads](https://developers.google.com/web/fundamentals/performance/lazy-loading-guidance/images-and-video/) all images out of the box to improve performance. When lazy-loading images is enabled in the theme, the user will see a Theme Options feature in Customizer allowing them to toggle the feature off.

=== AMP-ready ===
The theme generated by WP Rig is AMP-ready meaning it works hand-in-hand with the official AMP plugin and does not require further configuration to work with AMP features. The AMP plugin allows you to [opt-in to `amp` theme support via the plugin settings page](https://github.com/Automattic/amp-wp/wiki/Adding-Theme-Support) but you can also force enable AMP support in a theme by adding `add_theme_support( 'amp' );` in `./dev/functions.php`.

==== AMP and custom JavaScript ====
When AMP support is enabled, JavaScript and other features are automatically disabled if the site admin has enabled the [official AMP plugin](https://en-ca.wordpress.org/plugins/amp/). Developers can selectively enable/disable features within the theme using the `wprig_is_amp()` conditional. For more see [Implementing Interactivity](https://github.com/Automattic/amp-wp/wiki/Implementing-Interactivity).

== WP Rig features ==
WP Rig takes a component-based approach to WordPress themes. Out of the box, the compiled theme uses `index.php` as the core template file for all views (index, archives, single posts, pages, etc). The `/optional` folder holds optional template files that can be accessed via the [WordPress Template Hierarchy](https://developer.wordpress.org/themes/basics/template-hierarchy/). To activate these files, move or copy them into the root `/dev` folder. The `/optional` folder is ignored by the Gulp build process.

The separation of Pluggable and External features into their own folders allows the theme developer to swap out any feature for an external feature (AMP components) or non-php feature (JavaScript framework etc) without interfering with the core theme functions.

Pluggable functions and features (eg custom header, sliders, other interactive components) are separated into the `/pluggable` folder for easy access. When custom stylesheets and/or JavaScript files are needed, the pluggable component and its dependent files should be placed in a sub-folder to retain separation of concerns.

External features and add-ons are separated into the `/external` folder and are managed the same way as Pluggable functions.

Images and graphics are placed in the `/images` folder and are optimized automatically.

Global JavaScript files are placed in the `/js` folder and linted and optimized automatically. External JavaScript libraries are placed in the `/js/libs` folder. _These files are not linted or optimized by the Gulp process_.

Global stylesheets and stylesheets related to root-level php files are placed in the `/css` folder and are optimized automatically.

Content loop files are placed in the `/template-parts` folder.

`style.css` is loaded in `<head>` through a `wp_enqueue_style()` call in `functions.php`. It is the main stylesheet and serves up global styles and layouts only.

== Progressive Features ==

=== Progressive loading of CSS ===
To further componentize the theme, WP Rig employs progressive loading of CSS through [in-body `<link>` tags](https://jakearchibald.com/2016/link-in-body/). Component-specific styles are held in component-specific stylesheets and loaded at component level. The `wprig_add_body_style()` in `./dev/inc/template-functions.php` can be used to conditionally preload in-body stylesheets for improved performance.
This approach has several advantages:
* The main stylesheet file size is reduced
* Styles are only loaded if and when a component is present in the view.
* Stylesheets are associated with their components making them easier to work with.
* Leverages HTTP/2 multiplexing and can be extended to include server push etc.
* Component-level stylesheets are cached and can be individually updated without forcing reload of all styles on the site.

To improve the performance of the theme, progressively loaded stylesheets can be conditionally preloaded. This is done using the `wprig_add_body_style()` function in `./dev/inc/template-functions.php`. When preloading a stylesheet, use the console in Chrome developer tools to ensure no unnecessary stylesheets are loaded. A warning will appear letting you know if a stylesheet is preloaded but not used.

=== Modern CSS, custom properties (variables), autoprefixing, etc ===
All CSS is processed through [PostCSS](http://postcss.org/) and leveraging [postcss-preset-env](https://preset-env.cssdb.org/) to allow the use of modern and future CSS markup like [custom properties (variables)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_variables). Variables are defined in `./dev/config/cssVariables` and applied to all CSS files as they are processed.
postcss-preset-env (previously cssnext) passes all CSS through Autoprefixer to ensure backward compatibility. [Target browsers](https://github.com/browserslist/browserslist) are defined in `.browserslistrc`.

=== Modern layouts through CSS grid, flex, and float ===
The theme generated by WP Rig is mobile-first and accessible. It uses the modern layout modules CSS grid and flex to support a minimalist HTML structure.

For backward compatibility with browsers who do not support modern layout modules, WP Rig provides the mobile-first layout across all screen widths and serves two-dimensional layouts as a progressive enhancement.

The CSS philosophy of WP Rig breaks down as follows:
- Mobile layout for all screen sizes as fallback.
- Two-dimensional layouts using CSS grid.
- One dimensional block/list-based displays using flex.
- In-content wrapping using float and clear.

== License ==
WP Rig is released under [GNU General Public License v3.0 (or later)](https://github.com/wprig/wprig/blob/master/LICENSE).

= Changelog =

== 2.0.0 ===
- Full refactor of dev file structure. See [#133](https://github.com/wprig/wprig/pull/133). Props @ataylorme.
- Full refactor of Gulp process. See [#47](https://github.com/wprig/wprig/pull/47). Props @ataylorme.
- Full refactor of PHP codebase, leveraging PHP7 features. See [#185](https://github.com/wprig/wprig/pull/185). Props @felixarntz.
- Tweak template parts for more granular adjustments and overriding in child themes. See [#244](https://github.com/wprig/wprig/pull/244). Props @felixarntz.
- Add support for SSL certificates. See [#92](https://github.com/wprig/wprig/pull/92). Props @ataylorme.
- Fix theme slug replacement process and use `wp-rig` instead of `wprig` throughout the codebase. See [#93](https://github.com/wprig/wprig/pull/93). Props @felixarntz.
- Watch for theme config changes and rebuild more efficiently. See [#123](https://github.com/wprig/wprig/pull/123). Props @ataylorme.
- Respect PHP 7.0 and WordPress 4.5 version requirements, use `functions.php` as plain 5.2-compatible entry file. See [#59](https://github.com/wprig/wprig/pull/59). Props @ataylorme, @felixarntz.
- Add unit and integration tests infrastructure. See [#114](https://github.com/wprig/wprig/pull/114). Props @felixarntz.
- Add theme support for responsive embeds. See [#219](https://github.com/wprig/wprig/pull/219). Props @benoitchantre.
- Add the privacy policy link. See [#213](https://github.com/wprig/wprig/pull/213). Props @benoitchantre.
- Use `filemtime()` only in development for asset versions. See [#164](https://github.com/wprig/wprig/pull/164). Props @benoitchantre.
- Retrieve the theme version dynamically for asset versions in production. See [#176](https://github.com/wprig/wprig/pull/176), [#190](https://github.com/wprig/wprig/pull/190), [#200](https://github.com/wprig/wprig/pull/200). Props @benoitchantre.
- Allow disabling PHPCS in development workflow. See [#170](https://github.com/wprig/wprig/pull/170). Props @ataylorme.
- Add `500.php` and `offline.php` templates for PWA support. See [#212](https://github.com/wprig/wprig/pull/212). Props @felixarntz.
- Print the static `skip-link-focus-fix` script for IE11 inline instead of requiring an extra request. See [#139](https://github.com/wprig/wprig/pull/139). Props @westonruter.
- Add gif extension to processed image paths. See [#117](https://github.com/wprig/wprig/pull/117). Props @ataylorme.
- Add `stylelint`. See [#56](https://github.com/wprig/wprig/pull/56). Props @ataylorme.
- Update PHPCompatibility to version 9 and remove deprecated coding standards annotations. See [#249](https://github.com/wprig/wprig/pull/249). Props @felixarntz.
- Fix numerous CSS bugs and Gutenberg compatibility issues. See [#127](https://github.com/wprig/wprig/pull/127), [#173](https://github.com/wprig/wprig/pull/173), [#179](https://github.com/wprig/wprig/pull/179), [#188](https://github.com/wprig/wprig/pull/188), [#193](https://github.com/wprig/wprig/pull/193), [#196](https://github.com/wprig/wprig/pull/196), [#197](https://github.com/wprig/wprig/pull/197), [#202](https://github.com/wprig/wprig/pull/202), [#206](https://github.com/wprig/wprig/pull/206), [#299](https://github.com/wprig/wprig/pull/299). Props @benoitchantre, @mor10, @jdelia.
- Add abstracted theme config file. See [#233](https://github.com/wprig/wprig/pull/233). Props @Shelob9.
- Add theme screenshot file. See [#263](https://github.com/wprig/wprig/pull/263). Props @bamadesigner.
- Ensure `content.css` stylesheet always loads when needed. See [#141](https://github.com/wprig/wprig/pull/141). Props @bamadesigner.
- Replace `require-uncached` with `import-fresh`. [`require-uncached`](https://www.npmjs.com/package/require-uncached) has been deprecated in favor of [`import-fresh`](https://www.npmjs.com/package/import-fresh). See [#296](https://github.com/wprig/wprig/pull/296). Props @ataylorme.
- Upgrade WordPress coding standards to 2.0. See [#288](https://github.com/wprig/wprig/pull/295). Props @ataylorme, @benoitchantre.
- Use pure CSS files for CSS custom properties and media queries
`/assets/css/src/custom-properties.css` for custom properties.
`/assets/css/src/custom-media.css` for custom media queries.
See [#281](https://github.com/wprig/wprig/pull/281). Props @mor10.
- Use `.browserslistrc` for browser support definitions. See [#227](https://github.com/wprig/wprig/pull/227). Props @ataylorme.
- Allow adjusting the mechanism for how stylesheets are loaded, for better compatibility with contexts like AMP or Customizer. See [#319](https://github.com/wprig/wprig/pull/319). Props @felixarntz.

== 1.0.5 ==
- Do not initialize menus until DOM is loaded. See [#140](https://github.com/wprig/wprig/pull/140). Props @bamadesigner.
- Fix PHPCodeSniffer issues and violations. Props @mor10, @felixarntz.
- Fix incorrect grammar in comment. See [#151](https://github.com/wprig/wprig/pull/151). Props @ecotechie.

== 1.0.4 ==
- Update CSS (front and editor styles) to meet current Gutenberg recommendations as of October 1, 2018. Props mor10.
- Enable default block styles by default in functions.php. Props mor10.
- Add readme.txt file as per [Theme Handbook](https://developer.wordpress.org/themes/release/writing-documentation/). Props mor10.

== 1.0.3 ==
- Add Gutenberg editor-font-sizes. Props @atanas-angelov-dev
- Improve conditional logic in wprig_add_body_style(). Props @iliman
- Update WordPress Coding Standards to 1.0.0. Props @mor10

== 1.0.2 ==
- Updated theme support for Gutenberg color palette with a single array attribute. Props @webmandesign
- `./verbose/` folder no longer holds PHP files. Resolves duplicate functionality as described in [#51](https://github.com/wprig/wprig/issues/51).
- Update Composer dependencies to latest versions (and to remove update nag).
- Use slug for naming language file and ZIP bundle. Props @felixarntz.
- Fixed bug with is_amp_endpoint() being called too soon. Props @iliman.

== 1.0.1 ==
- PHP process updated to run conditionally on theme name and theme slug rename and on first run. Props @hellofromtonya.
- Introduce guard clause to simplify wprig_is_amp() condition around wprig_scripts(). Props @Tabrisrp.
- Remove extraneous variable $post_count from index.php. Props @Soean.

== Initial release ==
- cssnext replaced with postcss-preset-env. No change in functionality. Props @mor10
- Separate theme name and theme slug in `themeConfig.js`. Props @felixarntz.
