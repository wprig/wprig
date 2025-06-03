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

## Development Notes
- All commands are part of the class extending `WP_CLI_Command` `Rig_Command`
- Commands automatically handle error cases and provide user feedback
- The command includes progress bars for better user experience `fake_menu_items`
- Menu creation is intelligent - it will use existing menus by name or ID, or create new ones as needed

## Requirements
- WordPress with WP-CLI installed
- WP Rig theme framework
- Appropriate WordPress permissions for plugin installation and menu management
