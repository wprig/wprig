import fs from 'fs';
import path from 'path';

/**
 * Recursively walk a directory and return file paths.
 *
 * @param {string}        dir         - The directory to walk.
 * @param {Array<string>} excludeDirs - Directory names to skip (e.g. node_modules)
 * @return {Array<string>} List of absolute file paths.
 */
function walkDir(
	dir,
	excludeDirs = [
		'node_modules',
		'vendor',
		'.git',
		'.svn',
		'__MACOSX',
		'artifacts',
		'scripts',
		'tests',
	]
) {
	let results = [];
	try {
		const list = fs.readdirSync(dir);
		list.forEach((file) => {
			const filePath = path.join(dir, file);
			const stat = fs.statSync(filePath);
			if (stat && stat.isDirectory()) {
				if (!excludeDirs.includes(file)) {
					results = results.concat(walkDir(filePath, excludeDirs));
				} else {
					results.push(filePath);
				}
			} else {
				results.push(filePath);
			}
		});
	} catch (err) {
		console.warn(`Error walking directory ${dir}:`, err);
	}
	return results;
}

export { walkDir };
