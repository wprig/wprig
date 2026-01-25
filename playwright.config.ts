import { defineConfig, devices } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// dotenv.config();

const configPath = path.resolve( process.cwd(), 'config/config.json' );
const config = JSON.parse( fs.readFileSync( configPath, 'utf-8' ) );

const proxyURL = config.dev.browserSync.proxyURL || 'localhost';
const protocol = config.dev.browserSync.https ? 'https' : 'http';
const wpBaseUrl = process.env.WP_BASE_URL || `${ protocol }://${ proxyURL }`;

// Set WordPress admin credentials for @wordpress/e2e-test-utils-playwright
process.env.WP_ADMIN_USER =
	process.env.WP_ADMIN_USER || config.dev.admin?.user || 'admin';
process.env.WP_ADMIN_PASSWORD =
	process.env.WP_ADMIN_PASSWORD || config.dev.admin?.password || 'password';
process.env.WP_USERNAME = process.env.WP_USERNAME || process.env.WP_ADMIN_USER;
process.env.WP_PASSWORD =
	process.env.WP_PASSWORD || process.env.WP_ADMIN_PASSWORD;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig( {
	testDir: './tests/e2e/specs',
	/* Run tests in files in parallel */
	fullyParallel: true,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !! process.env.CI,
	/* Retry on CI only */
	retries: process.env.CI ? 2 : 0,
	/* opt out of parallel tests on CI. */
	workers: process.env.CI ? 1 : undefined,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: 'html',
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL to use in actions like `await page.goto('/')`. */
		baseURL: wpBaseUrl,

		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: 'on-first-retry',

		/* Capture screenshot after each test failure. */
		screenshot: 'only-on-failure',
	},

	/* Configure projects for major browsers */
	projects: [
		{
			name: 'chromium',
			use: { ...devices[ 'Desktop Chrome' ] },
		},

		{
			name: 'firefox',
			use: { ...devices[ 'Desktop Firefox' ] },
		},

		{
			name: 'webkit',
			use: { ...devices[ 'Desktop Safari' ] },
		},

		/* Test against mobile viewports. */
		// {
		//   name: 'Mobile Chrome',
		//   use: { ...devices['Pixel 5'] },
		// },
		// {
		//   name: 'Mobile Safari',
		//   use: { ...devices['iPhone 12'] },
		// },

		/* Test against branded browsers. */
		// {
		//   name: 'Microsoft Edge',
		//   use: { ...devices['Desktop Edge'], channel: 'msedge' },
		// },
		// {
		//   name: 'Google Chrome',
		//   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
		// },
	],

	/* Run your local dev server before starting the tests */
	webServer: {
		command: 'npm run start',
		url: wpBaseUrl,
		reuseExistingServer: ! process.env.CI,
		stdout: 'ignore',
		stderr: 'pipe',
		ignoreHTTPSErrors: true,
	},
} );
