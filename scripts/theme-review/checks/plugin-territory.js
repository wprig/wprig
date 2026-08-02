/* eslint-disable no-unused-vars, @wordpress/no-unused-vars-before-return, jsdoc/require-param-type */
import fs from 'fs';
import path from 'path';
import { walkDir } from '../lib/fs-walk.js';
import { REQUIRED, WARNING } from '../lib/severity.js';

const HANDBOOK_URL =
	'https://make.wordpress.org/themes/handbook/review/required/#presentation-vs-functionality';

function run(themePath, themeSlug, options = {}) {
	const findings = [];
	const files = walkDir(themePath);
	const phpFiles = files.filter((f) => f.endsWith('.php'));

	// Environment override or CLI flag for blocks
	const allowBlocks =
		process.env.WPRIG_ALLOW_THEME_BLOCKS === '1' || options.allowBlocks;
	const blockSeverity = allowBlocks ? WARNING : REQUIRED;

	const patterns = [
		{
			regex: /\bregister_post_type\s*\(/g,
			id: 'plugin-territory.cpt',
			message:
				'Custom Post Types must be registered in a plugin, not a theme.',
			severity: REQUIRED,
		},
		{
			regex: /\bregister_taxonomy\s*\(/g,
			id: 'plugin-territory.taxonomy',
			message:
				'Custom Taxonomies must be registered in a plugin, not a theme.',
			severity: REQUIRED,
		},
		{
			regex: /\badd_shortcode\s*\(/g,
			id: 'plugin-territory.shortcode',
			message: 'Shortcodes must be registered in a plugin, not a theme.',
			severity: REQUIRED,
		},
		{
			regex: /\b(register_block_type|register_block_type_from_metadata|wp_register_block_types_from_metadata_collection)\s*\(/g,
			id: 'plugin-territory.blocks',
			message: 'Custom Blocks are considered plugin territory.',
			severity: blockSeverity,
			fixHint: allowBlocks
				? 'Blocks allowed via flag.'
				: 'Move blocks to a plugin, or run with --allow-blocks for non-wporg builds.',
		},
		{
			regex: /\b(?:class\s+)?TGM_Plugin_Activation\b/gi,
			id: 'plugin-territory.tgmpa',
			message:
				'TGM Plugin Activation is heavily restricted/prohibited by TRT.',
			severity: REQUIRED,
		},
	];

	phpFiles.forEach((absolutePath) => {
		const relativePath = path.relative(themePath, absolutePath);
		const content = fs.readFileSync(absolutePath, 'utf8');

		// Quick skip if none of the keywords are present
		if (
			!content.includes('register_') &&
			!content.includes('add_shortcode') &&
			!content.includes('TGM')
		) {
			return;
		}

		const lines = content.split('\n');
		lines.forEach((line, index) => {
			patterns.forEach((p) => {
				if (p.regex.test(line)) {
					p.regex.lastIndex = 0; // reset regex state
					findings.push({
						id: p.id,
						severity: p.severity,
						check: 'plugin-territory',
						message: p.message,
						file: relativePath,
						line: index + 1,
						handbook: HANDBOOK_URL,
						fixHint:
							p.fixHint ||
							'Remove this functionality and provide it via a companion plugin.',
					});
				}
			});
		});
	});

	return findings;
}

export { run };
