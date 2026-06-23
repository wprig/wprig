---
description: Specific instructions and patterns for resolving PHP CodeSniffer (PHPCS) issues within WP Rig, following WordPress Coding Standards.
globs: "**/*.php", phpcs.xml.dist
---

# PHPCS Cleanup Skill

This skill provides a systematic approach to identifying and resolving PHP CodeSniffer issues in the WP Rig codebase, ensuring adherence to WordPress Coding Standards (WPCS).

## 1. Identification & Scanning

To scan the project for PHPCS issues, excluding the test environment setup script:
```bash
vendor/bin/phpcs --ignore=setup-wp-env.php .
```
For a more detailed output with error codes (useful for finding specific sniffs):
```bash
vendor/bin/phpcs -s --ignore=setup-wp-env.php .
```

## 2. Common Fix Patterns

### A. Security & Output Escaping
- **When to fix:** Always escape output using `esc_html()`, `esc_attr()`, `esc_url()`, or `wp_kses()` for HTML.
- **When to ignore:** If the output is pre-rendered by WordPress core (like `$content` in a block render template) or when inlining intentional raw content (like critical CSS).
- **Ignore Syntax:**
  ```php
  // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
  echo $trusted_content;
  ```

### B. Reserved Keyword Usage
WPCS flags some variables that use reserved PHP keywords or are too generic.
- **`$default`** -> Rename to **`$default_value`**.
- **`$function`** -> Rename to **`$function_name`**.
- **`$class`** -> Rename to **`$class_name`**.

### C. Documentation Standards
- **File Docblocks:** Every PHP file must start with a `<?php` followed by a file-level docblock containing `@package wp_rig`.
- **Method/Function Docblocks:**
    - Ensure all `@param` and `@return` tags are present and accurate.
    - Align parameters and descriptions in docblocks.
    - Add `@throws` tags if the method explicitly throws exceptions.
- **Blank Lines:** Ensure there is a blank line after the file docblock before the code (e.g., before `return` or `namespace`).

### D. WP-CLI & Filesystem Operations
- **`date()` vs `gmdate()`:** Use `gmdate()` for consistency across environments.
- **Filesystem access:** WordPress prefers `WP_Filesystem` over direct `file_get_contents()` or `file_put_contents()`.
- **CLI Exemption:** In WP-CLI commands or build scripts where `WP_Filesystem` might not be initialized or is unnecessary for local operations, use an intentional ignore:
  ```php
  // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
  $content = file_get_contents( $path );
  ```

### E. Block Render Templates
- Ensure variables provided by core (`$attributes`, `$content`, `$block`) are properly normalized.
- Use namespaced helpers (e.g., `wp_rig()->block_get_title()`) instead of generic variable names like `$title` to avoid global namespace pollution.

## 3. Automated Fixing
Before manual fixing, always attempt to use `phpcbf` to resolve whitespace and formatting issues automatically:
```bash
vendor/bin/phpcbf --ignore=setup-wp-env.php .
```

## 4. Verification Workflow
1. Run `phpcs` to identify issues.
2. Run `phpcbf` for auto-fixes.
3. Manually address remaining issues using the patterns above.
4. Run `phpcs` again to ensure all "ERROR" level items are resolved.
5. Verify that the application still runs correctly, especially after renaming variables.

## Best Practices
- **Be Minimal:** Only apply `phpcs:ignore` when absolutely necessary and logically justified.
- **Be Consistent:** Match the existing documentation style and naming conventions of the file you are editing.
- **Be Careful:** Renaming a variable (like `$default`) requires checking all its usages within the scope.
