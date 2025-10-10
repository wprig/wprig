/**
 * Simple script to build blocks using @wordpress/scripts
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Check if we're in watch mode
const isWatchMode = process.argv.includes('--watch');

try {
	console.log('Building blocks using @wordpress/scripts...');

	// Run the appropriate npm script
	const command = isWatchMode
		? 'npm run start:blocks'
		: 'npm run build:blocks';

	execSync(command, { stdio: 'inherit' });

	console.log('Blocks build complete!');
} catch (error) {
	console.error('Error building blocks:', error.message);
	process.exit(1);
}
