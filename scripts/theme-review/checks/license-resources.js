/* eslint-disable no-unused-vars, @wordpress/no-unused-vars-before-return, jsdoc/require-param-type */
import fs from 'fs';
import path from 'path';
import { walkDir } from '../lib/fs-walk.js';
import { REQUIRED, WARNING, INFO } from '../lib/severity.js';

const HANDBOOK_URL =
	'https://make.wordpress.org/themes/handbook/review/required/#licensing';

export function run(themePath, themeSlug) {
	const findings = [];
	const files = walkDir(themePath);

	// Ensure we match across Windows and Mac separator styles
	const hasVendorCode = files.some(
		(f) =>
			f.includes(path.join('assets', 'css', 'vendor')) ||
			f.includes(path.join('assets', 'js', 'vendor')) ||
			f.includes(path.join('assets', 'fonts'))
	);

	const readmePath = path.join(themePath, 'readme.txt');
	let hasResourcesSection = false;

	if (fs.existsSync(readmePath)) {
		const readmeContent = fs.readFileSync(readmePath, 'utf8');

		// Check for == Resources == or == Credits ==
		if (readmeContent.match(/==\s*(Resources|Credits)\s*==/i)) {
			hasResourcesSection = true;
		}

		// Check for License declarations in readme
		if (!readmeContent.match(/^License:\s*.+/im)) {
			findings.push({
				id: 'license.readme-missing-license',
				severity: REQUIRED,
				check: 'license-resources',
				message: `readme.txt is missing a 'License:' declaration.`,
				file: 'readme.txt',
				line: null,
				handbook: HANDBOOK_URL,
				fixHint: `Add 'License: GPLv2 or later' to readme.txt headers.`,
			});
		}

		if (!readmeContent.match(/^License URI:\s*.+/im)) {
			findings.push({
				id: 'license.readme-missing-license-uri',
				severity: REQUIRED,
				check: 'license-resources',
				message: `readme.txt is missing a 'License URI:' declaration.`,
				file: 'readme.txt',
				line: null,
				handbook: HANDBOOK_URL,
				fixHint: `Add 'License URI: https://www.gnu.org/licenses/gpl-2.0.html' to readme.txt headers.`,
			});
		}
	}

	if (hasVendorCode && !hasResourcesSection) {
		findings.push({
			id: 'license.missing-resources-section',
			severity: WARNING, // Often a warning that leads to rejection if not fixed
			check: 'license-resources',
			message: `Third-party vendor assets or fonts were detected, but readme.txt lacks a '== Resources ==' or '== Credits ==' section.`,
			file: 'readme.txt',
			line: null,
			handbook:
				'https://make.wordpress.org/themes/handbook/review/required/#theme-documentation',
			fixHint: `Add a '== Resources ==' section to readme.txt detailing the Name, Author, License, and Source URL of all bundled assets.`,
		});
	}

	return findings;
}
