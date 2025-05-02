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
}

WP_CLI::add_command( 'rig', 'Rig_Command' );
