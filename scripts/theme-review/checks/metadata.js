/* eslint-disable no-unused-vars, @wordpress/no-unused-vars-before-return, jsdoc/require-param-type */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { REQUIRED, WARNING, RECOMMENDED, INFO } from '../lib/severity.js';

const HANDBOOK_FILES_URL =
	'https://make.wordpress.org/themes/handbook/review/required/#9-files';

/**
 * Extract headers from a WordPress file (e.g. style.css)
 * @param content
 * @param headers
 */
function extractHeaders(content, headers) {
	const extracted = {};
	for (const header of headers) {
		const regex = new RegExp(`^[ \\t/*#@]*${header}:\\s*(.*)$`, 'mi');
		const match = content.match(regex);
		if (match) {
			extracted[header] = match[1].trim();
		}
	}
	return extracted;
}

async function run(themePath, themeSlug) {
	const findings = [];

	// 1. Check style.css
	const styleCssPath = path.join(themePath, 'style.css');
	let styleHeaders = {};
	if (!fs.existsSync(styleCssPath)) {
		findings.push({
			id: 'metadata.style-css-missing',
			severity: REQUIRED,
			check: 'metadata',
			message: 'style.css is missing.',
			file: 'style.css',
			line: null,
			handbook: HANDBOOK_FILES_URL,
			fixHint: 'Create a style.css file with required theme headers.',
		});
	} else {
		const content = fs.readFileSync(styleCssPath, 'utf8');
		const requiredHeaders = [
			'Theme Name',
			'Description',
			'Version',
			'Author',
			'Requires at least',
			'Tested up to',
			'Requires PHP',
			'License',
			'License URI',
			'Text Domain',
			'Tags',
		];
		styleHeaders = extractHeaders(content, requiredHeaders);

		requiredHeaders.forEach((header) => {
			if (!styleHeaders[header]) {
				// According to handbook, some might be WARNING/RECOMMENDED, but let's make core ones REQUIRED
				const severity = [
					'Requires at least',
					'Tested up to',
					'Requires PHP',
				].includes(header)
					? WARNING
					: REQUIRED;

				findings.push({
					id: `metadata.missing-header-${header.toLowerCase().replace(/ /g, '-')}`,
					severity,
					check: 'metadata',
					message: `style.css missing "${header}" header`,
					file: 'style.css',
					line: null,
					handbook: HANDBOOK_FILES_URL,
					fixHint: `Add \`${header}: ...\` to style.css headers`,
				});
			}
		});

		if (
			styleHeaders['Text Domain'] &&
			styleHeaders['Text Domain'] !== themeSlug
		) {
			findings.push({
				id: 'metadata.text-domain-mismatch',
				severity: REQUIRED,
				check: 'metadata',
				message: `Text Domain "${styleHeaders['Text Domain']}" does not match theme slug "${themeSlug}"`,
				file: 'style.css',
				line: null,
				handbook: HANDBOOK_FILES_URL,
				fixHint: `Change Text Domain in style.css to match the directory name.`,
			});
		}
	}

	// 2. Check readme.txt
	const readmePath = path.join(themePath, 'readme.txt');
	let readmeHeaders = {};
	if (fs.existsSync(readmePath)) {
		const content = fs.readFileSync(readmePath, 'utf8');
		readmeHeaders = extractHeaders(content, [
			'Stable tag',
			'Requires at least',
			'Tested up to',
			'License',
			'License URI',
		]);

		if (
			readmeHeaders['Stable tag'] &&
			styleHeaders.Version &&
			readmeHeaders['Stable tag'] !== styleHeaders.Version
		) {
			findings.push({
				id: 'metadata.version-mismatch',
				severity: WARNING,
				check: 'metadata',
				message: `readme.txt "Stable tag" (${readmeHeaders['Stable tag']}) differs from style.css "Version" (${styleHeaders.Version})`,
				file: 'readme.txt',
				line: null,
				handbook: HANDBOOK_FILES_URL,
				fixHint: `Sync the versions between style.css and readme.txt`,
			});
		}
	} else {
		findings.push({
			id: 'metadata.readme-missing',
			severity: RECOMMENDED,
			check: 'metadata',
			message:
				'readme.txt is missing. Recommended for WordPress.org directory.',
			file: 'readme.txt',
			line: null,
			handbook:
				'https://make.wordpress.org/themes/handbook/review/required/#theme-documentation',
			fixHint:
				'Create a readme.txt file following the standard plugin/theme format.',
		});
	}

	// 3. Check screenshot.png or screenshot.jpg
	let screenshotPath = path.join(themePath, 'screenshot.png');
	let foundScreenshot = false;
	if (fs.existsSync(screenshotPath)) {
		foundScreenshot = true;
	} else {
		screenshotPath = path.join(themePath, 'screenshot.jpg');
		if (fs.existsSync(screenshotPath)) {
			foundScreenshot = true;
		}
	}

	if (!foundScreenshot) {
		findings.push({
			id: 'metadata.screenshot-missing',
			severity: REQUIRED,
			check: 'metadata',
			message: 'screenshot.png or screenshot.jpg is missing.',
			file: 'screenshot.png',
			line: null,
			handbook: HANDBOOK_FILES_URL,
			fixHint: 'Add a screenshot.png (1200x900 recommended).',
		});
	} else {
		try {
			const metadata = await sharp(screenshotPath).metadata();
			const filename = path.basename(screenshotPath);
			if (metadata.width > 1200 || metadata.height > 900) {
				findings.push({
					id: 'metadata.screenshot-dimensions',
					severity: WARNING,
					check: 'metadata',
					message: `Screenshot dimensions (${metadata.width}x${metadata.height}) exceed 1200x900.`,
					file: filename,
					line: null,
					handbook:
						'https://make.wordpress.org/themes/handbook/review/required/#9-files',
					fixHint:
						'Resize screenshot to a maximum of 1200x900 pixels.',
				});
			}

			const ratio = metadata.width / metadata.height;
			if (Math.abs(ratio - 4 / 3) > 0.1) {
				findings.push({
					id: 'metadata.screenshot-ratio',
					severity: RECOMMENDED,
					check: 'metadata',
					message: `Screenshot aspect ratio (${ratio.toFixed(2)}) is not approximately 4:3.`,
					file: filename,
					line: null,
					handbook:
						'https://make.wordpress.org/themes/handbook/review/required/#9-files',
					fixHint:
						'Use a 4:3 aspect ratio (e.g. 1200x900) to prevent cropping.',
				});
			}
		} catch (err) {
			findings.push({
				id: 'metadata.screenshot-invalid',
				severity: REQUIRED,
				check: 'metadata',
				message:
					'Screenshot file could not be parsed as a valid image.',
				file: path.basename(screenshotPath),
				line: null,
				handbook: HANDBOOK_FILES_URL,
				fixHint: 'Ensure screenshot is a valid PNG or JPG.',
			});
		}
	}

	return findings;
}

export { run };
