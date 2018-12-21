=== WP Rig ===
Contributors: mor10, bamadesigner, ataylorme, felixarntz, et.al
Tags:
Requires at least: 4.8
Tested up to: 4.9.8
Requires PHP: 7.0
Stable tag: 1.0.4
License: GPLv3 or later
License URI: http://www.gnu.org/licenses/gpl-3.0.html

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
2. Configure theme settings including the theme slug and name in `./dev/config/themeConfig.js`.
3. In command line, run `npm install` to install necessary node and Composer dependencies.
4. In command line, run `npm run build` to generate the theme.
5. In WordPress admin, activate the theme.

=== Recommended code editor extensions ===
To take full advantage of the features in WP Rig, your code editor needs support for the following features:

* [EditorConfig](http://editorconfig.org/#download)
* [ESLint](https://eslint.org/docs/user-guide/integrations)
* [PHP CodeSniffer (phpCS)](https://github.com/WordPress-Coding-Standards/WordPress-Coding-Standards/wiki)

== Working with WP Rig ==
WP Rig can be used in any development environment. It does not require any specific platform or server setup. It also does not have an opinion about what local or virtual server solution the developer uses.

WP Rig uses [BrowserSync](https://browsersync.io/) to enable synchronized browser testing. To take advantage of this feature, configure the `proxy` wrapper settings in `./dev/config/themeConfig.js` to match your local development environment. The `URL` value is the URL to the live version of your local site.

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
To bundle the theme without creating a zip archive, change the `export:compress` setting in `./dev/config/themeConfig.js`:

```javascript
export: {
	compress: false
}
```

== Advanced Features ==
WP Rig gives the developer an out of the box environment with support for modern technologies including ES2015, CSS grid, CSS custom properties (variables), and existing tools like Sass without making any configurations. Just write code and WP Rig handles the heavy lifting for you.
Configuring the behavior of WP Rig is done by editing `./dev/config/themeConfig.js`. Here the developer can set the theme name and theme author name (for translation files), the browser list for AutoPrefixer, and local server settings for BrowserSync. Additionally, compression of JavaScript and CSS files can be turned off for debugging purposes.

=== Lazy-loading images ===
WP Rig [lazy loads](https://developers.google.com/web/fundamentals/performance/lazy-loading-guidance/images-and-video/) all images out of the box to improve performance. When lazy-loading images is enabled in the theme, the user will see a Theme Options feature in Customizer allowing them to toggle the feature off.
To disable this feature in the theme, comment out or remove the following line from `./dev/functions.php`:

```php
require get_template_directory() . '/pluggable/lazyload/lazyload.php';
```

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
postcss-preset-env (previously cssnext) passes all CSS through Autoprefixer to ensure backward compatibility. [Target browsers](https://github.com/browserslist/browserslist) are configured under `browserlist` in `./dev/config/cssVariables`.

=== Modern layouts through CSS grid, flex, and float ===
The theme generated by WP Rig is mobile-first and accessible. It uses the modern layout modules CSS grid and flex to support a minimalist HTML structure.

For backward compatibility with browsers who do not support modern layout modules, WP Rig provides the mobile-first layout across all screen widths and serves two-dimensional layouts as a progressive enhancement.

The CSS philosophy of WP Rig breaks down as follows:
- Mobile layout for all screen sizes as fallback.
- Two-dimensional layouts using CSS grid.
- One dimensional block/list-based displays using flex.
- In-content wrapping using float and clear.

== License ==
WP Rig is released under [GNU General Public License v3.0](https://github.com/wprig/wprig/blob/master/LICENSE).

= Changelog =
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
