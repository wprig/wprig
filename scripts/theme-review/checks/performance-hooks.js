/* eslint-disable no-unused-vars, @wordpress/no-unused-vars-before-return, jsdoc/require-param-type */
import fs from 'fs';
import path from 'path';
import { walkDir } from '../lib/fs-walk.js';
import { REQUIRED, WARNING } from '../lib/severity.js';

const HANDBOOK_URL =
	'https://make.wordpress.org/themes/handbook/review/required/#presentation-vs-functionality';

export function run(themePath, themeSlug, options = {}) {
	const findings = [];
	const files = walkDir(themePath);
	const phpFiles = files.filter((f) => f.endsWith('.php'));

	// Load effective config to check if cleanup_meta_tags is enabled
	let cleanupEnabled = false;
	try {
		const configPath = path.join(themePath, 'config', 'config.json');
		if (fs.existsSync(configPath)) {
			const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
			if (
				config.performance &&
				config.performance.cleanup_meta_tags === true
			) {
				cleanupEnabled = true;
			}
		} else {
			// Check default if local is missing
			const defaultConfigPath = path.join(
				themePath,
				'config',
				'config.default.json'
			);
			if (fs.existsSync(defaultConfigPath)) {
				const config = JSON.parse(
					fs.readFileSync(defaultConfigPath, 'utf8')
				);
				if (
					config.performance &&
					config.performance.cleanup_meta_tags === true
				) {
					cleanupEnabled = true;
				}
			}
		}
	} catch (err) {
		// Ignore parse errors, default to false
	}

	// If we're building for wporg AND cleanup is enabled, it's a REQUIRED failure.
	// Otherwise, if cleanup is enabled manually during dev, it's a WARNING.
	const isWpOrg = options.isWpOrg || false;
	const severity = isWpOrg ? REQUIRED : WARNING;

	const restrictedHooks = [
		'wp_generator',
		'feed_links',
		'feed_links_extra',
		'wp_resource_hints',
		'rsd_link',
		'rest_output_link_wp_head',
		'wp_oembed_add_discovery_links',
		'rel_canonical',
		'wp_shortlink_wp_head',
		'adjacent_posts_rel_link_wp_head',
	];

	phpFiles.forEach((absolutePath) => {
		const relativePath = path.relative(themePath, absolutePath);
		const content = fs.readFileSync(absolutePath, 'utf8');

		if (!content.includes('remove_action')) {
			return;
		}

		const lines = content.split('\n');
		lines.forEach((line, index) => {
			restrictedHooks.forEach((hook) => {
				const regex = new RegExp(
					`remove_action\\s*\\(\\s*['"](wp_head|template_redirect)['"]\\s*,\\s*['"]${hook}['"]`
				);
				if (regex.test(line)) {
					// If cleanup is actively enabled in config, flag it.
					// Or if they hardcoded it (cleanupEnabled might be false, but they added remove_action manually).
					// For WP Rig, Component.php contains the code, but it's only *active* if config allows.
					// However, static analysis looks at the code. If it's Component.php, we check config state.
					// If it's somewhere else, we always flag it.

					if (relativePath.includes('Performance/Component.php')) {
						if (cleanupEnabled) {
							findings.push({
								id: `performance-hooks.${hook}`,
								severity,
								check: 'performance-hooks',
								message: `Removal of non-presentational hook '${hook}' detected in active configuration.`,
								file: relativePath,
								line: index + 1,
								handbook: HANDBOOK_URL,
								fixHint: `Run 'npm run theme:setup-wporg' to correctly configure your theme for WP.org directory compliance (or set 'cleanup_meta_tags: false' manually in config.json).`,
							});
						}
					} else {
						findings.push({
							id: `performance-hooks.${hook}`,
							severity: REQUIRED, // Hardcoded manual removal is always required fail for wp.org
							check: 'performance-hooks',
							message: `Manual removal of non-presentational hook '${hook}' detected.`,
							file: relativePath,
							line: index + 1,
							handbook: HANDBOOK_URL,
							fixHint: `Themes must not remove non-presentational core functionality.`,
						});
					}
				}
			});
		});
	});

	return findings;
}
