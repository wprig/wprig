<?php
/**
 * All Custom WP CLI commands for WP Rig
 *
 * @package wp_rig
 */

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	return;
}


/**
 * Class Rig_Command
 *
 * A WP-CLI command class designed to assist in setting up a WordPress development environment. This class provides functionality to install a set of curated plugins and configure pages within WordPress to establish a standard development setup.
 */
class Rig_Command extends WP_CLI_Command {


	/**
	 * Sets up the development environment by installing curated plugins and configuring a static front page with a blog page.
	 *
	 * @param array $args Positional arguments passed to the command.
	 * @param array $assoc_args Associative arguments passed to the command.
	 */
	public function dev_setup( array $args, array $assoc_args ): void {
		$curated_plugins = array(
			'fakerpress',
			'theme-check',
			'query-monitor',
			'accessibility-checker',
			'autodescription',
		);
		foreach ( $curated_plugins as $curated_plugin ) {
			WP_CLI::runcommand(
				'plugin install ' . $curated_plugin . ' --activate',
				array(
					'exit_error' => false, // Prevent WP-CLI from exiting on error, allowing further handling if needed.
				)
			);
		}

		// Ensure the 'Home' page exists.
		$home_page_id = $this->get_or_create_page( 'Home', 'Welcome to our website!' );

		// Ensure the 'Blog' page exists.
		$blog_page_id = $this->get_or_create_page( 'Blog', '' );

		// Set the static front page and posts page.
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $home_page_id );
		update_option( 'page_for_posts', $blog_page_id );

