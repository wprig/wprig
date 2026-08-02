/* eslint-disable no-unused-vars, @wordpress/no-unused-vars-before-return, jsdoc/require-param-type */
import fs from 'fs';
import path from 'path';
import { walkDir } from '../lib/fs-walk.js';
import { REQUIRED, WARNING } from '../lib/severity.js';

const HANDBOOK_URL =
	'https://make.wordpress.org/themes/handbook/review/required/#security';

function run(themePath, themeSlug) {
	const findings = [];
	const files = walkDir(themePath);
	const phpFiles = files.filter((f) => f.endsWith('.php'));

	const patterns = [
		{
			regex: /\beval\s*\(/g,
			id: 'security.eval',
			message: 'eval() is prohibited.',
		},
		{
			regex: /\bbase64_decode\s*\(/g,
			id: 'security.base64_decode',
			message: 'base64_decode() is highly discouraged/prohibited.',
		},
		{
			regex: /\bbase64_encode\s*\(/g,
			id: 'security.base64_encode',
			message: 'base64_encode() is restricted.',
		},
		{
			regex: /\bgzuncompress\s*\(/g,
			id: 'security.gzuncompress',
			message: 'gzuncompress() is prohibited.',
		},
		{
			regex: /\bstr_rot13\s*\(/g,
			id: 'security.str_rot13',
			message: 'str_rot13() is prohibited.',
		},
		{
			regex: /\bcreate_function\s*\(/g,
			id: 'security.create_function',
			message: 'create_function() is deprecated and prohibited.',
		},
		{
			regex: /\b(shell_exec|system|passthru|exec)\s*\(/g,
			id: 'security.system_exec',
			message: 'System execution functions are prohibited.',
		},
	];

	phpFiles.forEach((absolutePath) => {
		// Only scan theme code, skip vendor directory heavily
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
			patterns.forEach((p) => {
				if (p.regex.test(line)) {
					p.regex.lastIndex = 0; // reset regex state
					findings.push({
						id: p.id,
						severity: REQUIRED,
						check: 'security-patterns',
						message: p.message,
						file: relativePath,
						line: index + 1,
						handbook: HANDBOOK_URL,
						fixHint:
							'Remove this function entirely. Use native WordPress APIs if needed.',
					});
				}
			});
		});
	});

	return findings;
}

export { run };
