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
const PARADIGMS_PATH = path.join(__dirname, 'paradigms.json');
const MISSING_DEFAULT_CONFIG_ERROR = `No default configuration detected. Please create the file ${DEFAULT_CONFIG_PATH}`;

// Function to load configuration from a file
const loadConfig = (config, filePath) => {
	if (fs.existsSync(filePath)) {
		const fileConfig = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
		return merge(config, fileConfig);
	}
	return config;
};

// Fail fast when the theme type is unknown so paradigm wiring can never
// silently degrade to 'classic' between the JS build and PHP runtime.
// Theme types are defined once in paradigms.json (the single source of truth).
const validateThemeType = (config) => {
	if (!fs.existsSync(PARADIGMS_PATH)) {
		throw new Error(
			`Missing paradigm definitions at ${PARADIGMS_PATH}. ` +
				'config/paradigms.json is the single source of truth for theme paradigms.'
		);
	}
	const definitions = JSON.parse(fs.readFileSync(PARADIGMS_PATH, 'utf-8'));
	const valid = Object.keys(definitions.themeTypes);
	const themeType = config?.theme?.themeType;

	if (typeof themeType !== 'string' || !valid.includes(themeType)) {
		throw new Error(
			`Invalid theme.themeType "${String(themeType)}". ` +
				`Valid values: ${valid.join(', ')}. ` +
				'Fix config/config.json or the default in config/config.default.json.'
		);
	}
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

validateThemeType(config);

// Export the config
export default config;
