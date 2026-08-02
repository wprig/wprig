/* eslint-disable no-unused-vars, @wordpress/no-unused-vars-before-return, jsdoc/require-param-type */
import { exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);
import { REQUIRED, WARNING, INFO } from '../lib/severity.js';

const HANDBOOK_URL =
	'https://make.wordpress.org/themes/handbook/review/required/';

async function run(themePath, themeSlug, options = {}) {
	try {
		// Run the WP-CLI command. We suppress stderr because WP-CLI might output standard PHP notices or success logs to stderr.
		const { stdout, stderr } = await execPromise(
			`wp rig theme_check --path="${themePath}" --quiet`
		);

		// Attempt to parse JSON output
		let findings = [];
		try {
			findings = JSON.parse(stdout.trim());
		} catch (parseError) {
			// If we can't parse it, check if it's because Theme Check isn't installed
			if (
				stdout.includes('Theme Check plugin is not installed') ||
				stderr.includes('Theme Check plugin is not installed')
			) {
				return [
					{
						id: 'theme-check.missing',
						severity: INFO,
						check: 'theme-check',
						message:
							'Official Theme Check plugin is not installed/active. Run `wp rig review_setup` inside your WP environment to enable full theme directory QA.',
						file: '',
						handbook: HANDBOOK_URL,
					},
				];
			} else if (stderr.includes('Error:') || stdout.includes('Error:')) {
				// Output might be empty or have an error
				return [
					{
						id: 'theme-check.error',
						severity: INFO,
						check: 'theme-check',
						message: `Failed to run headless Theme Check: ${stderr.trim() || stdout.trim()}`,
						file: '',
						handbook: HANDBOOK_URL,
					},
				];
			}
			console.warn(
				'Warning: Could not parse Theme Check JSON output. Output was:',
				stdout.trim()
			);
		}

		// Enhance findings with file info and handbook URL if possible
		return findings.map((finding) => {
			// Theme Check messages often include the filename like "In file somefile.php:"
			let file = '';
			const fileMatch = finding.message.match(/in (.*?.php)/i);
			if (fileMatch) {
				file = fileMatch[1];
			}

			return {
				...finding,
				file,
				handbook: HANDBOOK_URL,
				fixHint:
					'Fix the issue flagged by the official WordPress.org Theme Check plugin.',
			};
		});
	} catch (err) {
		// exec throws an error on non-zero exit code
		const output = err.stdout || err.stderr || '';
		if (
			output.includes('Theme Check plugin is not installed') ||
			err.message.includes('not installed')
		) {
			return [
				{
					id: 'theme-check.missing',
					severity: INFO,
					check: 'theme-check',
					message:
						'Official Theme Check plugin is not installed/active. Run `wp rig review_setup` inside your WP environment to enable full theme directory QA.',
					file: '',
					handbook: HANDBOOK_URL,
				},
			];
		}

		// Fallback if WP-CLI is completely missing or other fatal error
		return [
			{
				id: 'theme-check.cli-error',
				severity: INFO,
				check: 'theme-check',
				message: `Headless Theme Check skipped (WP-CLI or Plugin issue). Run in WP Admin instead. Error: ${err.message.split('\n')[0]}`,
				file: '',
				handbook: HANDBOOK_URL,
			},
		];
	}
}

export { run };
