---
description: Guide for writing and running PHPUnit unit and integration tests for WP Rig theme components.
globs: tests/phpunit/**/*, phpunit.xml.dist
---

# PHPUnit Testing in WP Rig

WP Rig encourages a test-driven approach for core theme logic and components. The theme is pre-configured for both unit testing (testing isolated PHP logic) and integration testing (testing within the WordPress environment).

## Test Structure

All tests live in the `tests/phpunit/` directory:
- **`Unit/`**: Tests for isolated PHP functions and classes that do not require a database or WordPress load.
- **`Integration/`**: Tests that require WordPress functions or database access.

## Running Tests

Use the following commands to execute your tests:

### Run All Tests
```bash
composer test:all
```
(`test:all` = unit + integration + PHPStan)

### Run Unit Tests Only
```bash
composer test:unit
```

### Run Integration Tests Only
```bash
composer test:integration
```

## Writing a Test Case

### Basic Unit Test
Extend `PHPUnit\Framework\TestCase` and focus on input/output of pure logic.

```php
namespace WP_Rig\WP_Rig\Tests\Unit\My_Feature;

use PHPUnit\Framework\TestCase;
use WP_Rig\WP_Rig\My_Feature\Component;

class ComponentTest extends TestCase {
    public function test_get_slug() {
        $component = new Component();
        $this->assertEquals( 'my-feature', $component->get_slug() );
    }
}
```

### Basic Integration Test
Integration tests use the WordPress testing framework, which must be set up correctly in your local environment.

```php
namespace WP_Rig\WP_Rig\Tests\Integration\My_Feature;

use WP_UnitTestCase;
use WP_Rig\WP_Rig\My_Feature\Component;

class ComponentIntegrationTest extends WP_UnitTestCase {
    public function test_initialize_hooks() {
        $component = new Component();
        $component->initialize();
        $this->assertTrue( has_action( 'init', [ $component, 'my_init_hook' ] ) );
    }
}
```

## Best Practices for Agents

1. **Write Unit Tests First**: For most business logic, unit tests are faster and easier to maintain.
2. **Mocking**: Use PHPUnit's mocking capabilities or libraries like Brain Monkey to simulate WordPress functions in unit tests.
3. **Reproducers**: When fixing a bug, first write a test that fails due to that bug, then implement the fix to make it pass.
4. **Test Components**: Every new component added to `inc/` should have at least a basic unit test verifying its slug and initialization.
5. **Coverage**: Focus on testing complex logic, data transformations, and edge cases (e.g., empty settings, invalid input).
6. **Environment**: Ensure that the WordPress testing library is correctly installed and configured before running integration tests.
