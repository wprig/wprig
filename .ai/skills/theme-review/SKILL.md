---
description: Run and interpret WordPress.org theme review checks for WP Rig themes.
globs: style.css, readme.txt, functions.php, inc/**/*.php, theme.json, templates/**/*, parts/**/*
---

# Theme Review (WP.org)

## When to use
Use this skill when preparing a WP Rig theme for submission to the official WordPress.org Theme Directory, or when auditing an existing theme against official Theme Review Team (TRT) standards. This is distinct from standard daily linting, as it focuses on the final production bundle and strict directory requirements.

## Severity model
- **REQUIRED**: Must pass. If these fail, the theme will be rejected.
- **WARNING**: Should be fixed if possible. May cause rejection depending on the reviewer.
- **RECOMMENDED**: Good practices.
- **INFO**: Informational items.

## Architecture branch picker
Determine the theme architecture to apply the correct checks:
- **Classic / Hybrid**: Uses PHP templates (`index.php`, `header.php`, `footer.php`). Must use classic hooks, `add_theme_support()`, and PHP templating functions.
- **Block Themes (FSE)**: Uses HTML templates (`templates/`, `parts/`) and `theme.json`. Must not use classic widget or nav menu registration.

## WP Rig footguns (read first)
- **Custom Blocks = Plugin Territory**: By default, custom blocks are considered plugin territory by the TRT. If a WP Rig theme includes `register_block_type` or block components, it will result in a **REQUIRED fail** during audit. They must be moved to a plugin for submission.
- **Performance Meta Cleanup**: Removing non-presentational hooks is forbidden. Ensure `cleanup_meta_tags` is set to `false` in config.
- **Audit the Bundle, Not Source**: The TRT reviews the final compiled zip file, not the development tree. Do not audit `src/`, `node_modules/`, or `.ai/`.

## Runbook (copy-paste)

### A. Configure the Theme
Before you begin, apply the strict WP.org configuration defaults (this ensures core compliance rules like not removing non-presentational hooks):
```bash
npm run theme:setup-wporg
```

### B. Static gate
Run the basic static checks (currently existing via lint, more coming in PR-2+):
```bash
composer run-phpcs # or vendor/bin/phpcs
npm run lint:js
npm run lint:css
```
*(Note: Full static gate via `npm run audit:theme-review` coming in PR-2)*

### C. Bundle gate
Generate the production bundle before final audit:
```bash
npm run bundle:wporg
```
*(Note: `bundle:wporg` gate coming in PR-4)*

### D. Reviewer environment
Set up the official TRT reviewer plugins and environment:
```bash
wp rig review-setup
```
*(Note: `review-setup` and `theme-check` bridge coming in PR-3)*

### E. Runtime / E2E
Run tests against the unit test data:
```bash
npm run audit:accessibility
```
*(Runs Playwright tests configured to assert skip-links, form labels, focus states, and visual edge cases against the WP Unit Test Data.)*

## Interpreting results
- Focus strictly on **REQUIRED** failures first.
- Ensure all vendor libraries are documented and GPL compatible.
- Check that the text domain matches the slug exactly.

## CI Integration
WP Rig's GitHub Actions automatically audit the codebase on pull requests.
- The `php` job runs `composer run-phpcs` against the `WPThemeReview` standards.
- The `theme-review` job runs strict static analysis for banned files and security patterns.
- Ensure you pass `npm run audit:theme-review` locally before pushing.

## Fix patterns
- **Escaping**: Ensure `esc_html__()`, `wp_kses_post()`, etc., are used on all dynamic output.
- **Prefixing**: Prefix all functions, globals, hooks, and handles with the theme slug.
- **Blocks Promote**: If custom blocks exist, they must be removed or moved to a companion plugin for wp.org submission.
- **`cleanup_meta_tags`**: Set `"cleanup_meta_tags": false` in `config/config.json`.

## Appendix A — Required handbook map
1. **Accessibility**: Skip links, keyboard navigation.
2. **Code**: No errors/notices, valid HTML/CSS.
3. **Core Functionality**: Use core APIs (e.g., customizer, not custom option panels).
4. **Design & Layout**: Responsive, handles long titles, aligns properly.
5. **Licensing**: 100% GPL compatible.
6. **Naming & Credits**: Unique name, correct author credits.
7. **Options & Settings**: Must use Customizer.
8. **Plugins**: Do not bundle plugins. TGMPA is restricted.
9. **Presentation vs Functionality**: No CPTs, taxonomies, or custom blocks (plugin territory).
10. **Privacy**: Do not phone home or load external resources without consent. (Google Fonts are allowed per a specific exception, but local is preferred. Other remote non-GF CDNs = REQUIRED fail).
11. **Security**: Validate, sanitize, and escape all data.
12. **Stylesheets & Scripts**: Enqueue properly.
13. **Templates**: 
    - Classic required: `wp_body_open`, `language_attributes`, `automatic-feed-links`.
14. **Theme Tags**: Use valid tags from the official list.
15. **Unit Test Data**: Use classic (`themeunittestdata.wordpress.xml`) as primary, pattern data as secondary.

## Appendix B — Accessibility-ready (optional tag)
- Strict keyboard operability.
- Visible focus indicators.
- WCAG AA color contrast (4.5:1 normal, 3:1 large).
- Logical heading hierarchy.
- Form field labels.

## Appendix C — Legacy WPThemeReview notes
- The package `wpthemereview/wpthemereview` is optional/legacy and not the default standard. The default is WPCS 3 + PHPCompatibility.

## Verified against handbook as of: 2026-08-01
