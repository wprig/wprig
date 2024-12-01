import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Initialize __dirname manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Specify the paths to the files you want to modify.
const fseFolders = [
	'../parts',
	'../templates',
];

function checkAndCreateFolders(folderPaths) {
	folderPaths.forEach((folderPath) => {
		try {
			// Check if the folder exists.
			const fullPath = path.resolve(__dirname, folderPath);
			if (!fs.existsSync(fullPath)) {
				// If the folder does not exist, create it.
				fs.mkdirSync(fullPath);
				console.log(`Folder "${fullPath}" created.`);
			} else {
				console.log(`Folder "${fullPath}" already exists.`);
			}
		} catch (error) {
			console.error(`Error checking/creating folder "${folderPath}": ${error.message}`);
		}
	});
}

function createBlankIndexHtml(templatesFolderPath) {
	try {
		// Ensure the templates folder exists.
		const fullTemplatesPath = path.resolve(__dirname, templatesFolderPath);
		if (!fs.existsSync(fullTemplatesPath)) {
			fs.mkdirSync(fullTemplatesPath, { recursive: true });
		}

		// Create the path for the new index.html file.
		const indexPath = path.join(fullTemplatesPath, 'index.html');

		// Check if the file already exists.
		if (fs.existsSync(indexPath)) {
			console.log(`index.html already exists at ${indexPath}.`);
			return;
		}

		// Create a blank index.html file.
		fs.writeFileSync(indexPath, '', 'utf8');
		console.log(`Blank index.html created at ${indexPath} successfully.`);
	} catch (error) {
		console.error(`Error creating blank index.html: ${error.message}`);
	}
}

// Continue with other functions...

checkAndCreateFolders(fseFolders);
createBlankIndexHtml('../templates');
// Call other functions with their appropriate paths...
