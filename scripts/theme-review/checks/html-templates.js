/* eslint-disable no-unused-vars, @wordpress/no-unused-vars-before-return, jsdoc/require-param-type */
import fs from 'fs';
import path from 'path';
import { walkDir } from '../lib/fs-walk.js';
import { REQUIRED, INFO, WARNING } from '../lib/severity.js';

const HANDBOOK_URL =
	'https://make.wordpress.org/themes/handbook/review/required/#templates';

export function run(themePath, themeSlug) {
	const findings = [];
	const files = walkDir(themePath);

	// HTML templates should be in templates/ or parts/ directories
	const htmlFiles = files.filter(
		(f) =>
			f.endsWith('.html') &&
			(f.includes('/templates/') ||
				f.includes('/parts/') ||
				f.includes('\\templates\\') ||
				f.includes('\\parts\\'))
	);

	if (htmlFiles.length === 0) {
		// If no HTML templates, it's likely a classic theme.
		// That's fine, we skip checking.
		return findings;
	}

	htmlFiles.forEach((absolutePath) => {
		const relativePath = path.relative(themePath, absolutePath);
		const content = fs.readFileSync(absolutePath, 'utf8');

		// 1. Check for basic block markup structure (<!-- wp: -->)
		// HTML templates should ideally contain WordPress block markup
		if (!content.includes('<!-- wp:')) {
			findings.push({
				id: 'html-templates.missing-blocks',
				severity: WARNING,
				check: 'html-templates',
				message: `HTML template does not appear to contain WordPress block markup (<!-- wp: -->).`,
				file: relativePath,
				line: null,
				handbook: HANDBOOK_URL,
				fixHint: `Ensure HTML templates use valid block grammar.`,
			});
		}

		// 2. Check for hardcoded absolute URLs (often a sign of hardcoded local dev links)
		const urlRegex =
			/href=['"]?(http:\/\/(localhost|127\.0\.0\.1|wprig\.test)[^'"]*)['"]?/g;
		const lines = content.split('\n');

		lines.forEach((line, index) => {
			let match;
			while ((match = urlRegex.exec(line)) !== null) {
				findings.push({
					id: 'html-templates.hardcoded-url',
					severity: REQUIRED,
					check: 'html-templates',
					message: `Hardcoded local/development URL detected: ${match[1]}`,
					file: relativePath,
					line: index + 1,
					handbook: HANDBOOK_URL,
					fixHint: `Use relative block links or block bindings instead of hardcoding dev URLs.`,
				});
			}

			// 3. Prohibit direct <script> or <link> tags in HTML templates
			if (line.match(/<\s*(script|link\s+rel=['"]stylesheet['"]).*?>/i)) {
				findings.push({
					id: 'html-templates.enqueued-assets',
					severity: REQUIRED,
					check: 'html-templates',
					message: `Direct <script> or stylesheet <link> tags are not allowed in HTML templates.`,
					file: relativePath,
					line: index + 1,
					handbook:
						'https://make.wordpress.org/themes/handbook/review/required/#stylesheets-and-scripts',
					fixHint: `Enqueue all scripts and styles via PHP functions (e.g., wp_enqueue_scripts).`,
				});
			}
		});
	});

	return findings;
}
