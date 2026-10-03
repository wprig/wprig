<?php
/**
 * WP_Rig\WP_Rig\Tests\Unit\Paradigm\Paradigm_Test class
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig\Tests\Unit\Paradigm;

use WP_Rig\WP_Rig\Tests\Framework\Unit_Test_Case;
use Brain\Monkey\Functions;
use WP_Rig\WP_Rig\Paradigm;

/**
 * Class unit-testing the paradigm resolution system.
 *
 * @group paradigm
 */
class Paradigm_Test extends Unit_Test_Case {

	/**
	 * Sets the active theme type in the (mocked) theme config.
	 *
	 * @param string $theme_type Active theme type.
	 */
	private function setThemeType( string $theme_type ): void {
		Functions\when( 'WP_Rig\WP_Rig\get_config' )->justReturn(
			array(
				'theme' => array(
					'themeType' => $theme_type,
				),
			)
		);
	}

	/**
	 * Tests that the tag matrix is loaded from the real paradigms.json file.
	 *
	 * @covers \WP_Rig\WP_Rig\Paradigm::get_definitions()
	 */
	public function test_get_definitions_reads_the_shared_matrix() {
		$definitions = Paradigm::get_definitions();

		$this->assertArrayHasKey( 'themeTypes', $definitions );
		$this->assertArrayHasKey( 'tags', $definitions );

		$this->assertSame(
			array( 'classic', 'universal', 'block-based' ),
			$definitions['tags']['all']
		);
		$this->assertSame( array( 'classic', 'universal' ), $definitions['tags']['classic'] );
		$this->assertSame( array( 'universal' ), $definitions['tags']['universal'] );
		$this->assertSame(
			array( 'universal', 'block-based' ),
			$definitions['tags']['block-based']
		);
	}

	/**
	 * Tests classic theme type resolution.
	 *
	 * @covers \WP_Rig\WP_Rig\Paradigm::get_active_theme_type()
	 * @covers \WP_Rig\WP_Rig\Paradigm::is_enabled()
	 */
	public function test_classic_theme_type() {
		$this->setThemeType( 'classic' );

		$this->assertSame( 'classic', Paradigm::get_active_theme_type() );
		$this->assertTrue( Paradigm::is_enabled( 'all' ) );
		$this->assertTrue( Paradigm::is_enabled( 'classic' ) );
		$this->assertFalse( Paradigm::is_enabled( 'universal' ) );
		$this->assertFalse( Paradigm::is_enabled( 'block-based' ) );
	}

	/**
	 * Tests universal theme type resolution (hybrid includes blocks).
	 *
	 * @covers \WP_Rig\WP_Rig\Paradigm::get_active_theme_type()
	 * @covers \WP_Rig\WP_Rig\Paradigm::is_enabled()
	 */
	public function test_universal_theme_type() {
		$this->setThemeType( 'universal' );

		$this->assertSame( 'universal', Paradigm::get_active_theme_type() );
		$this->assertTrue( Paradigm::is_enabled( 'all' ) );
		$this->assertTrue( Paradigm::is_enabled( 'classic' ) );
		$this->assertTrue( Paradigm::is_enabled( 'universal' ) );
		$this->assertTrue( Paradigm::is_enabled( 'block-based' ) );
	}

	/**
	 * Tests block-based theme type resolution (classic features are gated out).
	 *
	 * @covers \WP_Rig\WP_Rig\Paradigm::get_active_theme_type()
	 * @covers \WP_Rig\WP_Rig\Paradigm::is_enabled()
	 */
	public function test_block_based_theme_type() {
		$this->setThemeType( 'block-based' );

		$this->assertSame( 'block-based', Paradigm::get_active_theme_type() );
		$this->assertTrue( Paradigm::is_enabled( 'all' ) );
		$this->assertFalse( Paradigm::is_enabled( 'classic' ) );
		$this->assertFalse( Paradigm::is_enabled( 'universal' ) );
		$this->assertTrue( Paradigm::is_enabled( 'block-based' ) );
	}

	/**
	 * Tests that an invalid theme type fails fast.
	 *
	 * @covers \WP_Rig\WP_Rig\Paradigm::get_active_theme_type()
	 */
	public function test_invalid_theme_type_fails_fast() {
		$this->setThemeType( 'bogus' );

		$this->expectException( \RuntimeException::class );
		$this->expectExceptionMessage( 'Invalid theme.themeType "bogus"' );

		Paradigm::get_active_theme_type();
	}

	/**
	 * Tests that an unknown tag fails fast.
	 *
	 * @covers \WP_Rig\WP_Rig\Paradigm::is_enabled()
	 */
	public function test_unknown_tag_fails_fast() {
		$this->setThemeType( 'classic' );

		$this->expectException( \RuntimeException::class );
		$this->expectExceptionMessage( 'Unknown paradigm tag "bogus-tag"' );

		Paradigm::is_enabled( 'bogus-tag' );
	}
}
