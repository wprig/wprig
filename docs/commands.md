# CLI Commands & Scripts Reference

WP Rig includes Node/Bun, Composer, and WP CLI scripts to improve the developer experience.

## NPM/Bun Scripts

Use `npm run <command>` (or `bun run <command>`):

- **Development**:
	- `dev`: Watch source files and rebuild on changes with BrowserSync.
	- `dev:modern`: Vite-like development experience without BrowserSync.
	- `build`: One-time build of source files without watching.
- **Production**:
	- `bundle`: Generate production-ready theme with optimizations.
	- `translate`: Generate POT translation file.
- **Scaffolding**:
	- `block:new`: Create a new Gutenberg block.
	- `block:list`: List all theme blocks.
	- `block:remove`: Remove a block.
	- `block:promote-plugin`: Export block as plugin.
	- `create-rig-component`: Scaffold new theme component.
	- `childify`: Convert theme to a lightweight child theme.
- **Component Registry**:
	- `rig:list`: List all currently installed theme components, showing their version and whether they are bundled core components or registry imports. Use this for a quick overview of your theme's active modules.
	- `rig:search [keyword]`: Discover performance-optimized components from the WP Rig community. Use this when you're looking for existing features to add to your theme.
	- `rig:add [slug]`: Download and install a component into your `inc/` directory. It automatically registers the component in `Theme.php` and integrates its assets into the build system. Use this to quickly add new functionality without manual wiring.
	- `rig:update [slug]`: Check for framework-level updates to a registry component while preserving your local customizations. Use this to keep your components bug-free and up-to-date with the latest WP Rig standards.
	- `rig:remove [slug]`: Completely remove a component from your theme, including its files and registration in `Theme.php`. Use this when you no longer need a feature or want to replace it.
	- `rig:test-component [slug]`: Run a comprehensive "pre-flight" check on a local component to ensure it meets registry standards (manifest integrity, required files, security scans). Use this before attempting to share your component.
	- `rig:check [slug]`: A lightweight version of the component audit. If no slug is provided, it scans all components in the `inc/` directory for structure and manifest validity. Use this for quick health checks.
	- `rig:prepare [slug]`: Package a local component into the `dist/components/` folder and provide step-by-step instructions for submitting it to the official registry via a GitHub Pull Request. Use this when you've built something great and want to share it with the community.
- **Testing**:
	- `test:e2e`: Run Playwright End-to-End tests.
	- `test:e2e:nav:watch`: Run full visual navigation watch suite across desktop and mobile.
	- `test:e2e:nav:watch:mobile`: Launch visual watch test directly in mobile mode (375x750 viewport).
	- `test:e2e:nav:watch:desktop`: Launch visual watch test directly in desktop mode (1280x800 viewport).
	- `test:e2e:mobile-nav`: Run 5-level deep mobile navigation tests in headless background mode.
	- `test:e2e:mobile-nav:watch`: Run 5-level deep mobile navigation tests in headed watch mode.
	- `test:e2e:screenshot`: Take screenshots for regression testing.
	- `ai:check`: Comprehensive check for standards compliance.

For more detailed testing instructions, see [docs/testing.md](testing.md).

## Composer Scripts

Use `composer <command>`:

- **Testing**:
	- `test:unit`: Run unit tests.
	- `test:integration`: Run integration tests.
	- `test:all`: Run all tests (Unit, Integration, and PHPStan).
- **Quality Assurance**:
	- `phpstan`: Run PHPStan static analysis.
	- `phpstan:baseline`: Regenerate PHPStan error baseline.
	- `phpcbf-dev`: Run PHP Code Beautifier.
	- `phpcs-dev`: Run PHP CodeSniffer.
	- `fix`: Run all code fixers (Rector, PHP-CS-Fixer, PHPCBF).
- **Environment**:
	- `setup-wp-tests`: Setup WordPress test environment.

## WP CLI Commands

Custom WP Rig commands (requires [WP-CLI](https://wp-cli.org/)):

- `wp rig test-setup`: Sets up the Theme Unit Test environment.
- `wp rig import-test-data`: Imports the official WordPress Theme Unit Test Data.
