// removeWpCliBlock.js
'use strict';

/**
 * Removes the specific WP CLI command block from the provided content.
 * @param {string} content - The content to process.
 * @returns {string} - The cleaned content without the WP CLI block.
 */
export default function removeWpCliBlock(content) {
	const wpCliBlockRegex = /\/\/ Add custom WP CLI commands\.\s*if\s*\(\s*defined\s*\(\s*'WP_CLI'\s*\)\s*&&\s*WP_CLI\s*\)\s*{\s*require_once\s*get_template_directory\(\)\s*\.\s*'\/wp-cli\/wp-rig-commands\.php'\s*;\s*}/gs;
	return content.replace(wpCliBlockRegex, '');
}
