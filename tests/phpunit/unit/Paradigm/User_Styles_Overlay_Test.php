<?php
/**
 * WP_Rig\WP_Rig\Tests\Unit\Paradigm\User_Styles_Overlay_Test class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Tests\Unit\Paradigm;

use WP_Rig\WP_Rig\Tests\Framework\Unit_Test_Case;
use RecursiveIteratorIterator;
use RecursiveDirectoryIterator;
use FilesystemIterator;

/**
 * Verifies that the PHP runtime is overlay-blind (SPEC-016 §5.10).
 *
 * The config/user-styles.json file is a BUILD-TIME-ONLY input: it is read
 * by the Node tokens generator (scripts/tasks/tokens.js) when regenerating
 * theme.json. No shipped PHP may ever read it — the production bundle runs
 * with the merged theme.json and no config directory.
 *
 * @group paradigm
 */
class User_Styles_Overlay_Test extends Unit_Test_Case {

	/**
	 * Asserts that no shipped PHP file references the user-styles overlay.
	 *
	 * @coversNothing
	 */
	public function test_php_runtime_is_overlay_blind() {
		$theme_root = dirname( __DIR__, 3 );
		$offenses   = array();

		$directories = array( 'inc', 'template-parts', 'page-templates' );

		foreach ( $directories as $directory ) {
			$path = $theme_root . '/' . $directory;

			if ( ! is_dir( $path ) ) {
				continue;
			}

			$iterator = new RecursiveIteratorIterator(
				new RecursiveDirectoryIterator(
					$path,
					FilesystemIterator::CURRENT_AS_FILEINFO
				)
			);

			foreach ( $iterator as $file ) {
				if (
					$file->isFile()
					&& 'php' === $file->getExtension()
					&& ! str_starts_with( $file->getFilename(), '.' )
				) {
					$this->assert_overlay_absent( $file->getPathname(), $offenses );
				}
			}
		}

		foreach ( glob( $theme_root . '/*.php' ) as $file ) {
			$this->assert_overlay_absent( $file, $offenses );
		}

		$this->assertSame(
			array(),
			$offenses,
			'Shipped PHP must never read config/user-styles.json (build-time only, SPEC-016 §5.10). Offenders: ' . implode( ', ', $offenses )
		);
	}

	/**
	 * Records a file as an offense when it references the overlay.
	 *
	 * @param string   $file     File path.
	 * @param string[] $offenses Offense accumulator (by reference).
	 */
	private function assert_overlay_absent( string $file, array &$offenses ): void {
		$contents = file_get_contents( $file );

		if ( false === $contents ) {
			return;
		}

		if ( false !== strpos( $contents, 'user-styles.json' ) ) {
			$offenses[] = $file;
		}
	}
}
