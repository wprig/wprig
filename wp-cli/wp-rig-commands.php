<?php

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	return;
}

/**
 * Class Rig_Command to handle 'wp rig' subcommands
 */
class Rig_Command extends WP_CLI_Command {

	/**
	 * Subcommand 'wp rig hello'
	 */
	public function dev_setup( $args, $assoc_args ) {
		$curated_plugins = [
			'fakerpress',
			'theme-check',
			'query-monitor',
			'accessibility-checker',
			'autodescription'
		];
		foreach($curated_plugins as $curated_plugin){
			WP_CLI::runcommand( 'plugin install '.$curated_plugin.' --activate', [
				'exit_error' => false, // Prevent WP-CLI from exiting on error, allowing further handling if needed
			] );
		}

		// Ensure the 'Home' page exists
		$home_page_id = $this->get_or_create_page( 'Home', 'Welcome to our website!' );

		// Ensure the 'Blog' page exists
		$blog_page_id = $this->get_or_create_page( 'Blog', '' );

		// Set the static front page and posts page
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $home_page_id );
		update_option( 'page_for_posts', $blog_page_id );

		WP_CLI::success( 'Development setup completed!' );
	}

	/**
	 * Helper function to get or create a page by title.
	 */
	private function get_or_create_page( $title, $content ) {
		$query = new WP_Query( [
			'post_type'   => 'page',
			'title'       => $title,
			'post_status' => 'publish',
		] );

		if ( $query->have_posts() ) {
			$page = $query->posts[0];
			return $page->ID;
		} else {
			return wp_insert_post( [
				'post_title'   => $title,
				'post_content' => $content,
				'post_status'  => 'publish',
				'post_type'    => 'page'
			] );
		}
	}
}

WP_CLI::add_command( 'rig', 'Rig_Command' );
