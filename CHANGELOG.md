# Changelog

## 2.2.1

-   Extended config file to add the ability to modify author name, author url, theme description and version for production. Props @dthenley
-   Bumps [ajv](https://github.com/ajv-validator/ajv) from 6.10.2 to 6.12.3.
-   Bumps [handlebars](https://github.com/handlebars-lang/handlebars.js) from 4.7.6 to 4.7.7.
-   Change Sidebar screen reader text. see [#761](https://github.com/wprig/wprig/issues/761)
-   Update blocks css to use grid css
-   Added 'deps' to css files array Props @Spleeding1
-   Removed call for custom.min.js from the Scripts/Component.php file. Was throwing an error before.

## 2.2.0

-   Enhanced Mobile Navigation System and new default mobile nav. Props @robruiz
-   Add new Javascript component for managing JS enqueues. Props @Spleeding1

## 2.1.0

-   Add EZ_Customizer Component for easier customizer settings. See [WPRig.io](https://wprig.io/documentation/creating-custom-settings-for-your-theme-in-customize/) for details on how this works. Props @robruiz
-   Add Read More link to Recent Posts block. See [#714](https://github.com/wprig/wprig/issues/714). Props @dthenley
-   Add padding to full width block content. See [#708](https://github.com/wprig/wprig/issues/708). Props @dthenley

## 2.0.2

-   Removed native lazy loading. WordPress 5.5 now handles that for us. See [#657](https://github.com/wprig/wprig/pull/657). Props @robruiz.
-   Use long array syntax to be ready with upcoming changes in PHP Coding Standards. See [#557](https://github.com/wprig/wprig/pull/557). Props @benoitchantre.
-   Fix indentation for nested lists, reduce specificity. See [#490](https://github.com/wprig/wprig/pull/490). Props @benoitchantre.
-   Reduce hardcoded colors. See [#488](https://github.com/wprig/wprig/pull/488). Props @benoitchantre.
-   Prevent gallery block from breaking unexpectedly if the number of images is a multiple of the number of columns. See [#571](https://github.com/wprig/wprig/pull/571). Props @felixarntz.
-   Add support for vendor asset directories. See [#587](https://github.com/wprig/wprig/pull/587). Props @ataylorme, @benoitchantre.
-   Ensure that left- or right-aligned child elements of the post content do not overflow the maximum content width. See [#568](https://github.com/wprig/wprig/pull/568). Props @felixarntz.
-   Fix sub menus may be displayed under other elements. See [#523](https://github.com/wprig/wprig/pull/523). Props @benoitchantre.
-   Fix invalid argument passed to `wp_nav_menu()`. See [#569](https://github.com/wprig/wprig/pull/569). Props @felixarntz.

## 2.0.1

-   Fix inconsistent license references in various areas. See [#575](https://github.com/wprig/wprig/pull/575). Props @felixarntz.
-   Add automated tests for the gulp task that builds the production theme. See [#579](https://github.com/wprig/wprig/pull/579). Props @ataylorme.
-   Fix Travis-CI not executing nightly build jobs. See [#540](https://github.com/wprig/wprig/pull/540). Props @felixarntz.

## 2.0.0

-   Full refactor of dev file structure. See [#133](https://github.com/wprig/wprig/pull/133). Props @ataylorme.
-   Full refactor of Gulp process. See [#47](https://github.com/wprig/wprig/pull/47). Props @ataylorme.
-   Full refactor of PHP codebase, leveraging PHP7 features. See [#185](https://github.com/wprig/wprig/pull/185). Props @felixarntz.
-   Tweak template parts for more granular adjustments and overriding in child themes. See [#244](https://github.com/wprig/wprig/pull/244). Props @felixarntz.
-   Add support for SSL certificates. See [#92](https://github.com/wprig/wprig/pull/92). Props @ataylorme.
-   Fix theme slug replacement process and use `wp-rig` instead of `wprig` throughout the codebase. See [#93](https://github.com/wprig/wprig/pull/93). Props @felixarntz.
-   Watch for theme config changes and rebuild more efficiently. See [#123](https://github.com/wprig/wprig/pull/123). Props @ataylorme.
-   Respect PHP 7.0 and WordPress 4.5 version requirements, use `functions.php` as plain 5.2-compatible entry file. See [#59](https://github.com/wprig/wprig/pull/59). Props @ataylorme, @felixarntz.
-   Add unit and integration tests infrastructure. See [#114](https://github.com/wprig/wprig/pull/114). Props @felixarntz.
-   Add theme support for responsive embeds. See [#219](https://github.com/wprig/wprig/pull/219). Props @benoitchantre.
-   Add the privacy policy link. See [#213](https://github.com/wprig/wprig/pull/213). Props @benoitchantre.
-   Use `filemtime()` only in development for asset versions. See [#164](https://github.com/wprig/wprig/pull/164). Props @benoitchantre.
-   Retrieve the theme version dynamically for asset versions in production. See [#176](https://github.com/wprig/wprig/pull/176), [#190](https://github.com/wprig/wprig/pull/190), [#200](https://github.com/wprig/wprig/pull/200). Props @benoitchantre.
-   Allow disabling PHPCS in development workflow. See [#170](https://github.com/wprig/wprig/pull/170). Props @ataylorme.
-   Add `500.php` and `offline.php` templates for PWA support. See [#212](https://github.com/wprig/wprig/pull/212). Props @felixarntz.
-   Print the static `skip-link-focus-fix` script for IE11 inline instead of requiring an extra request. See [#139](https://github.com/wprig/wprig/pull/139). Props @westonruter.
-   Add gif extension to processed image paths. See [#117](https://github.com/wprig/wprig/pull/117). Props @ataylorme.
-   Add `stylelint`. See [#56](https://github.com/wprig/wprig/pull/56). Props @ataylorme.
-   Update PHPCompatibility to version 9 and remove deprecated coding standards annotations. See [#249](https://github.com/wprig/wprig/pull/249). Props @felixarntz.
-   Fix numerous CSS bugs and Gutenberg compatibility issues. See [#127](https://github.com/wprig/wprig/pull/127), [#173](https://github.com/wprig/wprig/pull/173), [#179](https://github.com/wprig/wprig/pull/179), [#188](https://github.com/wprig/wprig/pull/188), [#193](https://github.com/wprig/wprig/pull/193), [#196](https://github.com/wprig/wprig/pull/196), [#197](https://github.com/wprig/wprig/pull/197), [#202](https://github.com/wprig/wprig/pull/202), [#206](https://github.com/wprig/wprig/pull/206), [#299](https://github.com/wprig/wprig/pull/299). Props @benoitchantre, @mor10, @jdelia.
-   Add abstracted theme config file. See [#233](https://github.com/wprig/wprig/pull/233). Props @Shelob9.
-   Add theme screenshot file. See [#263](https://github.com/wprig/wprig/pull/263). Props @bamadesigner.
-   Ensure `content.css` stylesheet always loads when needed. See [#141](https://github.com/wprig/wprig/pull/141). Props @bamadesigner.
-   Replace `require-uncached` with `import-fresh`. [`require-uncached`](https://www.npmjs.com/package/require-uncached) has been deprecated in favor of [`import-fresh`](https://www.npmjs.com/package/import-fresh). See [#296](https://github.com/wprig/wprig/pull/296). Props @ataylorme.
-   Upgrade WordPress coding standards to 2.0. See [#288](https://github.com/wprig/wprig/pull/295). Props @ataylorme, @benoitchantre.
-   Use pure CSS files for CSS custom properties and media queries
    `/assets/css/src/_custom-properties.css` for custom properties.
    `/assets/css/src/_custom-media.css` for custom media queries.
    See [#281](https://github.com/wprig/wprig/pull/281). Props @mor10.
-   Use `.browserslistrc` for browser support definitions. See [#227](https://github.com/wprig/wprig/pull/227). Props @ataylorme.
-   Allow adjusting the mechanism for how stylesheets are loaded, for better compatibility with contexts like AMP or Customizer. See [#319](https://github.com/wprig/wprig/pull/319). Props @felixarntz.
-   Add a `run-phpcbf` to Composer scripts. See [#360](https://github.com/wprig/wprig/pull/360). Props @ataylorme.
-   Replaces `install` with `rig-init` in the `scripts` section of `package.json` in order to decouple `npm install` and `composer install`. Added a new `npm run rig-init` command to run both `npm install` and `composer install` with one command. `npm install` now only installs NPM packages. See [#357](https://github.com/wprig/wprig/pull/357). Props @ataylorme.
-   Remove Sass support to fully rely on PostCSS. See [#425](https://github.com/wprig/wprig/pull/425). Props @ataylorme.
-   Add theme support for latest `service_worker` integrations. See [#506](https://github.com/wprig/wprig/pull/506). Props @felixarntz.

## 1.0.5

-   Do not initialize menus until DOM is loaded. See [#140](https://github.com/wprig/wprig/pull/140). Props @bamadesigner.
-   Fix PHPCodeSniffer issues and violations. Props @mor10, @felixarntz.
-   Fix incorrect grammar in comment. See [#151](https://github.com/wprig/wprig/pull/151). Props @ecotechie.

## 1.0.4

-   Update CSS (front and editor styles) to meet current Gutenberg recommendations as of October 1, 2018. Props mor10.
-   Enable default block styles by default in functions.php. Props mor10.
-   Add readme.txt file as per [Theme Handbook](https://developer.wordpress.org/themes/release/writing-documentation/). Props mor10.

## 1.0.3

-   Add Gutenberg editor-font-sizes. Props @atanas-angelov-dev
-   Improve conditional logic in wprig_add_body_style(). Props @iliman
-   Update WordPress Coding Standards to 1.0.0. Props @mor10

## 1.0.2

-   Updated theme support for Gutenberg color palette with a single array attribute. Props @webmandesign
-   `./verbose/` folder no longer holds PHP files. Resolves duplicate functionality as described in [#51](https://github.com/wprig/wprig/issues/51).
-   Update Composer dependencies to latest versions (and to remove update nag).
-   Use slug for naming language file and ZIP bundle. Props @felixarntz.
-   Fixed bug with is_amp_endpoint() being called too soon. Props @iliman.

## 1.0.1

-   PHP process updated to run conditionally on theme name and theme slug rename and on first run. Props @hellofromtonya.
-   Introduce guard clause to simplify wprig_is_amp() condition around wprig_scripts(). Props @Tabrisrp.
-   Remove extraneous variable \$post_count from index.php. Props @Soean.

## Initial release

-   cssnext replaced with postcss-preset-env. No change in functionality. Props @mor10
-   Separate theme name and theme slug in `themeConfig.js`. Props @felixarntz.
