/* eslint-disable no-unused-vars, @wordpress/no-unused-vars-before-return, jsdoc/require-param-type */
import fs from 'fs';
import path from 'path';
import { walkDir } from '../lib/fs-walk.js';
import { REQUIRED, WARNING, INFO } from '../lib/severity.js';

const HANDBOOK_URL =
	'https://make.wordpress.org/themes/handbook/review/required/#privacy';

function run(themePath, themeSlug) {
	const findings = [];
	const files = walkDir(themePath);
	const scanExtensions = ['.php', '.html', '.css', '.js'];
	const targetFiles = files.filter((f) =>
		scanExtensions.some((ext) => f.endsWith(ext))
	);

	const remoteHosts = [
		'cdnjs.cloudflare.com',
		'cdn.jsdelivr.net',
		'unpkg.com',
		'stackpath.bootstrapcdn.com',
		'maxcdn.bootstrapcdn.com',
		'kit.fontawesome.com',
		'code.jquery.com',
	];

	targetFiles.forEach((absolutePath) => {
		// Skip vendor and artifacts
		if (
			absolutePath.includes('/vendor/') ||
			absolutePath.includes('/artifacts/')
		) {
			return;
		}

		const relativePath = path.relative(themePath, absolutePath);
		const content = fs.readFileSync(absolutePath, 'utf8');
		const lines = content.split('\n');

		lines.forEach((line, index) => {
			// 1. Google Fonts Exception
			if (
				line.includes('fonts.googleapis.com') ||
				line.includes('fonts.gstatic.com')
			) {
				findings.push({
					id: 'remote-resources.google-fonts',
					severity: INFO,
					check: 'remote-resources',
					message:
						'Google Fonts detected. Allowed per exception, but local bundling is preferred for GDPR compliance.',
					file: relativePath,
					line: index + 1,
					handbook: HANDBOOK_URL,
					fixHint: 'Consider using the WP Rig local font downloader.',
				});
			}

			// 2. Prohibited CDNs
			remoteHosts.forEach((host) => {
				if (line.includes(host)) {
					findings.push({
						id: `remote-resources.cdn.${host.replace(/\./g, '-')}`,
						severity: REQUIRED,
						check: 'remote-resources',
						message: `External resource from ${host} detected. Themes must bundle resources locally.`,
						file: relativePath,
						line: index + 1,
						handbook: HANDBOOK_URL,
						fixHint: `Download the resource and load it locally from the theme assets directory.`,
					});
				}
			});
		});
	});

	return findings;
}

export { run };
