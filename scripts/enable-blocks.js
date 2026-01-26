import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.resolve(__dirname, '../config/config.json');
const sourceDir = path.resolve(__dirname, '../optional/Blocks');
const destDir = path.resolve(__dirname, '../inc/Blocks');

if (!fs.existsSync(configPath)) {
    console.error('Config file not found. Please ensure config/config.json exists.');
    process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

if (config.theme && config.theme.enableBlocks) {
    console.log('Blocks are already enabled.');
    process.exit(0);
}

// Move the component
if (fs.existsSync(sourceDir)) {
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    // Simple copy for the component files
    fs.cpSync(sourceDir, destDir, { recursive: true });
    console.log('Blocks component moved to inc/Blocks.');
} else {
    console.error('Optional Blocks component not found in optional/Blocks.');
    process.exit(1);
}

// Update Config
if (!config.theme) {
    config.theme = {};
}
config.theme.enableBlocks = true;
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log('Theme configuration updated: enableBlocks set to true.');

console.log('Success! You can now use "npm run block:new" to create blocks.');
