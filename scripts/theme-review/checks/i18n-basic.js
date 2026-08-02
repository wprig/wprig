/* eslint-disable no-unused-vars, @wordpress/no-unused-vars-before-return, jsdoc/require-param-type */
import fs from 'fs';
import path from 'path';
import { walkDir } from '../lib/fs-walk.js';
import { REQUIRED, INFO, WARNING } from '../lib/severity.js';

const HANDBOOK_URL =
	'https://make.wordpress.org/themes/handbook/review/required/#language';

export function run(themePath, themeSlug) {
	const findings = [];
	const files = walkDir(themePath);
	const phpFiles = files.filter((f) => f.endsWith('.php'));

	// 1. Determine Text Domain from style.css
	let expectedDomain = themeSlug;
	const stylePath = path.join(themePath, 'style.css');
	if (fs.existsSync(stylePath)) {
		const styleContent = fs.readFileSync(stylePath, 'utf8');
		const match = styleContent.match(/^[ \t/*#@]*Text Domain:\s*(.*)$/im);
		if (match) {
			expectedDomain = match[1].trim();
		}
	}

	// 2. Scan PHP files for translation functions with wrong domain
	// Regex looks for common translation functions and extracts the domain argument
	// Handles __(), _e(), esc_html__(), esc_attr__(), _x(), esc_html_x(), esc_attr_x(), _n(), _nx()
	// This is a heuristic regex, it won't catch everything, especially dynamic domains (which are forbidden anyway)
	const translationRegex =
		/\b(_e|__|esc_html__|esc_html_e|esc_attr__|esc_attr_e|_x|_ex|esc_html_x|esc_attr_x|_n|_nx|_n_noop|_nx_noop)\s*\(\s*(['"])(.*?)\2\s*(?:,\s*(?:[^,)]+,\s*)*(['"])(.*?)\4)?/g;

	phpFiles.forEach((absolutePath) => {
		// Skip vendor directories completely
		if (
			absolutePath.includes('/vendor/') ||
			absolutePath.includes('\\vendor\\')
		) {
			return;
		}

		const relativePath = path.relative(themePath, absolutePath);
		const content = fs.readFileSync(absolutePath, 'utf8');
		const lines = content.split('\n');

		lines.forEach((line, index) => {
			let match;
			translationRegex.lastIndex = 0; // Reset regex
			while ((match = translationRegex.exec(line)) !== null) {
				const funcName = match[1];
				// The domain is usually the 2nd argument for basic funcs, 3rd for context funcs, 4th for plural funcs.
				// Our regex is simplistic. Let's just look at the last captured string argument if it exists.
				let domain = null;

				if (
					['_n', '_x', '_ex', 'esc_html_x', 'esc_attr_x'].includes(
						funcName
					)
				) {
					// For functions with context or plural, the domain is often the 3rd argument.
					// Our basic regex might struggle here to accurately pin the domain if variables are used.
					// We will do a rough check if the last matched string group doesn't match the domain.
					domain = match[5];
				} else {
					domain = match[5];
				}

				if (domain && domain !== expectedDomain) {
					findings.push({
						id: 'i18n.wrong-domain',
						severity: REQUIRED,
						check: 'i18n-basic',
						message: `Translation function ${funcName}() uses text domain '${domain}', expected '${expectedDomain}'.`,
						file: relativePath,
						line: index + 1,
						handbook: HANDBOOK_URL,
						fixHint: `Ensure all text domains exactly match the theme slug.`,
					});
				} else if (!domain) {
					// Missing domain argument
					findings.push({
						id: 'i18n.missing-domain',
						severity: REQUIRED,
						check: 'i18n-basic',
						message: `Translation function ${funcName}() is missing the text domain argument.`,
						file: relativePath,
						line: index + 1,
						handbook: HANDBOOK_URL,
						fixHint: `Add the '${expectedDomain}' text domain to the translation function.`,
					});
				}
			}
		});
	});

	// 3. Check for .pot file (INFO level as it's generated on bundle usually)
	const languagesDir = path.join(themePath, 'languages');
	let hasPot = false;
	if (fs.existsSync(languagesDir)) {
		const langFiles = fs.readdirSync(languagesDir);
		hasPot = langFiles.some((f) => f.endsWith('.pot'));
	}

	if (!hasPot) {
		findings.push({
			id: 'i18n.missing-pot',
			severity: INFO,
			check: 'i18n-basic',
			message: `No .pot file found in /languages directory.`,
			file: 'languages/',
			line: null,
			handbook: HANDBOOK_URL,
			fixHint: `Ensure WP Rig's generatePotFile export setting is true before submitting.`,
		});
	}

	return findings;
}