		WP_CLI::success( 'Development setup completed!' );
	}

	/**
	 * Generates a specified number of dummy menu items in a WordPress navigation menu, including optional hierarchical submenus.
	 *
	 *  Generate dummy menu items for WordPress theme development
	 *
	 *  ## OPTIONS
	 *
	 *  [--menu=<menu>]
	 *  : The menu name or ID to add items to. If not provided, a new menu will be created.
	 *
	 *  [--items=<number>]
	 *  : Number of top-level menu items to create.
	 *  Default: 5
	 *
	 *  [--depth=<number>]
	 *  : Maximum depth of submenu items (1-3).
	 *  Default: 2
	 *
	 *  [--subitems=<number>]
	 *  : Number of subitems per parent.
	 *  Default: 3
	 *
	 *  [--prefix=<text>]
	 *  : Prefix for menu item names.
	 *  Default: 'Menu Item'
	 *
	 *  [--assign-location=<location>]
	 *  : Assign the menu to a theme location after creating items.
	 *
	 *  ## EXAMPLES
	 *
	 *      # Create 8 top-level items with 4 subitems each, with 3 levels of depth in a menu called "Main Menu"
	 *      $ wp rig fake_menu_items generate --menu="Main Menu" --items=8 --subitems=4 --depth=3
	 *
	 *      # Create a new menu with dummy items and assign it to primary location
	 *      $ wp rig fake_menu_items generate --items=6 --depth=2 --prefix="Nav Item" --assign-location=primary
	 *
	 *
	 * @return void
	 */
	public function fake_menu_items($args, $assoc_args){
		// Parse parameters with defaults
		$menu = WP_CLI\Utils\get_flag_value($assoc_args, 'menu', '');
		$items_count = (int) WP_CLI\Utils\get_flag_value($assoc_args, 'items', 5);
		$max_depth = (int) WP_CLI\Utils\get_flag_value($assoc_args, 'depth', 2);
		$subitems_count = (int) WP_CLI\Utils\get_flag_value($assoc_args, 'subitems', 3);
		$prefix = WP_CLI\Utils\get_flag_value($assoc_args, 'prefix', 'Menu Item');
		$location = WP_CLI\Utils\get_flag_value($assoc_args, 'assign-location', '');

		// Validate parameters
		$max_depth = min(max($max_depth, 1), 3); // Limit depth between 1-3

		// Either get existing menu or create a new one
		$menu_id = $this->get_or_create_menu($menu);
		if (!$menu_id) {
			WP_CLI::error('Failed to create or find menu.');
			return;
		}

		$menu_obj = wp_get_nav_menu_object($menu_id);
		$menu_name = $menu_obj->name;

		WP_CLI::log(sprintf('Generating dummy menu items for menu "%s" (ID: %d)', $menu_name, $menu_id));

		// Create top-level items
		$progress = \WP_CLI\Utils\make_progress_bar('Creating menu items', $items_count);
		$created_count = 0;

		for ($i = 1; $i <= $items_count; $i++) {
			$parent_id = wp_update_nav_menu_item($menu_id, 0, array(
				'menu-item-title' => $prefix . ' ' . $i,
				'menu-item-url' => '#',
				'menu-item-status' => 'publish'
			));

			if ($parent_id && !is_wp_error($parent_id)) {
				$created_count++;

				// Create submenu items if depth > 1
				if ($max_depth > 1) {
					$this->create_submenu_items($menu_id, $parent_id, $prefix . ' ' . $i, $subitems_count, $max_depth, 2);
				}
			}

			$progress->tick();
		}

		$progress->finish();

		// Assign to location if requested
		if (!empty($location)) {
			$locations = get_theme_mod('nav_menu_locations');
			$locations[$location] = $menu_id;
			set_theme_mod('nav_menu_locations', $locations);
			WP_CLI::success(sprintf('Menu assigned to location: %s', $location));
		}

		WP_CLI::success(sprintf('Created %d top-level menu items in menu "%s"', $created_count, $menu_name));

	}


	/**
	 * Retrieves the ID of a page with the specified title if it exists, otherwise creates a new page with the given title and content.
	 *
	 * @param string $title The title of the page to retrieve or create.
	 * @param string $content The content to use if a new page is created.
	 *
	 * @return int The ID of the retrieved or newly created page.
	 */
	private function get_or_create_page( string $title, string $content ): int {
		$query = new WP_Query(
			array(
				'post_type'   => 'page',
				'title'       => $title,
				'post_status' => 'publish',
			)
		);

		if ( $query->have_posts() ) {
			$page = $query->posts[0];
			return $page->ID;
		} else {
			return wp_insert_post(
				array(
					'post_title'   => $title,
					'post_content' => $content,
					'post_status'  => 'publish',
					'post_type'    => 'page',
				)
			);
		}
	}

	/**
	 * Recursively create submenu items
	 *
	 * @param int $menu_id
	 * @param int $parent_id
	 * @param string $parent_prefix
	 * @param int $count
	 * @param int $max_depth
	 * @param int $current_depth
	 */
	private function create_submenu_items($menu_id, $parent_id, $parent_prefix, $count, $max_depth, $current_depth) {
		for ($j = 1; $j <= $count; $j++) {
			$title = $parent_prefix . '.' . $j;
			$item_id = wp_update_nav_menu_item($menu_id, 0, array(
				'menu-item-title' => $title,
				'menu-item-url' => '#',
				'menu-item-parent-id' => $parent_id,
				'menu-item-status' => 'publish'
			));

			// Add deeper levels if needed and if we haven't reached max depth
			if ($item_id && !is_wp_error($item_id) && $current_depth < $max_depth) {
				// Create fewer items at deeper levels
				$next_level_count = max(2, intval($count / 2));
				$this->create_submenu_items($menu_id, $item_id, $title, $next_level_count, $max_depth, $current_depth + 1);
			}
		}
	}

	/**
	 * Get existing menu or create a new one
	 *
	 * @param string|int $menu Menu name or ID
	 * @return int|false Menu ID or false on failure
	 */
	private function get_or_create_menu($menu) {
		if (empty($menu)) {
			// Create a new menu
			$menu_name = 'Dummy Menu ' . date('Y-m-d H:i:s');
			$menu_id = wp_create_nav_menu($menu_name);
			if (is_wp_error($menu_id)) {
				WP_CLI::error($menu_id->get_error_message());
				return false;
			}
			return $menu_id;
		}

		// Check if menu exists by ID
		if (is_numeric($menu)) {
			$menu_obj = wp_get_nav_menu_object($menu);
			if ($menu_obj) {
				return $menu_obj->term_id;
			}
		}

		// Check if menu exists by name
		$menu_obj = wp_get_nav_menu_object($menu);
		if ($menu_obj) {
			return $menu_obj->term_id;
		}

		// Create a new menu with the given name
		$menu_id = wp_create_nav_menu($menu);
		if (is_wp_error($menu_id)) {
			WP_CLI::error($menu_id->get_error_message());
			return false;
		}

		return $menu_id;
	}

}

WP_CLI::add_command( 'rig', 'Rig_Command' );
