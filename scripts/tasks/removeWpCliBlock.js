// removeWpCliBlock.js
'use strict';

/**
 * Removes the specific WP CLI command block from the provided content.
 * @param {string} content - The content to process.
 * @return {string} - The cleaned content without the WP CLI block.
 */
export default function removeWpCliBlock( content ) {
	const wpCliBlockRegex =
		/\/\/\s*@wp-cli:start[\s\S]*?\/\/\s*@wp-cli:end\s*/g;
	return content.replace( wpCliBlockRegex, '' );
}
