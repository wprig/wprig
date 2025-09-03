#!/usr/bin/env php
<?php
/**
 * Cross-platform WordPress test environment setup script
 * Works on Windows, macOS, Linux, and CI environments
 *
 * @package wp_rig
 */

class WP_Test_Setup {

	private $db_name;
	private $db_user;
	private $db_pass;
	private $db_host;
	private $wp_version;
	private $wp_tests_dir;
	private $wp_core_dir;

	public function __construct() {
		// Get environment variables or use defaults
		$this->db_name    = getenv( 'WP_TESTS_DB_NAME' ) ?: 'wprig_test';
		$this->db_user    = getenv( 'WP_TESTS_DB_USER' ) ?: 'root';
		$this->db_pass    = getenv( 'WP_TESTS_DB_PASS' ) ?: '';
		$this->db_host    = getenv( 'WP_TESTS_DB_HOST' ) ?: 'localhost';
		$this->wp_version = getenv( 'WP_VERSION' ) ?: 'latest';

		// Use a more reliable temp directory approach for Windows
		if ( PHP_OS_FAMILY === 'Windows' ) {
			// Use the actual system temp directory and get the real path
			$system_temp = sys_get_temp_dir();
			$real_temp   = realpath( $system_temp );

			echo "System temp: {$system_temp}\n";
			echo "Real temp: {$real_temp}\n";

			// Create a subfolder in temp to avoid conflicts
			$this->wp_tests_dir = $real_temp . DIRECTORY_SEPARATOR . 'wprig-tests' . DIRECTORY_SEPARATOR . 'wordpress-tests-lib';
			$this->wp_core_dir  = $real_temp . DIRECTORY_SEPARATOR . 'wprig-tests' . DIRECTORY_SEPARATOR . 'WordPress';
		} else {
			$this->wp_tests_dir = getenv( 'WP_TESTS_DIR' ) ?: '/tmp/wordpress-tests-lib';
			$this->wp_core_dir  = getenv( 'WP_CORE_DIR' ) ?: '/tmp/wordpress';
		}

		// Don't normalize paths yet - just ensure they're consistent
		$this->wp_tests_dir = str_replace( array( '/', '\\' ), DIRECTORY_SEPARATOR, $this->wp_tests_dir );
		$this->wp_core_dir  = str_replace( array( '/', '\\' ), DIRECTORY_SEPARATOR, $this->wp_core_dir );
	}

	public function setup() {
		echo "Setting up WordPress test environment...\n";
		echo 'OS: ' . PHP_OS_FAMILY . "\n";
		echo "DB: {$this->db_name} @ {$this->db_host}\n";
		echo "WP Version: {$this->wp_version}\n";
		echo "Tests Dir: {$this->wp_tests_dir}\n";
		echo "Core Dir: {$this->wp_core_dir}\n\n";

		// Use real MySQL database
		echo "Using MySQL database for testing\n";

		$this->download_wordpress();
		$this->download_test_suite();
		$this->create_wp_config();

		echo "\n✅ WordPress test environment ready!\n";
		echo "WP_TESTS_DIR: {$this->wp_tests_dir}\n";
		echo "WP_CORE_DIR: {$this->wp_core_dir}\n";
	}

	private function download_wordpress() {
		if ( is_dir( $this->wp_core_dir ) && file_exists( $this->wp_core_dir . DIRECTORY_SEPARATOR . 'wp-config-sample.php' ) ) {
			echo "WordPress core already exists at {$this->wp_core_dir}\n";
			return;
		}

		echo "Downloading WordPress {$this->wp_version}...\n";

		// Create parent directory first
		$parent_dir = dirname( $this->wp_core_dir );
		$this->create_directory( $parent_dir );

		if ( 'latest' === $this->wp_version ) {
			$download_url = 'https://wordpress.org/latest.tar.gz';
		} else {
			$download_url = "https://wordpress.org/wordpress-{$this->wp_version}.tar.gz";
		}

		$this->download_and_extract( $download_url, $parent_dir, 'WordPress' );
	}

	private function download_test_suite() {
		if ( is_dir( $this->wp_tests_dir ) && file_exists( $this->wp_tests_dir . DIRECTORY_SEPARATOR . 'includes' . DIRECTORY_SEPARATOR . 'bootstrap.php' ) ) {
			echo "WordPress test suite already exists at {$this->wp_tests_dir}\n";
			return;
		}

		echo "Downloading WordPress test suite...\n";

		$this->create_directory( $this->wp_tests_dir );

		// Download the entire test suite using SVN export if available, otherwise download manually
		if ( $this->command_exists( 'svn' ) ) {
			$this->download_test_suite_with_svn();
		} else {
			// Download manually with a more complete file list
			$this->download_test_files_manually();
		}
	}

