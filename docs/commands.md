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
- **Testing**:
	- `test:e2e`: Run Playwright End-to-End tests.
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
