/* eslint-disable no-unused-vars, @wordpress/no-unused-vars-before-return, jsdoc/require-param-type */
import fs from 'fs';
import path from 'path';
import { walkDir } from '../lib/fs-walk.js';
import { REQUIRED, WARNING } from '../lib/severity.js';

const HANDBOOK_URL =
	'https://make.wordpress.org/themes/handbook/review/required/#9-files';

function run(themePath, themeSlug) {
	const findings = [];
	// Use default excludeDirs to prevent deep recursion, but fs-walk will still return the excluded directory paths
	const files = walkDir(themePath);

	// Allowlist for specific xml files
	const allowedXmlFiles = [
		'phpcs.xml',
		'phpcs.xml.dist',
		'wpml-config.xml',
		'loco.xml',
	];

	files.forEach((absolutePath) => {
		const relativePath = path.relative(themePath, absolutePath);
		const basename = path.basename(relativePath).toLowerCase();

		// Directory-based exact matches (e.g., .git folder inside theme)
		if (relativePath.includes('.git/') || relativePath === '.git') {
			findings.push(
				createFinding(relativePath, 'Contains .git repository files')
			);
		}
		if (relativePath.includes('.svn/') || relativePath === '.svn') {
			findings.push(
				createFinding(relativePath, 'Contains .svn repository files')
			);
		}
		if (relativePath.includes('__macosx/') || basename === '__macosx') {
			findings.push(
				createFinding(relativePath, 'Contains macOS metadata folder')
			);
		}
		if (relativePath.includes('node_modules/')) {
			findings.push(
				createFinding(relativePath, 'Contains node_modules directory')
			);
		}

		// Exact filename matches
		const bannedNames = [
			'thumbs.db',
			'desktop.ini',
			'php.ini',
			'error_log',
			'web.config',
			'favicon.ico',
		];
		if (bannedNames.includes(basename)) {
			findings.push(
				createFinding(relativePath, `Banned file found: ${basename}`)
			);
		}

		// Extension matches
		if (basename.endsWith('.sql')) {
			findings.push(
				createFinding(
					relativePath,
					'SQL database dumps are not allowed'
				)
			);
		}
		if (basename.endsWith('.sh')) {
			findings.push(
				createFinding(relativePath, 'Shell scripts are not allowed')
			);
		}
		if (basename.endsWith('.zip')) {
			findings.push(
				createFinding(relativePath, 'Nested ZIP files are not allowed')
			);
		}
		if (
			basename.endsWith('.xml') &&
			!allowedXmlFiles.includes(basename) &&
			!basename.includes('themeunittestdata')
		) {
			findings.push(
				createFinding(
					relativePath,
					'Free-floating XML files are generally not allowed unless specific tooling (e.g. phpcs.xml)'
				)
			);
		}
	});

	return findings;
}

function createFinding(file, message) {
	return {
		id: `banned-files.${path.basename(file).toLowerCase()}`,
		severity: REQUIRED,
		check: 'banned-files',
		message,
		file,
		line: null,
		handbook: HANDBOOK_URL,
		fixHint: 'Remove the file from the theme distribution bundle.',
	};
}

export { run };