	private function download_test_suite_with_svn() {
		$test_suite_url = 'https://develop.svn.wordpress.org/trunk/tests/phpunit/';
		$cmd            = "svn export \"{$test_suite_url}\" \"{$this->wp_tests_dir}\" --force";

		echo "Running: {$cmd}\n";
		exec( $cmd, $output, $return_code );

		if ( 0 !== $return_code ) {
			echo "SVN export failed, falling back to manual download\n";
			$this->download_test_files_manually();
		} else {
			echo "Successfully downloaded test suite with SVN\n";
		}
	}

	private function download_test_files_manually() {
		// More comprehensive list of test files
		$files = array(
			'includes/bootstrap.php',
			'includes/functions.php',
			'includes/testcase.php',
			'includes/factory.php',
			'includes/install.php',
			'includes/utils.php',
			'includes/exceptions.php',
			'includes/class-basic-object.php',
			'includes/class-basic-subclass.php',
			'includes/class-wp-die-exception.php',
			'includes/class-wp-fake-block-type.php',
			'includes/class-wp-image-editor-mock.php',
			'includes/class-wp-rest-test-controller.php',
			'includes/class-wp-rest-test-search-handler.php',
			'includes/class-wp-test-spy-rest-server.php',
			'includes/class-wp-xmlrpc-server.php',
			'includes/mock-image-editor.php',
			'includes/mock-mailer.php',
			'includes/spy-rest-server.php',
			'includes/speed-trap-listener.php',
			'includes/class-wp-rest-test-configurable-controller.php',
		);

		$base_url = 'https://develop.svn.wordpress.org/trunk/tests/phpunit/';

		foreach ( $files as $file ) {
			$url        = $base_url . $file;
			$local_path = $this->wp_tests_dir . DIRECTORY_SEPARATOR . str_replace( '/', DIRECTORY_SEPARATOR, $file );

			$this->create_directory( dirname( $local_path ) );
			echo "Downloading {$file}...\n";

			$max_retries = 3;
			$success     = false;

			for ( $i = 0; $i < $max_retries && ! $success; $i++ ) {
				if ( 0 < $i ) {
					echo "  Retry {$i}...\n";
					sleep( 1 );
				}
				$success = $this->download_file( $url, $local_path );
			}

			if ( ! $success ) {
				echo "⚠️  Failed to download {$file} after {$max_retries} attempts\n";
			}
		}

		// Also download data files that might be needed
		$data_files = array(
			'data/plugins/wordpress-importer/wordpress-importer.php',
			'data/plugins/hello.php',
			'data/themedir1/default/index.php',
			'data/formatting/entities.txt',
			'data/formatting/utf-8.txt',
		);

		foreach ( $data_files as $file ) {
			$url        = $base_url . $file;
			$local_path = $this->wp_tests_dir . DIRECTORY_SEPARATOR . str_replace( '/', DIRECTORY_SEPARATOR, $file );

			$this->create_directory( dirname( $local_path ) );
			echo "Downloading data file {$file}...\n";

			if ( ! $this->download_file( $url, $local_path ) ) {
				echo "⚠️  Failed to download data file {$file} (this may not be critical)\n";
			}
		}
	}

	private function command_exists( $command ) {
		$whereIsCommand = ( PHP_OS_FAMILY === 'Windows' ) ? 'where' : 'which';
		$process        = proc_open(
			"$whereIsCommand $command",
			array(
				0 => array( 'pipe', 'r' ), // stdin
				1 => array( 'pipe', 'w' ), // stdout
				2 => array( 'pipe', 'w' ), // stderr
			),
			$pipes
		);
		if ( false !== $process ) {
			$stdout = stream_get_contents( $pipes[1] );
			$stderr = stream_get_contents( $pipes[2] );
			fclose( $pipes[1] );
			fclose( $pipes[2] );
			$returnCode = proc_close( $process );
			return 0 === $returnCode;
		}
		return false;
	}

