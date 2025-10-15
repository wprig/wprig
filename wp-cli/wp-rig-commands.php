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
  *      $ wp rig fake_menu_items --menu="Main Menu" --items=8 --subitems=4 --depth=3
  *
  *      # Create a new menu with dummy items and assign it to primary location
  *      $ wp rig fake_menu_items --items=6 --depth=2 --prefix="Nav Item" --assign-location=primary
	 *
	 * @return void
	 */
	/**
	 * Export a WordPress menu to JSON format
	 *
	 * ## OPTIONS
	 *
	 * <menu_name>
	 * : The name of the menu to export
	 *
	 * [--file=<filename>]
	 * : Save to a specific file. If not provided, outputs to stdout
	 *
	 * [--pretty]
	 * : Format JSON with indentation for better readability
	 *
	 * ## EXAMPLES
	 *
	 *     wp rig menu export "Main Menu"
	 *     wp rig menu export "Main Menu" --file=main-menu.json
	 *     wp rig menu export "Main Menu" --file=main-menu.json --pretty
	 *
	 * @param array $args Positional arguments
	 * @param array $assoc_args Associative arguments
	 */
	public function menu_export( $args, $assoc_args ) {
		$menu_name = $args[0];
		$filename = $assoc_args['file'] ?? null;
		$pretty = isset( $assoc_args['pretty'] );

		WP_CLI::log( "Exporting menu: {$menu_name}" );

		// Get menu by name
		$menu = wp_get_nav_menu_object( $menu_name );

		if ( ! $menu ) {
			WP_CLI::error( "Menu '{$menu_name}' not found." );
		}

		// Get all menu items
		$menu_items = wp_get_nav_menu_items( $menu->term_id, array( 'order' => 'ASC' ) );

		if ( ! $menu_items ) {
			WP_CLI::error( "Menu '{$menu_name}' has no items." );
		}

		$exported_data = array(
			'menu_name' => $menu->name,
			'menu_slug' => $menu->slug,
			'menu_description' => $menu->description,
			'menu_items' => array(),
			'export_timestamp' => current_time( 'mysql' ),
			'export_version' => '1.0.0'
		);

		// Process menu items
		foreach ( $menu_items as $item ) {
			$menu_item_data = array(
				'ID' => $item->ID,
				'title' => $item->title,
				'url' => $item->url,
				'menu_order' => $item->menu_order,
				'menu_item_parent' => $item->menu_item_parent,
				'type' => $item->type,
				'object' => $item->object,
				'object_id' => $item->object_id,
				'target' => $item->target,
				'attr_title' => $item->attr_title,
				'description' => $item->description,
				'classes' => $item->classes,
				'xfn' => $item->xfn,
			);

			$exported_data['menu_items'][] = $menu_item_data;
		}

		$json_flags = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;
		if ( $pretty ) {
			$json_flags |= JSON_PRETTY_PRINT;
		}

		$json_output = wp_json_encode( $exported_data, $json_flags );

		if ( false === $json_output ) {
			WP_CLI::error( 'Failed to encode menu data to JSON.' );
		}

		if ( $filename ) {
			$result = file_put_contents( $filename, $json_output );
			if ( false === $result ) {
				WP_CLI::error( "Failed to write to file: {$filename}" );
			}

			WP_CLI::success( "Menu exported to: {$filename}" );
			WP_CLI::log( "Items exported: " . count( $exported_data['menu_items'] ) );
		} else {
			WP_CLI::log( $json_output );
		}
	}

	/**
	 * Import a WordPress menu from JSON format
	 *
	 * ## OPTIONS
	 *
	 * <file>
	 * : Path to the JSON file containing menu data
	 *
	 * [--overwrite]
	 * : Overwrite existing menu with the same name
	 *
	 * [--dry-run]
	 * : Test the import without making changes
	 *
	 * ## EXAMPLES
	 *
	 *     wp rig menu import main-menu.json
	 *     wp rig menu import main-menu.json --overwrite
	 *     wp rig menu import main-menu.json --dry-run
	 *
	 * @param array $args Positional arguments
	 * @param array $assoc_args Associative arguments
	 */
	public function menu_import( $args, $assoc_args ) {
		$filename = $args[0];
		$overwrite = isset( $assoc_args['overwrite'] );
		$dry_run = isset( $assoc_args['dry-run'] );

		if ( ! file_exists( $filename ) ) {
			WP_CLI::error( "File not found: {$filename}" );
		}

		$json_content = file_get_contents( $filename );
		if ( false === $json_content ) {
			WP_CLI::error( "Failed to read file: {$filename}" );
		}

		$menu_data = json_decode( $json_content, true );
		if ( null === $menu_data ) {
			WP_CLI::error( "Invalid JSON format in file: {$filename}" );
		}

		$menu_name = $menu_data['menu_name'] ?? 'Unknown';

		if ( $dry_run ) {
			WP_CLI::log( "DRY RUN: Would import menu: {$menu_name}" );
			WP_CLI::log( "Items to import: " . count( $menu_data['menu_items'] ?? array() ) );

			$existing_menu = wp_get_nav_menu_object( $menu_name );
			if ( $existing_menu && ! $overwrite ) {
				WP_CLI::warning( "Menu '{$menu_name}' already exists. Use --overwrite to replace it." );
			}

			WP_CLI::success( "Dry run completed successfully." );
			return;
		}

		WP_CLI::log( "Importing menu: {$menu_name}" );

		// Handle existing menu
		$existing_menu = wp_get_nav_menu_object( $menu_name );
		if ( $existing_menu ) {
			if ( ! $overwrite ) {
				WP_CLI::error( "Menu '{$menu_name}' already exists. Use --overwrite flag to replace it." );
			}
			wp_delete_nav_menu( $existing_menu->term_id );
		}

		// Create new menu
		$menu_id = wp_create_nav_menu( $menu_name );

		if ( is_wp_error( $menu_id ) ) {
			WP_CLI::error( 'Failed to create menu: ' . $menu_id->get_error_message() );
		}

		// Import menu items
		$items_imported = 0;
		foreach ( $menu_data['menu_items'] as $item_data ) {
			$menu_item_args = array(
				'menu-item-title' => sanitize_text_field( $item_data['title'] ),
				'menu-item-url' => esc_url_raw( $item_data['url'] ),
				'menu-item-status' => 'publish',
				'menu-item-position' => intval( $item_data['menu_order'] ),
				'menu-item-type' => sanitize_text_field( $item_data['type'] ),
				'menu-item-object' => sanitize_text_field( $item_data['object'] ),
				'menu-item-object-id' => intval( $item_data['object_id'] ),
				'menu-item-target' => sanitize_text_field( $item_data['target'] ),
				'menu-item-attr-title' => sanitize_text_field( $item_data['attr_title'] ),
				'menu-item-description' => sanitize_textarea_field( $item_data['description'] ),
				'menu-item-classes' => is_array( $item_data['classes'] ) ? implode( ' ', $item_data['classes'] ) : sanitize_text_field( $item_data['classes'] ),
				'menu-item-xfn' => sanitize_text_field( $item_data['xfn'] ),
			);

			$new_item_id = wp_update_nav_menu_item( $menu_id, 0, $menu_item_args );

			if ( ! is_wp_error( $new_item_id ) ) {
				$items_imported++;
			}
		}

		WP_CLI::success( "Menu '{$menu_name}' imported successfully with {$items_imported} items." );
	}

	/**
	 * List all available WordPress menus
	 *
	 * ## OPTIONS
	 *
	 * [--format=<format>]
	 * : Render output in a particular format
	 * ---
	 * default: table
	 * options:
	 *   - table
	 *   - csv
	 *   - json
	 *   - yaml
	 * ---
	 *
	 * ## EXAMPLES
	 *
	 *     wp rig menu list
	 *     wp rig menu list --format=json
	 *
	 * @param array $args Positional arguments
	 * @param array $assoc_args Associative arguments
	 */
	public function menu_list( $args, $assoc_args ) {
		$menus = wp_get_nav_menus();

		if ( empty( $menus ) ) {
			WP_CLI::log( 'No menus found.' );
			return;
		}

		$format = $assoc_args['format'] ?? 'table';
		$menu_list = array();

		foreach ( $menus as $menu ) {
			$menu_list[] = array(
				'id' => $menu->term_id,
				'name' => $menu->name,
				'slug' => $menu->slug,
				'count' => $menu->count,
				'description' => $menu->description
			);
		}

		WP_CLI\Utils\format_items( $format, $menu_list, array( 'id', 'name', 'slug', 'count', 'description' ) );
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
	 *      $ wp rig fake_menu_items --menu="Main Menu" --items=8 --subitems=4 --depth=3
	 *
	 *      # Create a new menu with dummy items and assign it to primary location
	 *      $ wp rig fake_menu_items --items=6 --depth=2 --prefix="Nav Item" --assign-location=primary
	 *
	 * @return void
	 */
	public function fake_menu_items( $args, $assoc_args ) {
		// Parse parameters with defaults
		$menu           = WP_CLI\Utils\get_flag_value( $assoc_args, 'menu', '' );
		$items_count    = (int) WP_CLI\Utils\get_flag_value( $assoc_args, 'items', 5 );
		$max_depth      = (int) WP_CLI\Utils\get_flag_value( $assoc_args, 'depth', 2 );
		$subitems_count = (int) WP_CLI\Utils\get_flag_value( $assoc_args, 'subitems', 3 );
		$prefix         = WP_CLI\Utils\get_flag_value( $assoc_args, 'prefix', 'Menu Item' );
		$location       = WP_CLI\Utils\get_flag_value( $assoc_args, 'assign-location', '' );

		// Validate parameters.
		$max_depth = min( max( $max_depth, 1 ), 3 ); // Limit depth between 1-3

		// Either get existing menu or create a new one.
		$menu_id = $this->get_or_create_menu( $menu );
		if ( ! $menu_id ) {
			WP_CLI::error( 'Failed to create or find menu.' );
			return;
		}

		$menu_obj  = wp_get_nav_menu_object( $menu_id );
		$menu_name = $menu_obj->name;

		WP_CLI::log( sprintf( 'Generating dummy menu items for menu "%s" (ID: %d)', $menu_name, $menu_id ) );

		// Create top-level items.
		$progress      = \WP_CLI\Utils\make_progress_bar( 'Creating menu items', $items_count );
		$created_count = 0;

		for ( $i = 1; $i <= $items_count; $i++ ) {
			$parent_id = wp_update_nav_menu_item(
				$menu_id,
				0,
				array(
					'menu-item-title'  => $prefix . ' ' . $i,
					'menu-item-url'    => '#',
					'menu-item-status' => 'publish',
				)
			);

			if ( $parent_id && ! is_wp_error( $parent_id ) ) {
				++$created_count;

				// Create submenu items if depth > 1
				if ( 1 < $max_depth ) {
					$this->create_submenu_items( $menu_id, $parent_id, $prefix . ' ' . $i, $subitems_count, $max_depth, 2 );
				}
			}

			$progress->tick();
		}

		$progress->finish();

		// Assign to location if requested.
		if ( ! empty( $location ) ) {
			$locations              = get_theme_mod( 'nav_menu_locations' );
			$locations[ $location ] = $menu_id;
			set_theme_mod( 'nav_menu_locations', $locations );
			WP_CLI::success( sprintf( 'Menu assigned to location: %s', $location ) );
		}

		WP_CLI::success( sprintf( 'Created %d top-level menu items in menu "%s"', $created_count, $menu_name ) );
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
	 * @param int    $menu_id
	 * @param int    $parent_id
	 * @param string $parent_prefix
	 * @param int    $count
	 * @param int    $max_depth
	 * @param int    $current_depth
	 */
	private function create_submenu_items( $menu_id, $parent_id, $parent_prefix, $count, $max_depth, $current_depth ) {
		for ( $j = 1; $j <= $count; $j++ ) {
			$title   = $parent_prefix . '.' . $j;
			$item_id = wp_update_nav_menu_item(
				$menu_id,
				0,
				array(
					'menu-item-title'     => $title,
					'menu-item-url'       => '#',
					'menu-item-parent-id' => $parent_id,
					'menu-item-status'    => 'publish',
				)
			);

			// Add deeper levels if needed and if we haven't reached max depth.
			if ( $item_id && ! is_wp_error( $item_id ) && $current_depth < $max_depth ) {
				// Create fewer items at deeper levels
				$next_level_count = max( 2, intval( $count / 2 ) );
				$this->create_submenu_items( $menu_id, $item_id, $title, $next_level_count, $max_depth, $current_depth + 1 );
			}
		}
	}

	/**
	 * Get existing menu or create a new one
	 *
	 * @param string|int $menu Menu name or ID
	 * @return int|false Menu ID or false on failure
	 */
	private function get_or_create_menu( $menu ) {
		if ( empty( $menu ) ) {
			// Create a new menu
			$menu_name = 'Dummy Menu ' . date( 'Y-m-d H:i:s' );
			$menu_id   = wp_create_nav_menu( $menu_name );
			if ( is_wp_error( $menu_id ) ) {
				WP_CLI::error( $menu_id->get_error_message() );
				return false;
			}
			return $menu_id;
		}

		// Check if menu exists by ID.
		if ( is_numeric( $menu ) ) {
			$menu_obj = wp_get_nav_menu_object( $menu );
			if ( $menu_obj ) {
				return $menu_obj->term_id;
			}
		}

		// Check if menu exists by name.
		$menu_obj = wp_get_nav_menu_object( $menu );
		if ( $menu_obj ) {
			return $menu_obj->term_id;
		}

		// Create a new menu with the given name.
		$menu_id = wp_create_nav_menu( $menu );
		if ( is_wp_error( $menu_id ) ) {
			WP_CLI::error( $menu_id->get_error_message() );
			return false;
		}

		return $menu_id;
	}

	/**
	 * Download Google Fonts declared by the theme into a local directory.
	 *
	 * ## OPTIONS
	 *
	 * [--dir=<dir>]
	 * : Relative directory under the active theme where fonts and CSS will be stored.
	 * ---
	 * default: assets/fonts
	 * ---
	 *
	 * ## EXAMPLES
	 *
	 *     wp rig fonts_download
	 *     wp rig fonts_download --dir=assets/fonts
	 *
	 * @param array $args Positional args.
	 * @param array $assoc_args Associative args.
	 */
	public function fonts_download( $args, $assoc_args ) {
		$font_dir = WP_CLI\Utils\get_flag_value( $assoc_args, 'font-dir', 'assets/fonts' );
		$font_dir = sanitize_text_field( (string) $font_dir );

		$css_dir = WP_CLI\Utils\get_flag_value( $assoc_args, 'css-dir', 'assets/css/src' );
		$css_dir = sanitize_text_field( (string) $css_dir );

		// Instantiate the Fonts component and run the download.
		$component = new \WP_Rig\WP_Rig\Fonts\Component();
		$result = $component->download_all_google_fonts( $font_dir, $css_dir );

		if ( is_wp_error( $result ) ) {
			WP_CLI::error( $result->get_error_message() );
			return;
		}

		WP_CLI::success( sprintf( 'Google Fonts downloaded. CSS saved at: %s', $result ) );
	}
}

WP_CLI::add_command( 'rig', 'Rig_Command' );
