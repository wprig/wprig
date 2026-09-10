/**
 * End-to-end tests for the Node port of wp-theme-control (bin/wp-theme-control/).
 *
 * Ported from the upstream Bash suite (tests/run.sh, upstream SHA
 * 0820d96567a912320df7b1cdc102605376a69edf) against the fake WP-CLI fixture
 * in bin/wp-theme-control/tests/fake-bin/wp. WP Rig fork assertions
 * (config/user-styles.json overlay, SPEC-016) replace the upstream
 * theme.json assertions.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );

const toolRoot = path.resolve( __dirname, '../../bin/wp-theme-control' );
const fixtureBin = path.join( toolRoot, 'tests', 'fake-bin' );

const THEME_JSON = JSON.stringify( {
	version: 3,
	settings: {
		typography: {
			fontFamilies: [
				{
					name: 'Inter',
					slug: 'inter',
					fontFamily: 'Inter',
					fontFace: [
						{
							src: [
								'file:./assets/fonts/inter/inter-variable.woff2',
							],
							fontWeight: '100 900',
							fontStyle: 'normal',
							fontFamily: 'Inter',
						},
					],
				},
				{
					name: 'Theme Serif',
					slug: 'theme-serif',
					fontFamily: 'Theme Serif',
					fontFace: [
						{
							src: [
								'file:./assets/fonts/theme-serif/theme-serif.woff2',
							],
							fontWeight: '400',
							fontStyle: 'normal',
							fontFamily: 'Theme Serif',
						},
					],
				},
			],
		},
	},
} );

function makeFixture() {
	const testDir = fs.mkdtempSync( path.join( os.tmpdir(), 'wtc-e2e-' ) );
	const themeDir = path.join( testDir, 'theme' );
	const fontDir = path.join( testDir, 'uploads', 'fonts' );
	fs.mkdirSync( path.join( themeDir, 'assets', 'fonts', 'inter' ), {
		recursive: true,
	} );
	fs.mkdirSync( path.join( themeDir, 'assets', 'fonts', 'theme-serif' ), {
		recursive: true,
	} );
	fs.mkdirSync( fontDir, { recursive: true } );
	fs.writeFileSync(
		path.join(
			themeDir,
			'assets',
			'fonts',
			'inter',
			'inter-variable.woff2'
		),
		'wOF2existing'
	);
	fs.writeFileSync(
		path.join(
			themeDir,
			'assets',
			'fonts',
			'theme-serif',
			'theme-serif.woff2'
		),
		'wOF2serif'
	);
	fs.writeFileSync( path.join( fontDir, 'inter-300.woff2' ), 'wOF2custom' );
	fs.writeFileSync( path.join( themeDir, 'theme.json' ), THEME_JSON );
	fs.writeFileSync( path.join( testDir, 'wp.log' ), '' );

	return {
		testDir,
		themeDir,
		logPath: path.join( testDir, 'wp.log' ),
		overlayPath: path.join( themeDir, 'config', 'user-styles.json' ),
		stateDir: path.join( testDir, 'state' ),
	};
}

function runScope( fixture, scope, extraArgs = [], extraEnv = {} ) {
	return spawnSync(
		process.execPath,
		[ path.join( toolRoot, 'index.js' ), scope, ...extraArgs ],
		{
			encoding: 'utf8',
			env: {
				...process.env,
				...extraEnv,
				FAKE_THEME_DIR: fixture.themeDir,
				FAKE_LOG: fixture.logPath,
				FAKE_FONT_DIR: path.join( fixture.testDir, 'uploads', 'fonts' ),
				FAKE_SITE_URL: 'http://example.test',
				FAKE_UPLOAD_BASE_URL: 'http://example.test/wp-content/uploads',
				FAKE_THEME_BASE_URL:
					'http://localhost:8886/wp-content/themes/test-theme',
				PATH: `${ fixtureBin }${ path.delimiter }${ process.env.PATH }`,
			},
		}
	);
}

function manifests( fixture ) {
	const runsDir = path.join( fixture.stateDir, 'runs' );
	if ( ! fs.existsSync( runsDir ) ) {
		return [];
	}
	return fs
		.readdirSync( runsDir )
		.map( ( name ) => path.join( runsDir, name, 'manifest.tsv' ) )
		.filter( ( file ) => fs.existsSync( file ) );
}

describe( 'wp-theme-control Node port — full bake round-trip', () => {
	let fixture;

	beforeAll( () => {
		fixture = makeFixture();

		// plan (read-only inventory)
		const plan = runScope( fixture, 'plan', [
			`--path=${ fixture.testDir }/wordpress`,
		] );
		expect( plan.status ).toBe( 0 );
		expect( plan.stdout ).toContain( 'custom templates and parts: 2' );
		expect( plan.stdout ).toContain( 'unsynced user-created patterns: 1' );

		// all: fonts → templates → styles → patterns
		const all = runScope( fixture, 'all', [
			`--path=${ fixture.testDir }/wordpress`,
			`--state-dir=${ fixture.stateDir }`,
		] );
		expect( all.status ).toBe( 0 );
	} );

	test( 'fonts scope wrote the overlay fonts block and the asset file', () => {
		const overlay = JSON.parse(
			fs.readFileSync( fixture.overlayPath, 'utf8' )
		);

		const inter = overlay.fonts.themeFamilies.find(
			( family ) => family.slug === 'inter'
		);
		expect( inter.fontFace[ 0 ].src[ 0 ] ).toBe(
			'file:./assets/fonts/inter/inter-variable.woff2'
		);
		const themeSerif = overlay.fonts.themeFamilies.find(
			( family ) => family.slug === 'theme-serif'
		);
		expect( themeSerif.fontFace[ 0 ].src[ 0 ] ).toBe(
			'file:./assets/fonts/theme-serif/theme-serif.woff2'
		);
		expect( overlay.fonts.customFamilies[ 0 ].slug ).toBe( 'inter' );
		expect( overlay.fonts.customFamilies[ 0 ].fontFace[ 0 ].src[ 0 ] ).toBe(
			'file:./assets/fonts/inter/inter-300-normal.woff2'
		);
		// After a full bake the settings/styles blocks hold the styles capture
		// (asserted below); the fonts block is the fonts run's payload.
		expect( overlay.fonts ).toBeDefined();
		expect( Object.keys( overlay.fonts ) ).toEqual( [
			'themeFamilies',
			'customFamilies',
		] );
		expect(
			fs.existsSync(
				path.join(
					fixture.themeDir,
					'assets',
					'fonts',
					'inter',
					'inter-300-normal.woff2'
				)
			)
		).toBe( true );
	} );

	test( 'templates scope patternized the runtime-URL template and exported the part', () => {
		const home = fs.readFileSync(
			path.join( fixture.themeDir, 'templates', 'home.html' ),
			'utf8'
		);
		expect( home ).toContain(
			'<!-- wp:pattern {"slug":"test-theme/hidden-template-home"} /-->'
		);
		const header = fs.readFileSync(
			path.join( fixture.themeDir, 'parts', 'header.html' ),
			'utf8'
		);
		expect( header ).toContain( '<!-- wp:site-title /-->' );

		const hiddenPattern = fs.readFileSync(
			path.join(
				fixture.themeDir,
				'patterns',
				'hidden-template-home.php'
			),
			'utf8'
		);
		expect( hiddenPattern ).toContain( 'Inserter: no' );
		expect( hiddenPattern ).toContain( 'wp_get_upload_dir()["baseurl"]' );
		expect( hiddenPattern ).toContain( 'home_url()' );
		expect( hiddenPattern ).toContain( '"id":77' );
		expect( hiddenPattern ).toContain( 'data-object-id="77"' );
		expect( hiddenPattern ).not.toContain( 'http://example.test' );
	} );

	test( 'styles scope captured the raw user Global Styles over the fonts block', () => {
		const overlay = JSON.parse(
			fs.readFileSync( fixture.overlayPath, 'utf8' )
		);
		expect( overlay.settings.color.custom ).toBe( false );
		expect( overlay.styles.color.text ).toBe( '#111111' );
		expect( overlay.fonts.customFamilies[ 0 ].fontFace[ 0 ].src[ 0 ] ).toBe(
			'file:./assets/fonts/inter/inter-300-normal.woff2'
		);
		expect( overlay.fonts.themeFamilies ).toHaveLength( 2 );
		expect( overlay.globalStylesPostId ).toBe( 301 );
	} );

	test( 'patterns scope exported the unsynced pattern with rewrites', () => {
		const pattern = fs.readFileSync(
			path.join( fixture.themeDir, 'patterns', 'welcome-banner.php' ),
			'utf8'
		);
		expect( pattern ).toContain( 'Slug: test-theme/welcome-banner' );
		expect( pattern ).toContain( 'wp_get_upload_dir()["baseurl"]' );
		expect( pattern ).toContain( 'get_stylesheet_directory_uri()' );
		expect( pattern ).toContain( 'home_url()' );
		expect( pattern ).toContain( '"id":88' );
		expect( pattern ).toContain( 'wp-image-88' );
		expect( pattern ).not.toContain( 'http://example.test' );
		expect( pattern ).not.toContain( 'http://localhost:8886' );
	} );

	test( 'run manifest count is 4 (fonts, templates, styles, patterns)', () => {
		expect( manifests( fixture ) ).toHaveLength( 4 );
	} );

	test( 'clean removes DB records and the overlay, retains font assets', () => {
		for ( const manifest of manifests( fixture ) ) {
			const result = runScope( fixture, 'clean', [
				manifest,
				`--path=${ fixture.testDir }/wordpress`,
			] );
			expect( result.status ).toBe( 0 );
		}

		const log = fs.readFileSync( fixture.logPath, 'utf8' );
		expect( log ).toContain( '101' );
		expect( log ).toContain( '102' );
		expect( log ).toContain( '201' );
		expect( fs.existsSync( fixture.overlayPath ) ).toBe( false );

		// Font asset files are retained (upstream recoverability rule).
		expect(
			fs.existsSync(
				path.join(
					fixture.themeDir,
					'assets',
					'fonts',
					'inter',
					'inter-300-normal.woff2'
				)
			)
		).toBe( true );
	} );
} );

describe( 'wp-theme-control Node port — WP-CLI 2.x template export fallback', () => {
	test( 'templates scope works without the WP-CLI 3.0 block command (post content fallback)', () => {
		const fixture = makeFixture();

		const result = runScope(
			fixture,
			'templates',
			[
				`--path=${ fixture.testDir }/wordpress`,
				`--state-dir=${ fixture.stateDir }`,
			],
			{ FAKE_NO_BLOCK_COMMAND: '1' }
		);

		expect( result.status ).toBe( 0 );
		expect( result.stdout ).toContain(
			'falling back to reading the template post content directly'
		);

		const home = fs.readFileSync(
			path.join( fixture.themeDir, 'templates', 'home.html' ),
			'utf8'
		);
		expect( home ).toContain(
			'<!-- wp:pattern {"slug":"test-theme/hidden-template-home"} /-->'
		);
		const hiddenPattern = fs.readFileSync(
			path.join(
				fixture.themeDir,
				'patterns',
				'hidden-template-home.php'
			),
			'utf8'
		);
		expect( hiddenPattern ).toContain( 'wp_get_upload_dir()["baseurl"]' );
		expect( hiddenPattern ).toContain( 'data-object-id="77"' );

		const header = fs.readFileSync(
			path.join( fixture.themeDir, 'parts', 'header.html' ),
			'utf8'
		);
		expect( header ).toContain( '<!-- wp:site-title /-->' );
	} );

	test( 'plan works without the block command too', () => {
		const fixture = makeFixture();

		const plan = runScope(
			fixture,
			'plan',
			[ `--path=${ fixture.testDir }/wordpress` ],
			{ FAKE_NO_BLOCK_COMMAND: '1' }
		);

		expect( plan.status ).toBe( 0 );
		expect( plan.stdout ).toContain( 'custom templates and parts: 2' );
	} );
} );

describe( 'wp-theme-control Node port — safety refusals', () => {
	test( 'refuses pattern content containing executable PHP syntax', () => {
		const fixture = makeFixture();

		const result = runScope(
			fixture,
			'patterns',
			[ '--dry-run', `--path=${ fixture.testDir }/wordpress` ],
			{ FAKE_PATTERN_PHP: '1' }
		);

		expect( result.status ).not.toBe( 0 );
		expect( result.stderr ).toContain( 'contains executable PHP syntax' );
	} );

	test( 'flags local absolute URLs in the captured Global Styles (report-only)', () => {
		const fixture = makeFixture();

		const result = runScope(
			fixture,
			'styles',
			[
				`--path=${ fixture.testDir }/wordpress`,
				`--state-dir=${ fixture.stateDir }`,
			],
			{ FAKE_LOCAL_URL: '1' }
		);

		expect( result.status ).toBe( 0 );
		expect( result.stderr ).toContain(
			'runtime PHP cannot be stored in JSON'
		);

		const overlay = JSON.parse(
			fs.readFileSync( fixture.overlayPath, 'utf8' )
		);
		expect( overlay.settings.color.backgroundImageUrl ).toBe(
			'http://example.test/wp-content/uploads/2026/bg.jpg'
		);
	} );
} );