	private function create_wp_config() {
		$config_path = $this->wp_tests_dir . DIRECTORY_SEPARATOR . 'wp-tests-config.php';

		if ( file_exists( $config_path ) ) {
			echo "wp-tests-config.php already exists\n";
			return;
		}

		echo "Creating wp-tests-config.php at: {$config_path}\n";

		$config_content = $this->get_wp_config_template();
		if ( false === file_put_contents( $config_path, $config_content ) ) {
			throw new Exception( 'Failed to create wp-tests-config.php' );
		}

		echo "✅ Created wp-tests-config.php\n";

		// Verify the file was created correctly
		if ( file_exists( $config_path ) ) {
			$size = filesize( $config_path );
			echo "Config file size: {$size} bytes\n";
		}
	}

	private function get_wp_config_template() {
		// Wait until WordPress core is actually downloaded
		if ( ! is_dir( $this->wp_core_dir ) ) {
			throw new Exception( "WordPress core directory does not exist: {$this->wp_core_dir}" );
		}

		// Use the actual path with proper directory separators
		$abspath = $this->wp_core_dir . DIRECTORY_SEPARATOR;

		// For PHP strings, we need to escape backslashes on Windows
		$abspath_escaped = str_replace( '\\', '\\\\', $abspath );

		return "<?php
/* WordPress test configuration */

// ** Database settings ** //
define( 'DB_NAME', '{$this->db_name}' );
define( 'DB_USER', '{$this->db_user}' );
define( 'DB_PASSWORD', '{$this->db_pass}' );
define( 'DB_HOST', '{$this->db_host}' );
define( 'DB_CHARSET', 'utf8' );
define( 'DB_COLLATE', '' );

// ** Test-specific settings ** //
define( 'WP_TESTS_DOMAIN', 'example.org' );
define( 'WP_TESTS_EMAIL', 'admin@example.org' );
define( 'WP_TESTS_TITLE', 'Test Blog' );

define( 'WP_PHP_BINARY', 'php' );
define( 'WPLANG', '' );
define( 'WP_DEBUG', true );

// ** Allow database installation for testing ** //
define( 'WP_TESTS_SKIP_INSTALL', false );

// ** WordPress path ** //
// Point to our downloaded WordPress core
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', '{$abspath_escaped}' );
}

// ** Table prefix ** //
\$table_prefix = 'wptests_';

// ** Security keys ** //
define( 'AUTH_KEY',         'put your unique phrase here' );
define( 'SECURE_AUTH_KEY',  'put your unique phrase here' );
define( 'LOGGED_IN_KEY',    'put your unique phrase here' );
define( 'NONCE_KEY',        'put your unique phrase here' );
define( 'AUTH_SALT',        'put your unique phrase here' );
define( 'SECURE_AUTH_SALT', 'put your unique phrase here' );
define( 'LOGGED_IN_SALT',   'put your unique phrase here' );
define( 'NONCE_SALT',       'put your unique phrase here' );
";
	}

	// Utility methods
	private function create_directory( $path ) {
		if ( ! is_dir( $path ) ) {
			echo "Creating directory: {$path}\n";
			if ( ! mkdir( $path, 0755, true ) ) {
				throw new Exception( "Failed to create directory: {$path}" );
			}
		}
	}

	private function download_and_extract( $url, $extract_to, $expected_folder = null ) {
		$temp_file = tempnam( sys_get_temp_dir(), 'wp_download' );

		if ( $this->download_file( $url, $temp_file ) ) {
			$this->extract_tar_gz( $temp_file, $extract_to, $expected_folder );
			unlink( $temp_file );
		} else {
			throw new Exception( "Failed to download {$url}" );
		}
	}

	private function download_file( $url, $local_path ) {
		echo "Downloading: {$url}\n";

		if ( function_exists( 'curl_init' ) ) {
			return $this->download_with_curl( $url, $local_path );
		} else {
			return $this->download_with_file_get_contents( $url, $local_path );
		}
	}

	private function download_with_curl( $url, $local_path ) {
		$ch = curl_init( $url );
		$fp = fopen( $local_path, 'w' );

		if ( ! $fp ) {
			curl_close( $ch );
			return false;
		}

		curl_setopt( $ch, CURLOPT_FILE, $fp );
		curl_setopt( $ch, CURLOPT_FOLLOWLOCATION, true );
		curl_setopt( $ch, CURLOPT_TIMEOUT, 300 );
		curl_setopt( $ch, CURLOPT_SSL_VERIFYPEER, false );
		curl_setopt( $ch, CURLOPT_USERAGENT, 'WP-Rig Test Setup' );

		$result    = curl_exec( $ch );
		$http_code = curl_getinfo( $ch, CURLINFO_HTTP_CODE );
		curl_close( $ch );
		fclose( $fp );

		if ( false === $result || 200 !== $http_code ) {
			if ( file_exists( $local_path ) ) {
				unlink( $local_path );
			}
			return false;
		}

		return true;
	}

	private function download_with_file_get_contents( $url, $local_path ) {
		$context = stream_context_create(
			array(
				'http' => array(
					'timeout'    => 300,
					'user_agent' => 'WP-Rig Test Setup',
				),
				'ssl' => array(
					'verify_peer'      => false,
					'verify_peer_name' => false,
				),
			)
		);

		$content = file_get_contents( $url, false, $context );
		if ( false !== $content ) {
			return false !== file_put_contents( $local_path, $content );
		}
		return false;
	}

	private function extract_tar_gz( $tar_file, $extract_to, $expected_folder = null ) {
		echo "Extracting archive to: {$extract_to}\n";

		if ( class_exists( 'PharData' ) ) {
			try {
				$phar = new PharData( $tar_file );
				$phar->extractTo( $extract_to );

				// If there's an expected folder (like 'WordPress'), move contents up
				if ( $expected_folder ) {
					$extracted_path = $extract_to . DIRECTORY_SEPARATOR . $expected_folder;
					$target_path    = $this->wp_core_dir;

					echo "Moving from {$extracted_path} to {$target_path}\n";

					if ( is_dir( $extracted_path ) && $extracted_path !== $target_path ) {
						// Ensure target directory exists
						$this->create_directory( $target_path );

						// Move all contents
						$this->move_directory_contents( $extracted_path, $target_path );

						// Clean up the temporary extracted folder
						$this->remove_directory( $extracted_path );
					}
				}
			} catch ( Exception $e ) {
				throw new Exception( 'Failed to extract archive: ' . $e->getMessage() );
			}
		} else {
			throw new Exception( 'PharData class not available for extraction' );
		}
	}

	private function move_directory_contents( $source, $target ) {
		if ( ! is_dir( $target ) ) {
			mkdir( $target, 0755, true );
		}

		$iterator = new RecursiveIteratorIterator(
			new RecursiveDirectoryIterator( $source, RecursiveDirectoryIterator::SKIP_DOTS ),
			RecursiveIteratorIterator::SELF_FIRST
		);

		foreach ( $iterator as $item ) {
			$target_path = $target . DIRECTORY_SEPARATOR . $iterator->getSubPathName();
			if ( $item->isDir() ) {
				if ( ! is_dir( $target_path ) ) {
					mkdir( $target_path, 0755, true );
				}
			} elseif ( ! copy( $item, $target_path ) ) {
					throw new Exception( "Failed to copy {$item} to {$target_path}" );
			}
		}
	}

	private function remove_directory( $dir ) {
		if ( ! is_dir( $dir ) ) {
			return;
		}

		$iterator = new RecursiveIteratorIterator(
			new RecursiveDirectoryIterator( $dir, RecursiveDirectoryIterator::SKIP_DOTS ),
			RecursiveIteratorIterator::CHILD_FIRST
		);

		foreach ( $iterator as $item ) {
			if ( $item->isDir() ) {
				rmdir( $item );
			} else {
				unlink( $item );
			}
		}
		rmdir( $dir );
	}
}

