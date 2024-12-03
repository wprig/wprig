<?php
if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	return;
}

WP_CLI::add_command( 'rig', function() {
	WP_CLI::success( 'This is a custom WP CLI command!' );
} );
