// removeDevOnlyBlocks.js
'use strict';

/**
 * Removes any content marked with @dev-only pragmas from the provided content.
 * This allows developers to mark sections of code that should not be included
 * in the production bundle.
 *
 * @param {string} content - The content to process.
 * @return {string} - The cleaned content without the dev-only blocks.
 */
export default function removeDevOnlyBlocks(content) {
  const devOnlyBlockRegex = /\/\/\s*@dev-only:start[\s\S]*?\/\/\s*@dev-only:end\s*/g;
  return content.replace(devOnlyBlockRegex, '');
}