// Run the setup
try {
	// Create the WP_Test_Setup instance
	$setup = new WP_Test_Setup();

	// Run the setup with additional error handling
	echo "Starting WordPress test environment setup...\n";
	$setup->setup();

	// Verify the test environment was created successfully
	$test_dir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'wprig-tests' . DIRECTORY_SEPARATOR . 'wordpress-tests-lib';
	$test_dir = str_replace( array( '/', '\\' ), DIRECTORY_SEPARATOR, $test_dir );

	if ( file_exists( $test_dir . DIRECTORY_SEPARATOR . 'includes' . DIRECTORY_SEPARATOR . 'bootstrap.php' ) ) {
		echo "✅ Test environment verified at: {$test_dir}\n";

		// Create a marker file to indicate successful setup
		$marker_file = __DIR__ . DIRECTORY_SEPARATOR . '.wp-tests-setup-complete';
		file_put_contents( $marker_file, date( 'Y-m-d H:i:s' ) );
		echo "✅ Created setup marker file: {$marker_file}\n";
	} else {
		echo "⚠️ Test environment not found at expected location: {$test_dir}\n";
		echo "Please check the logs for errors.\n";
	}
} catch ( Exception $e ) {
	echo '❌ Error: ' . $e->getMessage() . "\n";
	echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
	exit( 1 );
}
