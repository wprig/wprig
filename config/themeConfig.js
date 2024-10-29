'use strict';

// External dependencies
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import merge from 'deepmerge';

// Constants for paths and error messages
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_CONFIG_PATH = path.join(__dirname, 'config.default.json');
const CUSTOM_CONFIG_PATH = path.join(__dirname, 'config.json');
const LOCAL_CONFIG_PATH = path.join(__dirname, 'config.local.json');
const MISSING_DEFAULT_CONFIG_ERROR = `No default configuration detected. Please create the file ${DEFAULT_CONFIG_PATH}`;

// Function to load configuration from a file
const loadConfig = (config, filePath) => {
	if (fs.existsSync(filePath)) {
		const fileConfig = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
		return merge(config, fileConfig);
	}
	return config;
};

// Ensure the default configuration file exists
if (!fs.existsSync(DEFAULT_CONFIG_PATH)) {
	console.error(MISSING_DEFAULT_CONFIG_ERROR);
	process.exit(1);
}

// Load configurations in sequence
let config = JSON.parse(fs.readFileSync(DEFAULT_CONFIG_PATH, 'utf-8'));
config = loadConfig(config, CUSTOM_CONFIG_PATH);
config = loadConfig(config, LOCAL_CONFIG_PATH);

// Export the config
export default config;
