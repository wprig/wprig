const fs = require('fs');
const path = require('path');

/**
 * Lighthouse CI Configuration
 *
 * This configuration dynamically resolves the local WordPress URL from WP Rig's config files.
 */

// Load WP Rig configuration
const DEFAULT_CONFIG_PATH = path.join(__dirname, 'config/config.default.json');
const CUSTOM_CONFIG_PATH = path.join(__dirname, 'config/config.json');
const LOCAL_CONFIG_PATH = path.join(__dirname, 'config/config.local.json');

const loadConfig = (config, filePath) => {
	if (fs.existsSync(filePath)) {
		try {
			const fileContent = fs.readFileSync(filePath, 'utf-8');
			const fileConfig = JSON.parse(fileContent);
			// Shallow merge dev and browserSync to ensure we don't lose other settings
			return {
				...config,
				...fileConfig,
				dev: {
					...config.dev,
					...fileConfig.dev,
					browserSync: {
						...config.dev?.browserSync,
						...fileConfig.dev?.browserSync
					}
				}
			};
		} catch (e) {
			console.warn(`Warning: Could not parse ${filePath}`);
		}
	}
	return config;
};

// Start with default config
let wpRigConfig = {};
if (fs.existsSync(DEFAULT_CONFIG_PATH)) {
	wpRigConfig = JSON.parse(fs.readFileSync(DEFAULT_CONFIG_PATH, 'utf-8'));
}

// Layer overrides
wpRigConfig = loadConfig(wpRigConfig, CUSTOM_CONFIG_PATH);
wpRigConfig = loadConfig(wpRigConfig, LOCAL_CONFIG_PATH);

// Resolve the proxy URL
const proxyURL = wpRigConfig.dev?.browserSync?.proxyURL || 'localhost:8888';
const protocol = wpRigConfig.dev?.browserSync?.https ? 'https' : 'http';
const baseURL = `${protocol}://${proxyURL}`;

module.exports = {
	ci: {
		collect: {
			url: [
				baseURL,
				`${baseURL}/sample-page/`,
				`${baseURL}/?p=1`,
			],
			numberOfRuns: 3,
			settings: {
				preset: 'desktop',
			},
		},
		assert: {
			assertions: {
				'categories:performance': ['error', { minScore: 0.9 }],
				'categories:accessibility': ['error', { minScore: 0.9 }],
				'categories:best-practices': ['error', { minScore: 0.9 }],
				'categories:seo': ['error', { minScore: 0.9 }],
				'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
				'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
				'total-blocking-time': ['error', { maxNumericValue: 300 }],
			},
		},
		upload: {
			target: 'temporary-public-storage',
		},
	},
};
