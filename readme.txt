=== WP Rig ===
Contributors: mor10, bamadesigner, ataylorme, felixarntz, et.al
Tags:
Requires at least: 4.8
Tested up to: 6.9
Requires PHP: 8.1
Stable tag: 3.4.2
License: GNU General Public License v3.0 (or later)
License URI: https://www.gnu.org/licenses/gpl-3.0.html

A progressive theme development rig for WordPress, WP Rig is built to promote the latest best practices for progressive web content and optimization.

== Description ==

A progressive theme development rig for WordPress, WP Rig is built to promote the latest best practices for progressive web content and optimization. Creating a theme from WP Rig means adopting this approach and the core principles it is built on:

* Accessibility
* Mobile-first
* Progressive enhancement
* [Resilient Web Design](https://resilientwebdesign.com/)
* Progressive Web App enabled

We are trying to be the starter theme for design-focused devs. If you have any ideas, questions, or suggestions for this project or are seeking to get involved in contributing or maintaining, please check out our [discussion board on Github](https://github.com/wprig/wprig/discussions) and read [our contribute page](https://wprig.io/contribute/) on our website.

🤖 **AI Agents:** You MUST follow the [Mandatory Development Protocol](./AGENTS.md) to ensure architectural integrity.

== Documentation ==

We have a new Documentation area that can be found on the [WP Rig website](https://wprig.io/documentation/). If you would like to contribute to our documentation efforts, please submit a request on our [contribute page](https://wprig.io/contribute/) on our website.

== Installation ==

WP Rig has been tested on Linux, Mac, and Windows.

=== Requirements ===

WP Rig requires the following dependencies. Full installation instructions are provided at their respective websites.

* [PHP](http://php.net/) 8.1 or higher (PHP 8.3 recommended)
* [npm](https://www.npmjs.com/) or [bun](https://bun.com/)
* [Composer](https://getcomposer.org/) (installed globally)

=== WP Rig and child themes ===

WP Rig is built to lay a solid theme foundation, which makes it excellent for both parent themes and child themes. WP Rig now includes a dedicated childify script that optimizes the theme for use as a child theme while maintaining all the development benefits of the WP Rig workflow. This allows you to create lightweight child themes that inherit functionality from any parent theme while still leveraging WP Rig's build system.

=== How to install WP Rig: ===

1. Clone or download this repository to the themes folder of a WordPress site on your development environment.
	* DO NOT give the WP Rig theme directory the same name as your eventual production theme. Suggested directory names are `wprig` or `wprig-themeslug`. For instance, if your theme will eventually be named "Excalibur" your development directory could be named `wprig-excalibur`. The `excalibur` directory will be automatically created during the production process and should not exist beforehand.
2. Configure theme settings, including the theme slug and name.
	* View `./config/config.default.json` for the default settings.
	* Place custom theme settings in `./config/config.json` to override default settings.
		* You do not have to include all settings from config.default.json. Just the settings you want to override.
	* Place local-only theme settings in `./config/config.local.json`, e.g. potentially sensitive info like the path to your BrowserSync certificate.
		* Again, only include the settings you want to override.
3. In the command line, run `npm run rig-init` to install necessary node and Composer dependencies.
4. In the command line, run `npm run dev` to process source files, build the development theme, and watch files for subsequent changes.
	* `npm run build` can be used to process the source files and build the development theme without watching files afterwards.
	* `npm run childify` can be used to convert your WP Rig theme into a lightweight child theme that inherits from any parent theme.
5. In WordPress admin, activate the WP Rig development theme.
6. (Optional) Run `npm run ai:setup` to configure the project for your specific AI coding agent (Claude, Cursor, Windsurf, etc.).

==== Recommended Git Workflow ====
When working with WP Rig, it is important to understand the appropriate Git workflow depending on what you are working on. If you are using WP Rig as a starting point for a new theme, you should use the following workflow:

[Recommended Git Workflow](https://wprig.io/documentation/recommended-git-workflow/)

It is also important to note that the main branch now ignores the package-lock.json file. While this is ideal for how we distribute WP Rig, it can cause issues when working with a local development environment or on a team using a forked WP Rig. If you are using a local development environment, you should add the package-lock.json file to the .gitignore file with a ! in front to prevent ignoring the file in your new theme's repo.

==== Defining custom settings for the project ====

Here is an example of creating a custom theme config file for the project. In this example, we want a custom slug, name, and author.

Place the following in your `./config/config.json` file. This config will be versioned in your repo, so all developers use the same settings.

    {
      "theme": {
        "slug": "newthemeslug",
        "name": "New Theme Name",
        "author": "Name of the theme author"
      }
    }

==== Defining custom settings for your local environment ====

Some theme settings should only be set for your local environment. For example, if you want to set local information for BrowserSync.

Place the following in your `./config/config.local.json` file. This config will not be tracked in your repo and will only be executed in your local development environment.

    {
      "dev": {
        "browserSync": {
          "live": true,
          "proxyURL": "localwprigenv.test",
          "https": true,
          "keyPath": "/path/to/my/browsersync/key",
          "certPath": "/path/to/my/browsersync/certificate"
        }
      }
    }

If your local environment uses a specific port number, for example, `8888`, add it to the `proxyURL` setting as follows:

    "proxyURL": "localwprigenv.test:8888"

== How to build WP Rig for production ==

1. Follow the steps above to install WP Rig.
2. Run `npm run bundle` from inside the `wp-rig` development theme.
3. A new, production-ready theme will be generated in `wp-content/themes`.
4. The production theme can be activated or uploaded to a production environment.

== Architecture & Development ==

WP Rig uses a modular component architecture and a modern build system to optimize your development workflow.

* [Architecture & Component System](./docs/architecture.md): Explore the directory structure and the modular component framework.
* [Build Process & Workflows](./docs/workflow.md): Learn how CSS, JS, and production bundles are handled, including the modern dev server.
* [CLI Commands & Scripts](./docs/commands.md): Reference for NPM/Bun, Composer, and WP-CLI commands.
* [Advanced Features](./docs/advanced-features.md): Documentation for critical assets, font performance, and theme-scoped blocks.
* [Block-Based Theme Conversion](./docs/block-based-theme.md): Guide on how to align the theme with Full Site Editing.

For more information about commands and useful workflows, please visit the [WP Rig website](https://wprig.io/documentation/).

== License ==

WP Rig is released under [GNU General Public License v3.0 (or later)](https://github.com/wprig/wprig/blob/master/LICENSE).

== Resources ==

WP Rig includes the following third-party assets or fonts:

* Google Fonts
  * License: SIL Open Font License, 1.1 (OFL)
  * License URI: https://scripts.sil.org/OFL
  * Source: https://fonts.google.com/

= Changelog =

== 3.4.2 ==
- Added a comprehensive theme-review agent skill and operational playbook. Props @robruiz
- Hold alt/option key while toggling mobile menu in block-based theme dev locks menu. Props @robruiz
- Prevented submenu items from overflowing viewport using CSS Anchor Positioning. Props @robruiz
- Resolved magic numbers in navigation logic by establishing --mobile-breakpoint. Props @robruiz
- Aligned other hardcoded layout breakpoints in CSS stylesheets to use proper custom media queries. Props @robruiz
- Fixed child theme bug and added child theme compatibility tests. Props @robruiz
- Aligned Prettier configuration with ESLint and EditorConfig. Props @robruiz
- Updated all npm and Composer dependencies to their latest versions. Props @robruiz
- Added ergebnis/agent-detector. Props @robruiz
- Refactored font handling to support variable fonts. Props @robruiz
- Added Gutenberg block schema validator. Props @robruiz
- Introduced PHP-only block scaffolding support for WordPress 7.0. Props @robruiz
- Enhanced block build workflow with name/class safeguarding. Props @robruiz
- Added automated version promotion CLI command. Props @robruiz
- Leveraged pre-compiled block manifests for high-performance block registration. Props @robruiz

== 3.4.1 ==
- Fixed pathing resolution error in npm run ai:setup. Props @robruiz
- Added explicit .gitignore exclusions for generated local agent configurations. Props @robruiz
- Re-synchronized and updated all local agent-specific instructions. Props @robruiz
- Marked onboarding as completed and updated agent-state.md. Props @robruiz

== 3.4.0 ==
- Enhanced configuration retrieval and asset loading logic with transient-based caching. Props @robruiz
- Improved component loading and caching in Theme.php. Props @robruiz
- Conducted codebase clean-up and refactoring across components, tests, and styles. Props @robruiz
- Improved test coverage for internal scripts. Props @robruiz
- Replaced automated rig:submit command with manual rig:prepare workflow. Props @robruiz
- Fixed public registry data fetching and improved recursive dependency resolution. Props @robruiz
- Fixed and improved the block-based theme conversion script and setup. Props @robruiz
- Added a new logger utility to rig.js. Props @robruiz
- Implemented robust path traversal protection in rig CLI. Props @robruiz
- Refactored npm install logic in CLI to use spawnSync. Props @robruiz
- Added global --yes flag to all rig commands. Props @robruiz
- Introduced new diagnostic command to validate local component structure. Props @robruiz
- Updated Theme.php and CLI to ensure normalized component names always form valid PHP identifiers. Props @robruiz
- Enhanced registry CLI during recursive dependency resolution. Props @robruiz
- Introduced modular critical asset strategy for loading. Props @robruiz
- Extracted header and navigation styles to a dedicated critical CSS file. Props @robruiz
- Updated Asset_Provider manifest system to support custom loading strategies. Props @robruiz
- Migrated navigation scripts to use manifest-driven performance system. Props @robruiz
- Improved overall site performance with automated critical CSS inlining. Props @robruiz
- Resolved font flashing (FOUT) by switching default font-display to block. Props @robruiz
- Integrated Fonts component into Asset_Provider architecture. Props @robruiz
- Initial merge of the distributed component registry. Props @robruiz
- Refactored inc/Theme.php to automatically discover and register components. Props @robruiz
- Updated scaffolding to include manifest.json, SPEC.md, and SKILL.md. Props @robruiz
- Introduced new command suite (npm run rig:*) for component lifecycle. Props @robruiz
- Developed registry WordPress plugin with GitHub API integration. Props @robruiz
- Updated CLI to support authenticated API calls. Props @robruiz
- Added inc/Registry_Config component to the theme. Props @robruiz
- Implemented multi-layer validation for component submissions. Props @robruiz
- Added GitHub Action templates for automated OWASP Top 10 scanning. Props @robruiz
- Added component-registry skill in .ai/skills/. Props @robruiz

== 3.3.0 ==
- Added skills. Props @robruiz
- Added MCP for documentation access. Props @robruiz
- Added AI agent script that sets up WP Rig for specific agents. Props @robruiz
- Leverage screenshot capabilities for self-assessment. Props @robruiz
- Minor updates to composer and node deps. Props @robruiz
- Updates to config to explicitly declare theme type. Props @robruiz
- Initial pass on agents.md. Props @JonImmsWordpressDev

== 3.2.0 ==
- Added Playwright for E2E testing. Props @robruiz
- Added Lighthouse CI configuration. Props @robruiz
- Added PHPStan for static analysis. Props @robruiz
- Theme-level blocks are now an opt-in feature via custom script. Props @robruiz
- Improved default mobile navigation. Props @robruiz
- Improved PHP type declarations and dev modern server. Props @robruiz
- Added test data for theme testing. Props @robruiz
- Cleaned up unused packages in package.json. Props @robruiz

== 3.1.0 ==
- New header and mobile nav experience. Props @robruiz
- HMR alternative for BrowserSync added. Props @robruiz
- Added local Google Fonts downloader. Props @robruiz
- Updated rig-init command for better DX. Props @robruiz
- Added command to convert WP Rig into child theme build system. Props @robruiz
- Added theme-level block authoring and management system. Props @robruiz
- Added command to scaffold new PHP components. Props @robruiz
- Removed Gulp from WP Rig and replaced with custom script. Props @robruiz

== 2.0.0 ==
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
- Replace `require-uncached` with `import-fresh`. See [#296](https://github.com/wprig/wprig/pull/296). Props @ataylorme.
- Upgrade WordPress coding standards to 2.0. See [#288](https://github.com/wprig/wprig/pull/295). Props @ataylorme, @benoitchantre.
- Use pure CSS files for CSS custom properties and media queries. See [#281](https://github.com/wprig/wprig/pull/281). Props @mor10.
- Use `.browserslistrc` for browser support definitions. See [#227](https://github.com/wprig/wprig/pull/227). Props @ataylorme.
- Allow adjusting the mechanism for how stylesheets are loaded, for better compatibility with contexts like AMP or Customizer. See [#319](https://github.com/wprig/wprig/pull/319). Props @felixarntz.

== 1.0.5 ==
- Do not initialize menus until DOM is loaded. See [#140](https://github.com/wprig/wprig/pull/140). Props @bamadesigner.
- Fix PHPCodeSniffer issues and violations. Props @mor10, @felixarntz.
- Fix incorrect grammar in comment. See [#151](https://github.com/wprig/wprig/pull/151). Props @ecotechie.

== 1.0.4 ==
- Update CSS (front and editor styles) to meet current Gutenberg recommendations as of October 1, 2018. Props mor10.
- Enable default block styles by default in functions.php. Props mor10.
- Add readme.txt file as per Theme Handbook. Props mor10.

== 1.0.3 ==
- Add Gutenberg editor-font-sizes. Props @atanas-angelov-dev
- Improve conditional logic in wprig_add_body_style(). Props @iliman
- Update WordPress Coding Standards to 1.0.0. Props @mor10

== 1.0.2 ==
- Updated theme support for Gutenberg color palette with a single array attribute. Props @webmandesign
- `./verbose/` folder no longer holds PHP files. Resolves duplicate functionality.
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
