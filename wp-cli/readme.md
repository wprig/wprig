## Installation
The commands are automatically registered when WP-CLI is available. Make sure you have WP-CLI installed and are running these commands from your WordPress root directory.
## Available Commands
### `wp rig dev_setup`
Sets up a complete development environment by installing curated plugins and configuring WordPress pages.
**What it does:**
- Installs and activates development plugins:
	- `fakerpress` - Generate fake content for testing
	- `theme-check` - WordPress theme standards checker
	- `query-monitor` - Debug bar and profiler
	- `accessibility-checker` - Accessibility testing tools
	- `autodescription` - SEO meta data generator

- Creates a "Home" page with welcome content
- Creates a "Blog" page for posts
- Configures WordPress to use a static front page setup

**Usage:**
``` bash
wp rig dev_setup
```
**Example:**
``` bash
wp rig dev_setup
# Success: Development setup completed!
```
### `wp rig fake_menu_items`
Generates dummy navigation menu items for theme development and testing.
**Options:**

| Option | Description | Default |
| --- | --- | --- |
| `--menu=<menu>` | Menu name or ID to add items to. Creates new menu if not provided | Creates new menu |
| `--items=<number>` | Number of top-level menu items to create | 5 |
| `--depth=<number>` | Maximum depth of submenu items (1-3) | 2 |
| `--subitems=<number>` | Number of subitems per parent | 3 |
| `--prefix=<text>` | Prefix for menu item names | "Menu Item" |
| `--assign-location=<location>` | Assign menu to a theme location after creation | None |
**Usage:**
``` bash
wp rig fake_menu_items [options]
```
**Examples:**
Create a basic menu with default settings:
``` bash
wp rig fake_menu_items
```
Create 8 top-level items with 4 subitems each, 3 levels deep:
``` bash
wp rig fake_menu_items --menu="Test Menu" --items=8 --subitems=4 --depth=3
```
Create a menu and assign it to the primary location:
``` bash
wp rig fake_menu_items --items=6 --depth=2 --prefix="Nav Item" --assign-location=primary
```
Create items in an existing menu:
``` bash
wp rig fake_menu_items --menu="Main Navigation" --items=10 --prefix="Page"
```
**Menu Structure:**
- Creates hierarchical menu items (e.g., "Menu Item 1", "Menu Item 1.1", "Menu Item 1.1.1")
- Deeper levels automatically have fewer items to maintain usability
- All items link to "#" as placeholders

### `wp rig menu_export`
Exports a WordPress navigation menu to JSON format.
**Options:**

| Option | Description | Default |
| --- | --- | --- |
| `<menu_name>` | The name of the menu to export | Required |
| `--file=<filename>` | Save to a specific file | Outputs to stdout if not provided |
| `--pretty` | Format JSON with indentation for better readability | Compact JSON |

**Usage:**
``` bash
wp rig menu_export <menu_name> [--file=<filename>] [--pretty]
```

**Examples:**
``` bash
# Export menu to stdout
wp rig menu_export "Main Menu"

# Export menu to a file
wp rig menu_export "Main Menu" --file=main-menu.json

# Export menu to a file with formatted JSON
wp rig menu_export "Main Menu" --file=main-menu.json --pretty
```

### `wp rig menu_import`
Imports a WordPress navigation menu from JSON format.
**Options:**

| Option | Description | Default |
| --- | --- | --- |
| `<file>` | Path to the JSON file containing menu data | Required |
| `--overwrite` | Overwrite existing menu with the same name | Error if menu exists |
| `--dry-run` | Test the import without making changes | False |

**Usage:**
``` bash
wp rig menu_import <file> [--overwrite] [--dry-run]
```

**Examples:**
``` bash
# Import menu from file
wp rig menu import main-menu.json

# Import menu and overwrite any existing menu with the same name
wp rig menu import main-menu.json --overwrite

# Test import without making changes
wp rig menu import main-menu.json --dry-run
```

### `wp rig menu_list`
Lists all available WordPress navigation menus.
**Options:**

| Option | Description | Default |
| --- | --- | --- |
| `--format=<format>` | Output format (table, csv, json, yaml) | table |

**Usage:**
``` bash
wp rig menu_list [--format=<format>]
```

**Examples:**
``` bash
# List all menus in table format
wp rig menu_list

# List all menus in JSON format
wp rig menu_list --format=json
```

## Development Notes
- All commands are part of the class extending `WP_CLI_Command` `Rig_Command`
- Commands automatically handle error cases and provide user feedback
- The command includes progress bars for better user experience `fake_menu_items`
- Menu creation is intelligent - it will use existing menus by name or ID, or create new ones as needed

## Requirements
- WordPress with WP-CLI installed
- WP Rig theme framework
- Appropriate WordPress permissions for plugin installation and menu management

### `wp rig fonts_download`
Downloads Google Fonts declared by the theme and saves them locally under the active theme directory so the theme can serve fonts without relying on the Google Fonts CDN.

**Options:**

| Option | Description | Default |
| --- | --- | --- |
| `--dir=<dir>` | Relative directory within the active theme where fonts and the generated CSS will be stored | `assets/fonts` |

**Usage:**
``` bash
wp rig fonts_download
wp rig fonts_download --dir=assets/fonts
```

**What it does:**
- Reads the Google Fonts families declared in the theme’s Fonts Component
- Downloads the corresponding .woff2 files into subfolders under the destination directory
- Generates a google-fonts.css file with local URLs pointing to the downloaded assets
- Prints the path to the generated CSS on success
