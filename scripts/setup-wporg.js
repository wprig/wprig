import fs from 'fs';
import path from 'path';

/**
 * Ensures the theme is configured safely for WP.org directory submission
 * without forcing those strict limits on the global WP Rig defaults.
 *
 * @param {string} themeDir The directory containing the config folder
 */
export default function setupWporg(themeDir = process.cwd()) {
	const configDir = path.join(themeDir, 'config');
	const configPath = path.join(configDir, 'config.json');
	const defaultConfigPath = path.join(configDir, 'config.default.json');

	if (!fs.existsSync(configDir)) {
		fs.mkdirSync(configDir, { recursive: true });
	}

	let config = {};
	if (fs.existsSync(configPath)) {
		config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
	} else if (fs.existsSync(defaultConfigPath)) {
		config = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8'));
	}

	if (!config.performance) {
		config.performance = {};
	}

	// Force WP.org required defaults (they forbid stripping core hooks)
	config.performance.cleanup_meta_tags = false;

	fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
	return config;
}

// Execute if run directly from CLI
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	setupWporg();
	console.log(
		'\n✅ WP Rig configured for WordPress.org theme directory compliance.'
	);
	console.log(
		'   - Automatically set `performance.cleanup_meta_tags: false` in config.json.'
	);
	console.log('\n⚠️  Crucial Note: Custom Blocks = "Plugin Territory"');
	console.log(
		'   If your WP Rig theme includes custom blocks or block components (inc/Blocks/),'
	);
	console.log(
		'   the Theme Review Team will reject it. You must extract blocks to a companion'
	);
	console.log('   plugin before running `npm run bundle:wporg`.\n');
}
