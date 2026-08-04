---
description: Guide for ensuring code quality and adherence to WordPress and WP Rig standards using linting and analysis tools.
globs: phpstan.neon.dist, .phpcs.xml.dist, rector.php, .prettierrc, .eslintrc.json
---

# Code Quality Standards in WP Rig

WP Rig enforces high code quality through a suite of automated linting, static analysis, and formatting tools. Adhering to these standards ensures that the theme is secure, performant, and maintainable.

## PHP Quality Tools

### 1. PHP Coding Standards (PHPCS)
Used to enforce the WordPress Coding Standards.
- **Run Checks**: `composer run-phpcs` (or `composer phpcs-dev`)
- **Auto-Fix**: `composer run-phpcbf` (or `composer phpcbf-dev`)

### 2. PHP Static Analysis (PHPStan)
Identifies potential bugs and type mismatches without executing the code.
- **Run Analysis**: `composer phpstan`

### 3. PHP Automated Refactoring (Rector & PHP-CS-Fixer)
Automates code updates and applies modern PHP best practices.
- **Run All Fixes**: `composer fix`

## JavaScript & CSS Quality Tools

### 1. ESLint
Enforces coding standards for JavaScript and React components.
- **Run Checks**: `npm run lint:js`

### 2. Stylelint
Enforces coding standards for CSS.
- **Run Checks**: `npm run lint:css`
- **Auto-Fix**: `npm run fix:css`

## Comprehensive Quality Check

Run core pre-flight checks (E2E tests, CSS, and JS linting) in a single command:
```bash
npm run ai:check
```

## Best Practices for Agents

1. **Verify Before Submit**: Always run the relevant linting command before submitting code changes.
2. **Fix First**: Use the automated "fix" commands (`composer fix`, `composer run-phpcbf`) to resolve trivial issues.
3. **Analyze Results**: Carefully review PHPStan and PHPCS outputs. Do not ignore errors; they often point to real bugs or security vulnerabilities.
4. **Follow Docblock Standards**: Ensure all PHP classes and methods have proper docblocks with `@param` and `@return` types.
5. **Modern PHP**: Use the `rector` tool to identify opportunities to modernize code patterns (e.g., using typed properties, arrow functions).
6. **No "Suppressions"**: Avoid using suppression comments (like `phpcs:ignore` or `eslint-disable`) unless there is a documented, technical reason for doing so.
7. **Consistent Formatting**: Rely on Prettier/ESLint configs to ensure consistent code style across the entire project.
